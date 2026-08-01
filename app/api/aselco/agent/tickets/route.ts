import { NextResponse } from "next/server";
import { AGENT_TICKETS_STORE } from "@/lib/aselcoStore";

export async function GET(request: Request) {
  const ticketsList = Object.values(AGENT_TICKETS_STORE).sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

  return NextResponse.json({
    success: true,
    tickets: ticketsList,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, action, agentName } = body;

    if (!ticketId || !AGENT_TICKETS_STORE[ticketId]) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = AGENT_TICKETS_STORE[ticketId];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === "ACCEPT") {
      ticket.status = "ASSIGNED";
      ticket.assignedAgentName = agentName || "ASelco Support Officer";
      ticket.lastUpdated = new Date().toISOString();
      ticket.messages.push({
        id: `msg_sys_${Date.now()}`,
        ticketId,
        sender: "agent",
        senderName: ticket.assignedAgentName,
        text: `👋 Hello! I am ${ticket.assignedAgentName} from ASelco Customer Care. I have reviewed your account and previous conversation with our AI. How can I assist you today?`,
        timestamp,
      });
    } else if (action === "RESOLVE") {
      ticket.status = "RESOLVED";
      ticket.lastUpdated = new Date().toISOString();
      ticket.messages.push({
        id: `msg_sys_${Date.now()}`,
        ticketId,
        sender: "agent",
        senderName: ticket.assignedAgentName || "ASelco Support",
        text: "✅ This support session has been marked as RESOLVED. Thank you for choosing ASelco!",
        timestamp,
      });
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update ticket" }, { status: 500 });
  }
}
