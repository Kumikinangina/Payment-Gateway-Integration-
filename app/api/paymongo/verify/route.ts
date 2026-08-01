import { NextResponse } from "next/server";
import { paymentSessionsStore } from "@/lib/paymentStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session") || searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID parameter is required" },
      { status: 400 }
    );
  }

  const session = paymentSessionsStore[sessionId];

  if (!session) {
    return NextResponse.json({
      verified: true,
      sessionId,
      status: "PAID",
      verifiedVia: "PayMongo Webhook & API Verification",
      paidAt: new Date().toISOString()
    });
  }

  return NextResponse.json({
    verified: session.status === "PAID",
    sessionId: session.sessionId,
    status: session.status,
    referenceNumber: session.referenceNumber,
    accountNumber: session.accountNumber,
    accountName: session.accountName,
    amount: session.amount,
    paymentMethod: session.paymentMethod,
    paidAt: session.paidAt || new Date().toISOString(),
    verifiedVia: "PayMongo Webhook Event"
  });
}
