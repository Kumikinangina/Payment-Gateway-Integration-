import { NextResponse } from "next/server";

// Simulated ASELCO (Agusan del Sur Electric Cooperative) Central Consumer Database
const ASELCO_DATABASE: Record<
  string,
  {
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
> = {
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
    amountDue: 2150.50,
    dueDate: "2026-08-18",
    status: "UNPAID",
    disconnectionNotice: false,
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountNumber = searchParams.get("accountNumber")?.trim();

  if (!accountNumber) {
    return NextResponse.json(
      { error: "Account Number is required" },
      { status: 400 }
    );
  }

  // Lookup account in ASELCO central database
  const record = ASELCO_DATABASE[accountNumber];

  if (record) {
    return NextResponse.json({
      found: true,
      data: record,
      message: "ASELCO Consumer Record found."
    });
  }

  // Fallback generation for dynamic unlisted meter numbers
  return NextResponse.json({
    found: true,
    data: {
      accountNumber,
      accountName: "ASELCO Consumer",
      meterNumber: `MTR-${Math.floor(1000 + Math.random() * 9000)}`,
      address: "Agusan del Sur Franchise Area",
      billingPeriod: "July 2026",
      kwhConsumed: 120,
      amountDue: 1200.0,
      dueDate: "2026-08-15",
      status: "UNPAID",
      disconnectionNotice: false,
    },
    message: "Dynamic ASELCO account balance loaded."
  });
}
