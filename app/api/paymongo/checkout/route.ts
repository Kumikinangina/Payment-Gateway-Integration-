import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountNumber, accountName, amount, paymentMethod } = body;

    if (!accountNumber || !accountName || !amount) {
      return NextResponse.json(
        { error: "Account Number, Account Name, and Bill Amount are required." },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY || "sk_test_placeholder";
    const refNumber = `ASELCO-${Math.floor(100000 + Math.random() * 900000)}`;
    const amountInCentavos = Math.max(100, Math.round(Number(amount) * 100));

    // Check if live API key is available
    const isPlaceholderKey =
      !secretKey ||
      secretKey.includes("placeholder") ||
      secretKey === "MY_PAYMONGO_KEY";

    if (!isPlaceholderKey) {
      try {
        const basicAuth = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

        const paymongoPayload = {
          data: {
            attributes: {
              line_items: [
                {
                  amount: amountInCentavos,
                  currency: "PHP",
                  description: `ASELCO Electric Bill for Account #${accountNumber}`,
                  name: `ASELCO Bill - ${accountName}`,
                  quantity: 1,
                },
              ],
              payment_method_types: [paymentMethod || "gcash"],
              description: "ASELCO Electric Bill Payment",
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              reference_number: refNumber,
              success_url: `https://aselco.ph/payment/success?ref=${refNumber}`,
              cancel_url: `https://aselco.ph/payment/cancel?ref=${refNumber}`,
            },
          },
        };

        const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: basicAuth,
          },
          body: JSON.stringify(paymongoPayload),
        });

        if (response.ok) {
          const resData = await response.json();
          const checkoutUrl = resData?.data?.attributes?.checkout_url;
          const sessionId = resData?.data?.id;

          return NextResponse.json({
            success: true,
            checkoutUrl,
            sessionId,
            referenceNumber: refNumber,
            isSimulated: false,
          });
        }
      } catch (err) {
        console.error("PayMongo API call error:", err);
      }
    }

    // Interactive simulated PayMongo portal response for Vercel testing & prototype preview
    const simulatedSessionId = `cs_test_${Math.random().toString(36).substring(2, 14)}`;
    const simulatedUrl = `/portal?session=${simulatedSessionId}&method=${paymentMethod}&amount=${amount}&account=${encodeURIComponent(
      accountNumber
    )}&name=${encodeURIComponent(accountName)}&ref=${refNumber}`;

    return NextResponse.json({
      success: true,
      checkoutUrl: simulatedUrl,
      sessionId: simulatedSessionId,
      referenceNumber: refNumber,
      isSimulated: true,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create PayMongo payment session." },
      { status: 500 }
    );
  }
}
