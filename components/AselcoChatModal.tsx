"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  User,
  X,
  Send,
  Zap,
  CreditCard,
  History,
  AlertTriangle,
  Headphones,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  ChevronRight
} from "lucide-react";

interface AselcoChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountNumber?: string;
  onPayBillFromChat?: (accountNumber: string, amount: string, name: string) => void;
  onViewReceiptFromChat?: (refNumber: string) => void;
}

interface MessageItem {
  id: string;
  sender: "user" | "ai" | "agent";
  senderName?: string;
  text: string;
  timestamp: string;
  type?: "text" | "bill_card" | "payment_history" | "service_report" | "agent_handoff";
  cardData?: any;
  quickActions?: { label: string; action: string }[];
}

export default function AselcoChatModal({
  isOpen,
  onClose,
  defaultAccountNumber = "12-8849-2015",
  onPayBillFromChat,
  onViewReceiptFromChat,
}: AselcoChatModalProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<"IDLE" | "WAITING" | "ASSIGNED" | "RESOLVED">("IDLE");
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial AI welcome greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "m_welcome",
          sender: "ai",
          text: "Hi! How can I help you today? I am your ASelco AI Assistant. You can choose a quick action below or type your inquiry.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          quickActions: [
            { label: "View My Electric Bill", action: "View My Electric Bill" },
            { label: "Check Amount Due", action: "Check Amount Due" },
            { label: "Payment Status", action: "Payment Status" },
            { label: "Payment History", action: "Show my payment history" },
            { label: "Report Power Problem", action: "Report an Electrical Problem" },
            { label: "Contact ASelco Agent", action: "Contact an ASelco Agent" },
          ],
        },
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Poll for live human agent messages when waiting or assigned
  useEffect(() => {
    if (!ticketId || agentStatus === "IDLE" || agentStatus === "RESOLVED") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/aselco/agent/messages?ticketId=${ticketId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            if (data.ticket?.status === "ASSIGNED") {
              setAgentStatus("ASSIGNED");
              setAssignedAgentName(data.ticket.assignedAgentName || "ASelco Support");
            } else if (data.ticket?.status === "RESOLVED") {
              setAgentStatus("RESOLVED");
            }
          }
        }
      } catch (err) {
        console.warn("Polling agent messages error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [ticketId, agentStatus]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessageObj: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessageObj]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/aselco/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          accountNumber: defaultAccountNumber,
          ticketId: ticketId,
        }),
      });

      const data = await res.json();

      if (data.ticketId) {
        setTicketId(data.ticketId);
      }

      if (data.type === "agent_handoff" || data.status === "WAITING_FOR_AGENT") {
        setAgentStatus("WAITING");
      }

      const aiReplyObj: MessageItem = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: data.replyText || "I have received your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: data.type || "text",
        cardData: data.cardData,
        quickActions: data.quickActions,
      };

      setMessages((prev) => [...prev, aiReplyObj]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "ai",
          text: "Sorry, I encountered a connection issue. Please try again or contact support.",
          timestamp: timeStr,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-lg w-full h-[620px] flex flex-col overflow-hidden border border-slate-200">
        {/* Chat Header */}
        <div className="bg-blue-900 text-white p-3.5 flex items-center justify-between shrink-0 shadow">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow">
                {agentStatus === "ASSIGNED" ? (
                  <Headphones className="w-5 h-5 text-blue-950" />
                ) : (
                  <Bot className="w-6 h-6 text-blue-950" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-blue-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-sm leading-tight">
                  {agentStatus === "ASSIGNED"
                    ? assignedAgentName || "ASelco Support Specialist"
                    : "ASelco AI Assistant"}
                </h3>
                <span className="bg-blue-800 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                  {agentStatus === "ASSIGNED" ? "HUMAN AGENT" : "AI AGENT"}
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Account #{defaultAccountNumber} • Official ASelco Care
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-blue-200 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Agent Connection Status Banner */}
        {agentStatus === "WAITING" && (
          <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-3 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
              <span>Connecting to an ASelco Agent... Ticket #{ticketId}</span>
            </div>
            <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-full font-bold">
              Queue Pos: 1
            </span>
          </div>
        )}

        {agentStatus === "ASSIGNED" && (
          <div className="bg-emerald-100 border-b border-emerald-200 text-emerald-900 px-3 py-2 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Connected with Agent {assignedAgentName}</span>
            </div>
            <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full font-bold">
              LIVE AGENT CHAT
            </span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100/70">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Sender label */}
              <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1 px-1">
                {msg.sender === "user" ? (
                  <span>You</span>
                ) : msg.sender === "agent" ? (
                  <span className="font-bold text-blue-700">ASelco Agent ({msg.senderName})</span>
                ) : (
                  <span className="font-bold text-blue-900 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-500 inline" />
                    <span>ASelco AI Assistant</span>
                  </span>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed space-y-3 ${
                  msg.sender === "user"
                    ? "bg-blue-900 text-white rounded-br-xs"
                    : msg.sender === "agent"
                    ? "bg-blue-50 border border-blue-200 text-slate-900 rounded-bl-xs"
                    : "bg-white border border-slate-200 text-slate-900 rounded-bl-xs"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* 1. ELECTRIC BILL CARD */}
                {msg.type === "bill_card" && msg.cardData && (
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 space-y-2.5 shadow-lg mt-2 text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-xs text-amber-400 tracking-wider">
                          ELECTRIC BILL STATEMENT
                        </span>
                      </div>
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {msg.cardData.status || "UNPAID"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Consumer:</span>
                        <span className="font-bold text-slate-100">{msg.cardData.accountName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Account No:</span>
                        <span className="font-bold font-mono text-amber-300">
                          {msg.cardData.accountNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Billing Period:</span>
                        <span className="font-medium text-slate-300">{msg.cardData.billingPeriod}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Consumption:</span>
                        <span className="font-bold text-blue-300">{msg.cardData.kwhConsumed} kWh</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 rounded-lg p-2.5 flex items-center justify-between border border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Amount Due:</span>
                        <span className="text-base font-black text-emerald-400">
                          ₱{parseFloat(msg.cardData.amountDue).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Due Date:</span>
                        <span className="text-xs font-bold text-amber-300">{msg.cardData.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() =>
                          onPayBillFromChat?.(
                            msg.cardData.accountNumber,
                            String(msg.cardData.amountDue),
                            msg.cardData.accountName
                          )
                        }
                        className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-lg text-xs font-black shadow transition flex items-center justify-center space-x-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Bill Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. PAYMENT HISTORY CARD */}
                {msg.type === "payment_history" && Array.isArray(msg.cardData) && (
                  <div className="space-y-1.5 mt-2">
                    {msg.cardData.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.period}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.ref} • {item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-900">{item.amount}</p>
                          <button
                            onClick={() => onViewReceiptFromChat?.(item.ref)}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center justify-end space-x-0.5"
                          >
                            <span>Receipt</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. SERVICE REPORT CARD */}
                {msg.type === "service_report" && msg.cardData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1.5 mt-2 text-left">
                    <div className="flex items-center space-x-1 font-bold text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Report # {msg.cardData.id}</span>
                    </div>
                    <p className="text-[11px]">
                      <strong>Location:</strong> {msg.cardData.location}
                    </p>
                    <p className="text-[11px]">
                      <strong>Status:</strong> {msg.cardData.status}
                    </p>
                  </div>
                )}

                {/* Quick Action Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {msg.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(qa.action)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-bold rounded-lg transition shadow-xs"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic p-1">
              <Bot className="w-4 h-4 animate-bounce text-blue-800" />
              <span>ASelco AI is formulating response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="bg-white border-t border-slate-200 p-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                agentStatus === "ASSIGNED"
                  ? "Type message to ASelco Agent..."
                  : "Type inquiry or choose quick action..."
              }
              className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-300 focus:border-blue-700 focus:bg-white rounded-xl text-xs font-medium focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Verified ASelco Customer Care System</span>
            <button
              onClick={() => handleSendMessage("Contact an ASelco Agent")}
              className="text-blue-700 font-bold hover:underline flex items-center space-x-0.5"
            >
              <Headphones className="w-3 h-3" />
              <span>Request Human Agent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
