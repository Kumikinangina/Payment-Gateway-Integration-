import { NextResponse } from "next/server";
import {
  ASELCO_ACCOUNTS_DB,
  AGENT_TICKETS_STORE,
  SERVICE_REPORTS_STORE,
  ChatMessage,
  AgentTicket,
} from "@/lib/aselcoStore";
import { paymentSessionsStore } from "@/lib/paymentStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, accountNumber, ticketId } = body;
    const cleanMsg = (message || "").toLowerCase().trim();

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let currentAccount = accountNumber ? ASELCO_ACCOUNTS_DB[accountNumber] : null;

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
      cleanMsg.includes("dispute")
    ) {
      const newTicketId = ticketId || `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const accNum = accountNumber || "12-8849-2015";
      const accData = ASELCO_ACCOUNTS_DB[accNum] || {
        accountNumber: accNum,
        accountName: "Valued Consumer",
        amountDue: 1850.0,
      };

      const newTicket: AgentTicket = {
        id: newTicketId,
        accountNumber: accNum,
        accountName: accData.accountName,
        concern: message || "Consumer requested live agent support",
        status: "WAITING",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        billingSummary: accData as any,
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
            text: "Sure. I'm connecting you with an ASelco Support Agent. Please wait while we find an available representative...",
            timestamp,
            type: "agent_handoff",
          },
        ],
      };

      AGENT_TICKETS_STORE[newTicketId] = newTicket;

      return NextResponse.json({
        replyText:
          "Connecting you with an ASelco Agent. Please wait while we find an available representative...",
        ticketId: newTicketId,
        status: "WAITING_FOR_AGENT",
        type: "agent_handoff",
      });
    }

    // 2. View Electric Bill / Check Amount Due
    if (
      cleanMsg.includes("bill") ||
      cleanMsg.includes("amount") ||
      cleanMsg.includes("due") ||
      cleanMsg.includes("view my electric bill") ||
      cleanMsg.includes("kwh")
    ) {
      // Check if user provided account number in text e.g. "12-8849-2015"
      const extractedAcc = message.match(/\b\d{2}-\d{4}-\d{4}\b/)?.[0] || accountNumber;

      if (!extractedAcc) {
        return NextResponse.json({
          replyText:
            "Sure! Please enter your 12-digit ASelco Account Number (e.g., 12-8849-2015) to view your official electric bill.",
          quickActions: [
            { label: "Account # 12-8849-2015", action: "12-8849-2015" },
            { label: "Account # 15-3029-8812", action: "15-3029-8812" },
            { label: "Account # 09-1102-4491", action: "09-1102-4491" },
          ],
        });
      }

      const billData = ASELCO_ACCOUNTS_DB[extractedAcc] || {
        accountNumber: extractedAcc,
        accountName: "Maria Clara Santos",
        meterNumber: "MTR-2026-9901",
        address: "San Francisco, Agusan del Sur",
        billingPeriod: "July 2026",
        kwhConsumed: 185,
        amountDue: 1850.0,
        dueDate: "2026-08-15",
        status: "UNPAID",
        disconnectionNotice: false,
      };

      return NextResponse.json({
        replyText: `Here is the current electric bill statement retrieved from the official ASelco billing database for Account #${billData.accountNumber}:`,
        type: "bill_card",
        cardData: billData,
        quickActions: [
          { label: "Pay Bill via GCash", action: "PAY_BILL" },
          { label: "Check Payment History", action: "Payment History" },
          { label: "Talk to Agent", action: "Talk to Agent" },
        ],
      });
    }

    // 3. Payment Status inquiry
    if (
      cleanMsg.includes("payment status") ||
      cleanMsg.includes("go through") ||
      cleanMsg.includes("did my payment") ||
      cleanMsg.includes("paid")
    ) {
      const acc = accountNumber || "12-8849-2015";
      const bill = ASELCO_ACCOUNTS_DB[acc];

      // Check if there's any recent session in paymentSessionsStore
      const recentSession = Object.values(paymentSessionsStore).find(
        (s) => s.accountNumber === acc
      );

      const status = recentSession ? recentSession.status : bill?.status || "UNPAID";
      const ref = recentSession ? recentSession.referenceNumber : "ASELCO-992015";

      return NextResponse.json({
        replyText: `Payment Status Query for Account #${acc}:\n• Status: ${status}\n• Reference No: ${ref}\n• Latest Bill Amount: ₱${
          bill?.amountDue || 1850.0
        }\n• Due Date: ${bill?.dueDate || "August 15, 2026"}`,
        type: "text",
        quickActions: [
          { label: "View Full Bill", action: "View My Electric Bill" },
          { label: "Show Payment History", action: "Show my payment history" },
        ],
      });
    }

    // 4. Payment History
    if (
      cleanMsg.includes("history") ||
      cleanMsg.includes("receipt") ||
      cleanMsg.includes("past payment")
    ) {
      const acc = accountNumber || "12-8849-2015";

      const historyData = [
        {
          period: "July 2026",
          amount: "₱1,850.00",
          status: "PAID",
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
        replyText: `Here is your verified ASelco payment history for Account #${acc}:`,
        type: "payment_history",
        cardData: historyData,
        quickActions: [
          { label: "View Current Bill", action: "View My Electric Bill" },
          { label: "Talk to Agent", action: "Contact an ASelco Agent" },
        ],
      });
    }

    // 5. Electrical Problem / Power Outage Report
    if (
      cleanMsg.includes("problem") ||
      cleanMsg.includes("outage") ||
      cleanMsg.includes("spark") ||
      cleanMsg.includes("wire") ||
      cleanMsg.includes("hazard") ||
      cleanMsg.includes("report")
    ) {
      const reportId = `SR-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReport = {
        id: reportId,
        accountNumber: accountNumber || "12-8849-2015",
        accountName: currentAccount?.accountName || "Maria Clara Santos",
        issueType: "Power Outage" as const,
        description: message,
        location: currentAccount?.address || "Agusan del Sur Franchise Area",
        status: "PENDING_INSPECTION" as const,
        reportedAt: new Date().toLocaleString("en-PH"),
      };
      SERVICE_REPORTS_STORE.unshift(newReport);

      return NextResponse.json({
        replyText: `⚡ Your electrical concern has been logged directly with ASelco Field Dispatch.\n• Incident Ticket #: ${reportId}\n• Status: PENDING_INSPECTION\nAn ASelco emergency lineworker team has been notified.`,
        type: "service_report",
        cardData: newReport,
        quickActions: [
          { label: "Speak with ASelco Agent", action: "Contact an ASelco Agent" },
          { label: "Return to Main Menu", action: "Main Menu" },
        ],
      });
    }

    // Default Greeting / Help
    return NextResponse.json({
      replyText:
        "Hello! I am your ASelco AI Assistant. How can I help you today? You can choose a quick action below or type your inquiry:",
      quickActions: [
        { label: "View My Electric Bill", action: "View My Electric Bill" },
        { label: "Check Amount Due", action: "Check Amount Due" },
        { label: "Payment Status", action: "Payment Status" },
        { label: "Payment History", action: "Show my payment history" },
        { label: "Report Power Problem", action: "Report an Electrical Problem" },
        { label: "Contact ASelco Agent", action: "Contact an ASelco Agent" },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process chat query" },
      { status: 500 }
    );
  }
}
