// Centralized in-memory session store for PayMongo payment verification
export interface PaymentSession {
  sessionId: string;
  referenceNumber: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  paymentMethod: "gcash" | "paymaya";
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  paidAt?: string;
}

export const paymentSessionsStore: Record<string, PaymentSession> = {};
