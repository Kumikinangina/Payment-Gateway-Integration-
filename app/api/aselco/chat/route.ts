import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  ASELCO_ACCOUNTS_DB,
  AGENT_TICKETS_STORE,
  SERVICE_REPORTS_STORE,
  ChatMessage,
  AgentTicket,
} from "@/lib/aselcoStore";
import { paymentSessionsStore } from "@/lib/paymentStore";

// Initialize Gemini API client if API key exists
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

    // Check if there is an active agent ticket
    if (ticketId && AGENT_TICKETS_STORE[ticketId]) {
      const activeTicket = AGENT_TICKETS_STORE[ticketId];
      // Append user message
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

    // 1. Human Agent Request
    if (
      cleanMsg.includes("agent") ||
      cleanMsg.includes("human") ||
      cleanMsg.includes("representative") ||
      cleanMsg.includes("talk to an agent") ||
      cleanMsg.includes("contact aselco agent") ||
      cleanMsg.includes("dispute")
    ) {
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

    // 2. View Electric Bill Card (Explicit Card Trigger)
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

    // 3. Payment History (Explicit Card Trigger)
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

    // 4. Electrical Problem / Power Outage Report Trigger
    if (
      cleanMsg === "report an electrical problem" ||
      cleanMsg.includes("outage hazard") ||
      cleanMsg.includes("sparking wire")
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

    // 5. Dynamic AI Generation via Gemini AI for ALL User Queries
    let aiGeneratedReply = "";

    if (ai) {
      try {
        const systemInstruction = `
You are the official, friendly, and highly knowledgeable AI Assistant for ASELCO (Agusan del Sur Electric Cooperative, Inc.).
Your goal is to help consumers in Agusan del Sur with electricity billing, account inquiries, payment options, power outages, area office locations, disconnection notices, and energy conservation tips.

Current Consumer Context:
- Account Number: ${currentAccount.accountNumber}
- Account Name: ${currentAccount.accountName}
- Meter Number: ${currentAccount.meterNumber}
- Address: ${currentAccount.address}
- Billing Period: ${currentAccount.billingPeriod}
- Consumption: ${currentAccount.kwhConsumed} kWh
- Amount Due: ₱${currentAccount.amountDue.toFixed(2)}
- Due Date: ${currentAccount.dueDate}
- Payment Status: ${currentAccount.status}
- Disconnection Notice Active: ${currentAccount.disconnectionNotice ? "YES (Priority Warning)" : "NO"}

ASELCO Area Offices & Coverage:
1. Bayugan Area Office: Serves Bayugan City and Esperanza.
2. San Francisco Area Office: Serves San Francisco and nearby towns like Rosario.
3. Talacogon Area Office: Serves Talacogon and surrounding communities.
4. Trento Area Office: Serves Trento, Santa Josefa, and neighboring southern areas.

ASELCO App Features:
- Direct GCash & PayMongo online payment integration
- QR Ph Code Scanner for reading bill statements
- Real-time Field Outage & Maintenance dispatch reporting
- Live Human Agent Escalation

Instructions:
- Provide a clear, natural, helpful, and concise response (1-3 paragraphs) tailored specifically to ASELCO and the user's query.
- Use a polite, courteous, professional tone suitable for a Philippine electric cooperative customer service assistant.
- Mention relevant account specifics or area office information if pertinent to their question.
- Do NOT output robotic generic template text. Provide genuine, intelligent answers to the user's specific prompt.
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        });

        aiGeneratedReply = response.text || "";
      } catch (genErr: any) {
        console.warn("Gemini AI API call error, using contextual fallback:", genErr);
      }
    }

    // Fallback contextual AI response if Gemini API key is not configured or fails
    if (!aiGeneratedReply) {
      if (cleanMsg.includes("office") || cleanMsg.includes("location") || cleanMsg.includes("where")) {
        aiGeneratedReply = `ASELCO operates four main Area Offices across Agusan del Sur:\n\n• Bayugan Area Office: Serves Bayugan City & Esperanza\n• San Francisco Area Office: Serves San Francisco & Rosario\n• Talacogon Area Office: Serves Talacogon & surrounding areas\n• Trento Area Office: Serves Trento, Santa Josefa, & southern municipalities\n\nYour account (#${currentAccNum}) is registered under ${currentAccount.address}.`;
      } else if (cleanMsg.includes("pay") || cleanMsg.includes("gcash") || cleanMsg.includes("qr") || cleanMsg.includes("online")) {
        aiGeneratedReply = `You can easily pay your ASELCO electric bill for Account #${currentAccNum} (₱${currentAccount.amountDue.toFixed(2)}) using our online payment system:\n\n1. Click "View My Electric Bill" or "Pay Bill" in the app.\n2. Select GCash, Credit/Debit Card, or Scan Bill QR Ph Code.\n3. Complete payment to receive an instant official digital receipt.`;
      } else if (cleanMsg.includes("disconnect") || cleanMsg.includes("notice") || cleanMsg.includes("cut")) {
        aiGeneratedReply = `Regarding Disconnection Notices for Account #${currentAccNum}:\n\n${
          currentAccount.disconnectionNotice
            ? "⚠️ Notice Active: Your account has an outstanding balance of ₱" + currentAccount.amountDue.toFixed(2) + " with an active disconnection notice. Please settle payment immediately via GCash or at any ASELCO Area Office to avoid power interruption."
            : "✅ Status Clear: Account #" + currentAccNum + " currently has no active disconnection notices. Due date is " + currentAccount.dueDate + "."
        }`;
      } else {
        aiGeneratedReply = `Hello ${currentAccount.accountName}! Thank you for reaching out to ASELCO Customer Care.\n\nRegarding your inquiry: "${message}"\n\nFor Account #${currentAccNum}, your current bill for ${currentAccount.billingPeriod} is ₱${currentAccount.amountDue.toFixed(2)} (${currentAccount.kwhConsumed} kWh consumed, Due: ${currentAccount.dueDate}). You can pay online via GCash/PayMongo, view your full bill, or request a live support agent if you need further assistance!`;
      }
    }

    // Determine relevant quick actions based on user message
    const quickActions = [
      { label: "View My Electric Bill", action: "View My Electric Bill" },
      { label: "Pay Bill via GCash", action: "view my electric bill" },
      { label: "Report Power Outage", action: "Report an Electrical Problem" },
      { label: "Talk to ASelco Agent", action: "Contact ASelco Agent" },
    ];

    return NextResponse.json({
      replyText: aiGeneratedReply,
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

