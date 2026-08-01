import { NextResponse } from "next/server";
import { AGENT_TICKETS_STORE, ChatMessage } from "@/lib/aselcoStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId || !AGENT_TICKETS_STORE[ticketId]) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    ticket: AGENT_TICKETS_STORE[ticketId],
    messages: AGENT_TICKETS_STORE[ticketId].messages,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, text, agentName } = body;

    if (!ticketId || !AGENT_TICKETS_STORE[ticketId]) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = AGENT_TICKETS_STORE[ticketId];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAgentMsg: ChatMessage = {
      id: `msg_ag_${Date.now()}`,
      ticketId,
      sender: "agent",
      senderName: agentName || ticket.assignedAgentName || "ASelco Support",
      text,
      timestamp,
    };

    ticket.messages.push(newAgentMsg);
    ticket.lastUpdated = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: newAgentMsg,
      ticket,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post agent message" }, { status: 500 });
  }
}
