import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  ASELCO_ACCOUNTS_DB,
  AGENT_TICKETS_STORE,
  SERVICE_REPORTS_STORE,
  ChatMessage,
  AgentTicket,
} from "@/lib/aselcoStore";

// Helper function to call Gemini AI with robust model fallbacks
async function getGeminiResponse(
  userMessage: string,
  systemInstruction: string
): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("No Gemini API key found in environment variables.");
    return null;
  }

  // 1. Try GoogleGenAI SDK with standard supported model names
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  
  try {
    const aiClient = new GoogleGenAI({ apiKey });
    for (const model of modelsToTry) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        });
        if (response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn(`Gemini SDK model [${model}] error:`, err?.message || err);
      }
    }
  } catch (sdkErr: any) {
    console.warn("GoogleGenAI SDK initialization failed:", sdkErr);
  }

  // 2. Direct REST API fallback if SDK calls fail or throw model errors
  for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [{ parts: [{ text: userMessage }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (restErr: any) {
      console.warn(`Gemini REST model [${model}] error:`, restErr);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, accountNumber, ticketId } = body;
    const cleanMsg = (message || "").toLowerCase().trim();

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentAccNum = accountNumber || "12-8849-2015";
    const currentAccount = ASELCO_ACCOUNTS_DB[currentAccNum] || {
      accountNumber: currentAccNum,
      accountName: "Maria Clara Santos",
      meterNumber: "MTR-2026-9901",
      address: "Purok 3, San Francisco, Agusan del Sur (San Francisco Area Office)",
      billingPeriod: "July 2026",
      kwhConsumed: 185,
      amountDue: 1850.0,
      dueDate: "2026-08-15",
      status: "UNPAID",
      disconnectionNotice: false,
    };

    // Check if there is an active agent ticket session
    if (ticketId && AGENT_TICKETS_STORE[ticketId]) {
      const activeTicket = AGENT_TICKETS_STORE[ticketId];
      const userMsgObj: ChatMessage = {
        id: `msg_${Date.now()}`,
        ticketId,
        sender: "user",
        text: message,
        timestamp,
      };
      activeTicket.messages.push(userMsgObj);
      activeTicket.lastUpdated = new Date().toISOString();

      if (activeTicket.status === "ASSIGNED") {
        return NextResponse.json({
          status: "HUMAN_AGENT_ACTIVE",
          message: userMsgObj,
          ticket: activeTicket,
        });
      }
    }

    // 1. Explicit Live Human Agent Escalation Triggers ONLY
    const explicitAgentRequests = [
      "contact aselco agent",
      "talk to an agent",
      "talk to agent",
      "speak to human agent",
      "talk to a human",
      "request live agent",
      "connect to agent",
      "human agent support",
    ];

    if (explicitAgentRequests.includes(cleanMsg)) {
      const newTicketId = ticketId || `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTicket: AgentTicket = {
        id: newTicketId,
        accountNumber: currentAccNum,
        accountName: currentAccount.accountName,
        concern: message || "Consumer requested live agent support",
        status: "WAITING",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        billingSummary: currentAccount as any,
        messages: [
          {
            id: `msg_u_${Date.now()}`,
            ticketId: newTicketId,
            sender: "user",
            text: message,
            timestamp,
          },
          {
            id: `msg_a_${Date.now() + 1}`,
            ticketId: newTicketId,
            sender: "ai",
            text: "Sure! I am connecting you with an ASelco Support Specialist. Please wait while we assign an available representative...",
            timestamp,
            type: "agent_handoff",
          },
        ],
      };

      AGENT_TICKETS_STORE[newTicketId] = newTicket;

      return NextResponse.json({
        replyText:
          "Connecting you with an ASelco Support Agent. Please wait while an available representative picks up your ticket...",
        ticketId: newTicketId,
        status: "WAITING_FOR_AGENT",
        type: "agent_handoff",
      });
    }

    // 2. Explicit View Electric Bill Card Trigger
    if (
      cleanMsg === "view my electric bill" ||
      cleanMsg === "check amount due" ||
      cleanMsg === "pay_bill" ||
      cleanMsg === "view bill card"
    ) {
      return NextResponse.json({
        replyText: `Here is the current electric bill statement retrieved from the official ASELCO database for Account #${currentAccount.accountNumber}:`,
        type: "bill_card",
        cardData: currentAccount,
        quickActions: [
          { label: "Pay Bill via GCash", action: "PAY_BILL" },
          { label: "Check Payment History", action: "Show my payment history" },
          { label: "Talk to Agent", action: "Contact ASelco Agent" },
        ],
      });
    }

    // 3. Explicit Payment History Card Trigger
    if (
      cleanMsg === "show my payment history" ||
      cleanMsg === "payment history" ||
      cleanMsg === "past receipts"
    ) {
      const historyData = [
        {
          period: "July 2026",
          amount: `₱${currentAccount.amountDue.toFixed(2)}`,
          status: currentAccount.status,
          ref: "PAYMONGO-883921",
          date: "July 28, 2026",
        },
        {
          period: "June 2026",
          amount: "₱1,720.50",
          status: "PAID",
          ref: "PAYMONGO-771029",
          date: "June 25, 2026",
        },
        {
          period: "May 2026",
          amount: "₱1,690.00",
          status: "PAID",
          ref: "PAYMONGO-660192",
          date: "May 26, 2026",
        },
      ];

      return NextResponse.json({
        replyText: `Here is your verified ASELCO payment transaction history for Account #${currentAccNum}:`,
        type: "payment_history",
        cardData: historyData,
        quickActions: [
          { label: "View Current Bill", action: "View My Electric Bill" },
          { label: "Contact ASelco Agent", action: "Contact ASelco Agent" },
        ],
      });
    }

    // 4. Explicit Report Electrical Problem Card Trigger
    if (
      cleanMsg === "report an electrical problem" ||
      cleanMsg === "report power outage"
    ) {
      const reportId = `SR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReport = {
        id: reportId,
        accountNumber: currentAccNum,
        accountName: currentAccount.accountName,
        issueType: "Power Outage" as const,
        description: message,
        location: currentAccount.address,
        status: "PENDING_INSPECTION" as const,
        reportedAt: new Date().toLocaleString("en-PH"),
      };
      SERVICE_REPORTS_STORE.unshift(newReport);

      return NextResponse.json({
        replyText: `⚡ Your electrical concern has been logged directly with ASELCO Field Dispatch.\n• Incident Ticket #: ${reportId}\n• Status: PENDING_INSPECTION\n• Location: ${currentAccount.address}\nAn ASELCO emergency lineworker team has been notified.`,
        type: "service_report",
        cardData: newReport,
        quickActions: [
          { label: "Speak with ASelco Agent", action: "Contact ASelco Agent" },
          { label: "View My Bill", action: "View My Electric Bill" },
        ],
      });
    }

    // 5. Dynamic AI Generation via Gemini AI for ALL Custom User Questions
    const systemInstruction = `
You are the official, friendly, and highly intelligent AI Customer Assistant for ASELCO (Agusan del Sur Electric Cooperative, Inc.).
Your primary role is to interact naturally with consumers in Agusan del Sur, answering their questions accurately and thoughtfully regarding electricity billing, rates, power outages, area offices, payment channels, disconnection policies, senior citizen discounts, net metering, and safety tips.

CONSUMER & ACCOUNT CONTEXT:
- Account Number: ${currentAccount.accountNumber}
- Consumer Name: ${currentAccount.accountName}
- Meter Number: ${currentAccount.meterNumber}
- Service Address: ${currentAccount.address}
- Current Billing Period: ${currentAccount.billingPeriod}
- Consumption: ${currentAccount.kwhConsumed} kWh
- Total Amount Due: ₱${currentAccount.amountDue.toFixed(2)}
- Payment Due Date: ${currentAccount.dueDate}
- Account Status: ${currentAccount.status}
- Disconnection Notice: ${currentAccount.disconnectionNotice ? "ACTIVE WARNING (Requires Immediate Payment)" : "None"}

ASELCO AREA OFFICES & COVERAGE:
1. Bayugan Area Office: Serves Bayugan City and Esperanza.
2. San Francisco Area Office: Serves San Francisco, Rosario, and nearby barangays.
3. Talacogon Area Office: Serves Talacogon, La Paz, and surrounding river towns.
4. Trento Area Office: Serves Trento, Santa Josefa, Veruela, and southern Agusan del Sur.

ASELCO ONLINE PAYMENT CHANNELS:
- GCash & PayMongo (instant verification in app)
- QR Ph Code Scanner (scan official bill QR code)
- Major Banks & Over-the-counter Area Offices

INSTRUCTIONS:
- Directly answer the user's custom question or inquiry with relevant, accurate, and detailed information.
- Speak in a warm, polite, professional, and helpful tone (Philippine English / conversational).
- Do NOT output robotic or repetitive template greetings. Address the user's specific prompt directly.
- If relevant, reference their account details or specific area office to make the response personalized.
`;

    let aiReplyText = await getGeminiResponse(message, systemInstruction);

    // Fallback if Gemini API key is missing or calls failed
    if (!aiReplyText) {
      if (cleanMsg.includes("office") || cleanMsg.includes("location") || cleanMsg.includes("where") || cleanMsg.includes("address")) {
        aiReplyText = `ASELCO operates four main Area Offices across Agusan del Sur:\n\n• Bayugan Area Office: Serves Bayugan City & Esperanza\n• San Francisco Area Office: Serves San Francisco & Rosario\n• Talacogon Area Office: Serves Talacogon & surrounding towns\n• Trento Area Office: Serves Trento, Santa Josefa, & southern areas\n\nYour account (#${currentAccNum}) is served by the ${currentAccount.address}.`;
      } else if (cleanMsg.includes("pay") || cleanMsg.includes("gcash") || cleanMsg.includes("qr") || cleanMsg.includes("online") || cleanMsg.includes("bank")) {
        aiReplyText = `You can settle your electric bill for Account #${currentAccNum} (Amount Due: ₱${currentAccount.amountDue.toFixed(2)}) conveniently online:\n\n1. Select "Pay Bill via GCash" or click "View My Electric Bill".\n2. Pay via GCash, Credit/Debit Card, or Scan Bill QR Ph Code.\n3. An official ASELCO e-receipt is generated immediately.`;
      } else if (cleanMsg.includes("disconnect") || cleanMsg.includes("notice") || cleanMsg.includes("cut")) {
        aiReplyText = `Regarding Disconnection Notices for Account #${currentAccNum}:\n\n${
          currentAccount.disconnectionNotice
            ? "⚠️ Notice Active: Your account has an outstanding balance of ₱" + currentAccount.amountDue.toFixed(2) + ". Please settle payment immediately via GCash or at any ASELCO Area Office to avoid service interruption."
            : "✅ Status Clear: Account #" + currentAccNum + " currently has no active disconnection notices. Due date is " + currentAccount.dueDate + "."
        }`;
      } else if (cleanMsg.includes("rate") || cleanMsg.includes("kwh") || cleanMsg.includes("high") || cleanMsg.includes("compute") || cleanMsg.includes("increase")) {
        aiReplyText = `Your July 2026 electric consumption for Account #${currentAccNum} is ${currentAccount.kwhConsumed} kWh, totaling ₱${currentAccount.amountDue.toFixed(2)} (approx ₱10.00/kWh effective distribution rate). Rates may fluctuate slightly based on generation costs from WESM and power suppliers.`;
      } else {
        aiReplyText = `Thank you for your inquiry regarding: "${message}".\n\nFor Account #${currentAccNum} (${currentAccount.accountName}), your current bill for ${currentAccount.billingPeriod} is ₱${currentAccount.amountDue.toFixed(2)} (Due: ${currentAccount.dueDate}). If you have specific questions about rates, meter readings, or field service, feel free to ask or connect with an ASELCO specialist!`;
      }
    }

    const quickActions = [
      { label: "View My Electric Bill", action: "View My Electric Bill" },
      { label: "Pay Bill via GCash", action: "view my electric bill" },
      { label: "Report Power Outage", action: "Report an Electrical Problem" },
      { label: "Talk to ASelco Agent", action: "Contact ASelco Agent" },
    ];

    return NextResponse.json({
      replyText: aiReplyText,
      type: "text",
      quickActions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process chat query" },
      { status: 500 }
    );
  }
}


