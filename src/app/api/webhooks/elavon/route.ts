import { createHash, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  collectMissingEnvIssues,
  extractGatewayId,
  verifyAndSettlePaymentLink,
  type VerifiablePaymentLink,
} from '@/lib/payment-verification';

/**
 * Elavon payment notification endpoint.
 *
 * Security model: the request body is treated as an untrusted hint, never as
 * proof of payment. We only use it to find which payment link the event is
 * about, then ask Elavon's API directly (authenticated with our merchant
 * credentials) whether that link's session has settled. A spoofed request can
 * therefore at most trigger a re-check; it can never mark a link as paid.
 *
 * Optional shared secret: when ELAVON_WEBHOOK_SECRET is set, requests must
 * also present it via `Authorization: Bearer <secret>`, an `x-webhook-secret`
 * header, or a `?secret=<secret>` query param on the notification URL
 * configured in Elavon.
 */

type Payload = Record<string, unknown>;

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function hasValidSharedSecret(request: Request, secret: string): boolean {
  const url = new URL(request.url);
  const authorization = request.headers.get('authorization');
  const presented =
    (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null) ||
    request.headers.get('x-webhook-secret') ||
    url.searchParams.get('secret');

  if (!presented) return false;

  // Compare fixed-length digests so the check is constant-time.
  return timingSafeEqual(sha256(presented), sha256(secret));
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNested(payload: Payload, key: string, nestedKey: string): unknown {
  const parent = payload[key];
  return parent && typeof parent === 'object' ? (parent as Payload)[nestedKey] : undefined;
}

/** Candidate `payment_links.link_token` values (set as orderReference in /api/payments/start). */
function extractReferenceTokens(payload: Payload): string[] {
  return [
    payload.orderReference,
    payload.reference,
    payload.merchantTransactionId,
    payload.customReference,
    readNested(payload, 'order', 'reference'),
    readNested(payload, 'order', 'orderReference'),
  ]
    .map(readString)
    .filter((value): value is string => Boolean(value));
}

/** Candidate `payment_links.gateway_payment_id` values. */
function extractGatewayIds(payload: Payload): string[] {
  const resource = readString(payload.resource);

  return [
    payload.paymentLink,
    readNested(payload, 'paymentLink', 'id'),
    resource?.includes('/payment-links/') ? resource : null,
  ]
    .map(extractGatewayId)
    .filter((value): value is string => Boolean(value));
}

async function recordWebhookEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: { eventId: string; eventType: string; payload: Payload; processed: boolean }
) {
  const { error } = await supabase.from('webhook_events').insert({
    event_id: event.eventId,
    event_type: event.eventType,
    provider: 'elavon',
    payload: event.payload,
    processed: event.processed,
  });

  if (error) {
    if (error.code === '23505') {
      // Unique violation: Elavon redelivered an event we already logged.
      console.warn(`[webhooks/elavon] Event ${event.eventId} already recorded in webhook_events.`);
    } else {
      console.error(`[webhooks/elavon] Failed to insert webhook_events row for ${event.eventId}:`, error);
    }
  }
}

export async function POST(request: Request) {
  const missingEnv = collectMissingEnvIssues();
  if (missingEnv.length > 0) {
    missingEnv.forEach((issue) => console.error(`[webhooks/elavon] ${issue}`));
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const sharedSecret = process.env.ELAVON_WEBHOOK_SECRET;
  if (sharedSecret) {
    if (!hasValidSharedSecret(request, sharedSecret)) {
      console.warn('[webhooks/elavon] Rejected request with missing or invalid shared secret.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn(
      '[webhooks/elavon] ELAVON_WEBHOOK_SECRET is not set; relying on Elavon API verification only.'
    );
  }

  let payload: Payload;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Payload is not a JSON object');
    }
    payload = parsed as Payload;
  } catch (parseError: unknown) {
    console.error('[webhooks/elavon] Invalid JSON payload:', parseError);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventId = readString(payload.id) || readString(payload.eventId) || `evt_${Date.now()}`;
  const eventType = readString(payload.eventType) || readString(payload.type) || 'unknown';

  try {
    const supabase = createAdminClient();

    // 1. Resolve the payment link from the payload hints. Separate .eq()
    //    lookups keep payload values out of PostgREST filter syntax.
    const lookups: Array<[column: string, value: string]> = [
      ...extractReferenceTokens(payload).map((value) => ['link_token', value] as [string, string]),
      ...extractGatewayIds(payload).map((value) => ['gateway_payment_id', value] as [string, string]),
    ];

    let linkData: Payload | null = null;

    for (const [column, value] of lookups) {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq(column, value)
        .maybeSingle();

      if (error) {
        console.error(`[webhooks/elavon] Lookup failed (${column}=${value}):`, error);
        continue;
      }

      if (data) {
        linkData = data as Payload;
        break;
      }
    }

    if (!linkData) {
      console.warn(
        `[webhooks/elavon] Event ${eventId} (${eventType}) did not match any payment link.`,
        { lookups }
      );
      await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: false });
      // 200 so Elavon does not keep retrying an event we can never match.
      return NextResponse.json({ received: true, status: 'unmatched' });
    }

    const link = linkData as unknown as VerifiablePaymentLink & { paid_at?: string | null };

    if (link.status === 'paid' && link.paid_at) {
      await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: true });
      return NextResponse.json({ received: true, status: 'already_paid' });
    }

    if (!link.gateway_payment_id) {
      console.warn(
        `[webhooks/elavon] Event ${eventId} matched link ${link.id}, but it has no gateway_payment_id to verify against.`
      );
      await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: false });
      return NextResponse.json({ received: true, status: 'unverifiable' });
    }

    // 2. Confirm with Elavon using OUR stored session id, then persist.
    const outcome = await verifyAndSettlePaymentLink(supabase, link);

    if (outcome.isPaid && !outcome.updated) {
      console.error(
        `[webhooks/elavon] Link ${link.id} settled at gateway but payment_links could not be updated.`
      );
      await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: false });
      // 500 so Elavon retries delivery.
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    if (outcome.error) {
      console.error(`[webhooks/elavon] Gateway verification failed for link ${link.id}: ${outcome.error}`);
      await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: false });
      return NextResponse.json({ error: 'Gateway verification failed' }, { status: 502 });
    }

    await recordWebhookEvent(supabase, { eventId, eventType, payload, processed: true });

    if (outcome.isPaid) {
      console.log(
        `[webhooks/elavon] Event ${eventId} (${eventType}): link ${link.id} verified with Elavon and marked paid.`
      );
      return NextResponse.json({ received: true, status: 'paid' });
    }

    console.log(
      `[webhooks/elavon] Event ${eventId} (${eventType}): link ${link.id} not settled at gateway ` +
        `(status: ${outcome.gatewayStatus || 'unknown'}).`
    );
    return NextResponse.json({ received: true, status: 'not_settled' });
  } catch (error: unknown) {
    console.error('[webhooks/elavon] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
