import { NextResponse } from "next/server";
import { paymentSessionsStore } from "@/lib/paymentStore";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("PayMongo Webhook Event Received:", JSON.stringify(payload, null, 2));

    const eventType = payload?.data?.attributes?.type || "checkout_session.payment.paid";
    const sessionId = payload?.data?.attributes?.data?.id || payload?.sessionId;

    if (sessionId && paymentSessionsStore[sessionId]) {
      if (eventType === "checkout_session.payment.paid" || eventType === "payment.paid") {
        paymentSessionsStore[sessionId].status = "PAID";
        paymentSessionsStore[sessionId].paidAt = new Date().toISOString();
        console.log(`Backend Webhook: Session ${sessionId} marked as PAID.`);
      }
    }

    return NextResponse.json({
      received: true,
      status: "SUCCESS",
      message: "Webhook processed and payment status updated."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
