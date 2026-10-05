import Link from "next/link";
import { MailCheck } from "lucide-react";

interface CheckEmailPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams;
  const email = params.email;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <MailCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Check your email
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          We sent a confirmation link to your email address.
        </p>

        {email && (
          <p className="mt-2 break-all text-sm font-medium text-slate-700">
            {email}
          </p>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}