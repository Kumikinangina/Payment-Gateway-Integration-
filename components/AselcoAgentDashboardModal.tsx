"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Headphones,
  UserCheck,
  MessageSquare,
  X,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  User,
  Hash,
  MapPin,
  Calendar,
  DollarSign,
  Activity
} from "lucide-react";

interface AselcoAgentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AselcoAgentDashboardModal({
  isOpen,
  onClose,
}: AselcoAgentDashboardModalProps) {
  const [agentStatus, setAgentStatus] = useState<"ONLINE" | "AWAY" | "OFFLINE">("ONLINE");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [agentName, setAgentName] = useState("Agent Mark (San Francisco Station)");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tickets periodically
  const fetchTickets = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/aselco/agent/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (!selectedTicketId && data.tickets?.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch agent tickets:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const handleAcceptTicket = async () => {
    if (!selectedTicketId) return;
    try {
      await fetch("/api/aselco/agent/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          action: "ACCEPT",
          agentName,
        }),
      });
      fetchTickets();
    } catch (err) {
      console.error("Accept ticket error:", err);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;
    try {
      await fetch("/api/aselco/agent/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          action: "RESOLVE",
          agentName,
        }),
      });
      fetchTickets();
    } catch (err) {
      console.error("Resolve ticket error:", err);
    }
  };

  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      await fetch("/api/aselco/agent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          text: replyText,
          agentName,
        }),
      });
      setReplyText("");
      fetchTickets();
    } catch (err) {
      console.error("Agent send message error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[680px] flex flex-col overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-400 text-slate-950 p-2 rounded-xl shadow font-black">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-base">ASelco Agent Support Operations Portal</h2>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  OFFICIAL DASHBOARD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Consumer Chat Dispatch & Resolution Console
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Agent Status Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                onClick={() => setAgentStatus("ONLINE")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  agentStatus === "ONLINE"
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>Online</span>
              </button>
              <button
                onClick={() => setAgentStatus("AWAY")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  agentStatus === "AWAY"
                    ? "bg-amber-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Away</span>
              </button>
              <button
                onClick={() => setAgentStatus("OFFLINE")}
                className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                  agentStatus === "OFFLINE"
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Offline</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Queue Tickets */}
          <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-900" />
                <span>Active Queue ({tickets.length})</span>
              </span>
              <button
                onClick={fetchTickets}
                className="p-1 rounded text-slate-500 hover:text-slate-900 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active consumer requests in queue.
                </div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col space-y-1.5 ${
                      selectedTicketId === t.id
                        ? "bg-blue-900 text-white border-blue-900 shadow-md"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{t.accountName}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          t.status === "WAITING"
                            ? "bg-amber-400 text-blue-950"
                            : t.status === "ASSIGNED"
                            ? "bg-emerald-400 text-blue-950"
                            : "bg-slate-300 text-slate-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className={`text-[11px] line-clamp-1 ${selectedTicketId === t.id ? "text-blue-200" : "text-slate-500"}`}>
                      {t.concern}
                    </p>

                    <div className={`flex items-center justify-between text-[10px] ${selectedTicketId === t.id ? "text-blue-300" : "text-slate-400"}`}>
                      <span>Acc #{t.accountNumber}</span>
                      <span>{t.id}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Middle & Right Main Panel: Selected Consumer Ticket */}
          {selectedTicket ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Consumer Info Top Banner */}
              <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{selectedTicket.accountName}</h3>
                    <p className="text-xs text-slate-500">
                      Meter Acc #{selectedTicket.accountNumber} • Concern: {selectedTicket.concern}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedTicket.status === "WAITING" && (
                    <button
                      onClick={handleAcceptTicket}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Accept Consumer Chat</span>
                    </button>
                  )}

                  {selectedTicket.status === "ASSIGNED" && (
                    <button
                      onClick={handleResolveTicket}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Stream & Account Details Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Chat Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {selectedTicket.messages?.map((msg: any, i: number) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === "agent" ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                        {msg.sender === "agent"
                          ? `ASelco Agent (${msg.senderName || "You"})`
                          : msg.sender === "ai"
                          ? "ASelco AI Assistant"
                          : "Consumer"}
                      </span>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === "agent"
                            ? "bg-blue-900 text-white rounded-br-xs"
                            : msg.sender === "ai"
                            ? "bg-amber-50 border border-amber-200 text-slate-800"
                            : "bg-white border border-slate-200 text-slate-900"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Account Context Sidebar */}
                <div className="w-64 border-l border-slate-200 p-3 bg-slate-50 space-y-3 overflow-y-auto text-xs shrink-0">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                    Consumer Meter Profile
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Meter Number</span>
                      <span className="font-bold font-mono text-slate-800">
                        {selectedTicket.billingSummary?.meterNumber || "MTR-2026-9901"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Billing Period</span>
                      <span className="font-medium text-slate-700">July 2026</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Amount Due</span>
                      <span className="font-black text-amber-600">
                        ₱{selectedTicket.billingSummary?.amountDue || "1,850.00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bill Status</span>
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px]">
                        {selectedTicket.billingSummary?.status || "UNPAID"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-900 space-y-1">
                    <p className="font-bold">⚡ ASelco Agent Note:</p>
                    <p className="text-[10px] text-blue-800 leading-snug">
                      Review prior AI conversation context before answering to prevent consumer repetition.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Reply Input */}
              <form
                onSubmit={handleSendAgentMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={selectedTicket.status === "RESOLVED"}
                  placeholder={
                    selectedTicket.status === "WAITING"
                      ? "Accept ticket above to start live messaging..."
                      : "Type official ASelco Agent reply..."
                  }
                  className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-blue-700 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || selectedTicket.status === "WAITING"}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a consumer support ticket from the queue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
