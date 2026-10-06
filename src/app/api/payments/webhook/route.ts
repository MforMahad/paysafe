import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    console.log("MockGateway webhook received:", {
      contentType: request.headers.get("content-type"),
      body,
    });

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook receiver error:", error);

    return NextResponse.json(
      { error: "Webhook receiver failed." },
      { status: 500 }
    );
  }
}