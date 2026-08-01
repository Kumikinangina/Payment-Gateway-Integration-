import { NextResponse } from "next/server";
import { paymentSessionsStore } from "@/lib/paymentStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountNumber, accountName, amount, paymentMethod } = body;

    const sessionId = `cs_${Math.random().toString(36).substring(2, 12)}`;
    const referenceNumber = `ASELCO-${Math.floor(100000 + Math.random() * 900000)}`;
    const numericAmount = parseFloat(amount) || 0;

    // Save initial session state as PENDING in backend store
    paymentSessionsStore[sessionId] = {
      sessionId,
      referenceNumber,
      accountNumber,
      accountName,
      amount: numericAmount,
      paymentMethod: paymentMethod === "paymaya" ? "paymaya" : "gcash",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    // Construct hosted PayMongo Checkout / Portal URL
    const checkoutUrl = `/portal?session=${sessionId}&ref=${referenceNumber}&method=${paymentMethod}&amount=${numericAmount}&account=${encodeURIComponent(accountNumber)}&name=${encodeURIComponent(accountName)}`;

    return NextResponse.json({
      success: true,
      sessionId,
      referenceNumber,
      checkoutUrl,
      status: "PENDING",
      message: "PayMongo checkout session created. Payment status is PENDING."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
