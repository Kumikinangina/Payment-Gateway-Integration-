export interface AselcoAccount {
  accountNumber: string;
  accountName: string;
  meterNumber: string;
  address: string;
  billingPeriod: string;
  kwhConsumed: number;
  amountDue: number;
  dueDate: string;
  status: "UNPAID" | "PAID";
  disconnectionNotice: boolean;
}

export interface ChatMessage {
  id: string;
  ticketId: string;
  sender: "user" | "ai" | "agent";
  senderName?: string;
  text: string;
  timestamp: string;
  type?: "text" | "bill_card" | "payment_history" | "service_report" | "agent_handoff" | "payment_success";
  cardData?: any;
  quickActions?: { label: string; action: string }[];
}

export interface AgentTicket {
  id: string;
  accountNumber: string;
  accountName: string;
  concern: string;
  status: "WAITING" | "ASSIGNED" | "RESOLVED";
  assignedAgentName?: string;
  createdAt: string;
  lastUpdated: string;
  messages: ChatMessage[];
  billingSummary?: AselcoAccount;
}

export interface ServiceReport {
  id: string;
  accountNumber: string;
  accountName: string;
  issueType: "Power Outage" | "Low Voltage" | "Sparking Wires / Meter Hazard" | "Billing Dispute" | "Meter Replacement";
  description: string;
  location: string;
  status: "PENDING_INSPECTION" | "DISPATCHED" | "RESOLVED";
  reportedAt: string;
}

// In-Memory Database Stores
export const ASELCO_ACCOUNTS_DB: Record<string, AselcoAccount> = {
  "12-8849-2015": {
    accountNumber: "12-8849-2015",
    accountName: "Maria Clara Santos",
    meterNumber: "MTR-2026-9901",
    address: "Purok 3, San Francisco, Agusan del Sur",
    billingPeriod: "July 2026",
    kwhConsumed: 185,
    amountDue: 1850.0,
    dueDate: "2026-08-15",
    status: "UNPAID",
    disconnectionNotice: false,
  },
  "15-3029-8812": {
    accountNumber: "15-3029-8812",
    accountName: "Santos General Store",
    meterNumber: "MTR-2026-4420",
    address: "National Highway, Bayugan City, Agusan del Sur",
    billingPeriod: "July 2026",
    kwhConsumed: 342,
    amountDue: 3420.75,
    dueDate: "2026-08-10",
    status: "UNPAID",
    disconnectionNotice: true,
  },
  "09-1102-4491": {
    accountNumber: "09-1102-4491",
    accountName: "Juan Dela Cruz",
    meterNumber: "MTR-2026-1188",
    address: "Barangay Poblacion, Prosperidad, Agusan del Sur",
    billingPeriod: "July 2026",
    kwhConsumed: 98,
    amountDue: 980.0,
    dueDate: "2026-08-20",
    status: "UNPAID",
    disconnectionNotice: false,
  },
  "18-9901-4432": {
    accountNumber: "18-9901-4432",
    accountName: "Elena Rostata",
    meterNumber: "MTR-2026-7731",
    address: "Zone 2, Trenton, Rosario, Agusan del Sur",
    billingPeriod: "July 2026",
    kwhConsumed: 215,
    amountDue: 2150.5,
    dueDate: "2026-08-18",
    status: "UNPAID",
    disconnectionNotice: false,
  },
};

export const AGENT_TICKETS_STORE: Record<string, AgentTicket> = {};
export const SERVICE_REPORTS_STORE: ServiceReport[] = [];

// Seed an initial demo support request ticket for the agent dashboard
const demoTicketId = "TKT-8021";
AGENT_TICKETS_STORE[demoTicketId] = {
  id: demoTicketId,
  accountNumber: "15-3029-8812",
  accountName: "Santos General Store",
  concern: "Meter spark warning & disconnection inquiry",
  status: "WAITING",
  createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  lastUpdated: new Date(Date.now() - 2 * 60000).toISOString(),
  billingSummary: ASELCO_ACCOUNTS_DB["15-3029-8812"],
  messages: [
    {
      id: "m1",
      ticketId: demoTicketId,
      sender: "user",
      text: "I want to speak with an agent regarding my disconnection notice for Bayugan branch.",
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: "m2",
      ticketId: demoTicketId,
      sender: "ai",
      text: "Connecting you with an ASelco Support Specialist. Please hold on...",
      timestamp: new Date(Date.now() - 14 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
};
