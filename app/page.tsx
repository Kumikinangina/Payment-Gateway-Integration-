"use client";

import React, { useState } from "react";
import {
  Zap,
  ShieldCheck,
  CreditCard,
  User,
  Hash,
  Receipt,
  Building2,
  CheckCircle2,
  Share2,
  Home,
  History,
  Lock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  X,
  AlertCircle
} from "lucide-react";

type PaymentMethod = "gcash" | "paymaya";

interface SavedAccount {
  title: string;
  accountNumber: string;
  accountName: string;
  defaultAmount: number;
}

interface TransactionReceipt {
  transactionId: string;
  referenceNumber: string;
  accountNumber: string;
  accountName: string;
  billAmount: number;
  serviceFee: number;
  totalPaid: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  status: string;
}

const SAVED_ACCOUNTS: SavedAccount[] = [
  { title: "Home Meter (San Francisco)", accountNumber: "12-8849-2015", accountName: "Maria Clara Santos", defaultAmount: 1850.00 },
  { title: "Store Meter (Bayugan)", accountNumber: "15-3029-8812", accountName: "Santos General Store", defaultAmount: 3420.75 },
  { title: "Farm Meter (Prosperidad)", accountNumber: "09-1102-4491", accountName: "Juan Dela Cruz", defaultAmount: 980.00 },
];

export default function AselcoPayApp() {
  // Form State
  const [accountNumber, setAccountNumber] = useState("12-8849-2015");
  const [accountName, setAccountName] = useState("Maria Clara Santos");
  const [amount, setAmount] = useState("1850.00");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gcash");

  // Errors State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<TransactionReceipt | null>(null);

  // Active Session State from PayMongo
  const [sessionData, setSessionData] = useState<{
    checkoutUrl: string;
    sessionId: string;
    referenceNumber: string;
    isSimulated: boolean;
  } | null>(null);

  // History State
  const [history, setHistory] = useState<TransactionReceipt[]>([
    {
      transactionId: "PAYMONGO-984210",
      referenceNumber: "ASELCO-984210",
      accountNumber: "12-8849-2015",
      accountName: "Maria Clara Santos",
      billAmount: 1620.00,
      serviceFee: 15.00,
      totalPaid: 1635.00,
      paymentMethod: "gcash",
      timestamp: new Date(Date.now() - 86400000 * 18).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "SUCCESSFUL",
    },
  ]);

  const SERVICE_FEE = 15.00;
  const numericAmount = parseFloat(amount) || 0;
  const totalAmount = numericAmount + SERVICE_FEE;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!accountNumber.trim()) {
      newErrors.accountNumber = "Account Number is required";
    } else if (accountNumber.trim().length < 6) {
      newErrors.accountNumber = "Enter a valid ASELCO account number";
    }

    if (!accountName.trim()) {
      newErrors.accountName = "Account Name is required";
    }

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "Please enter a valid bill amount greater than ₱0";
    } else if (numericAmount < 10) {
      newErrors.amount = "Minimum payment amount is ₱10.00";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuickSelect = (acc: SavedAccount) => {
    setAccountNumber(acc.accountNumber);
    setAccountName(acc.accountName);
    setAmount(acc.defaultAmount.toFixed(2));
    setErrors({});
  };

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/paymongo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber,
          accountName,
          amount: numericAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSessionData({
          checkoutUrl: data.checkoutUrl,
          sessionId: data.sessionId,
          referenceNumber: data.referenceNumber,
          isSimulated: data.isSimulated,
        });
        setShowCheckoutModal(true);
      } else {
        alert(data.error || "Failed to create PayMongo checkout session");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to PayMongo API backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePayment = () => {
    if (!sessionData) return;

    const newTxn: TransactionReceipt = {
      transactionId: `PAYMONGO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      referenceNumber: sessionData.referenceNumber,
      accountNumber,
      accountName,
      billAmount: numericAmount,
      serviceFee: SERVICE_FEE,
      totalPaid: totalAmount,
      paymentMethod,
      timestamp: new Date().toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "SUCCESSFUL",
    };

    setHistory([newTxn, ...history]);
    setActiveReceipt(newTxn);
    setShowCheckoutModal(false);
    setSessionData(null);
  };

  const formatPhp = (val: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val).replace("PHP", "₱");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start pb-12">
      {/* Top Header */}
      <header className="w-full bg-blue-900 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-400 text-blue-950 p-2 rounded-xl shadow">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ASELCO Bill Pay</h1>
              <p className="text-xs text-blue-200">Agusan del Sur Electric Cooperative, Inc.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-1 bg-blue-800/80 text-blue-100 px-3 py-1.5 rounded-full text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PayMongo Secure E-Portal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl px-4 mt-6 space-y-6">
        {/* Receipt View Mode */}
        {activeReceipt ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-fadeIn">
            {/* Success Header */}
            <div className="bg-emerald-600 text-white p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black">Payment Successful!</h2>
              <p className="text-emerald-100 text-sm mt-1">Official ASELCO Electronic Receipt</p>
            </div>

            {/* Receipt Details */}
            <div className="p-6 space-y-6">
              {/* Total Paid Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Amount Paid</span>
                <p className="text-3xl font-black text-blue-900 mt-1">{formatPhp(activeReceipt.totalPaid)}</p>
                <div className="mt-2 inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-full border border-blue-200 text-xs font-semibold text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Paid via {activeReceipt.paymentMethod === "gcash" ? "GCash (PayMongo)" : "Maya (PayMongo)"}</span>
                </div>
              </div>

              {/* Detail Items */}
              <div className="divide-y divide-slate-100 text-sm space-y-3 pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-bold text-slate-900">{activeReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Reference Number</span>
                  <span className="font-medium text-slate-800">{activeReceipt.referenceNumber}</span>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-medium text-slate-800">{activeReceipt.timestamp}</span>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Biller Cooperative</span>
                  <span className="font-semibold text-slate-900">ASELCO Electric Co-op</span>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-bold text-blue-900">{activeReceipt.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-slate-500">Account Name</span>
                  <span className="font-medium text-slate-800">{activeReceipt.accountName}</span>
                </div>
              </div>

              <hr className="border-dashed border-slate-200" />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <p className="font-bold text-slate-900">Payment Breakdown</p>
                <div className="flex justify-between text-slate-600">
                  <span>ASELCO Bill Amount</span>
                  <span>{formatPhp(activeReceipt.billAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PayMongo Processing Fee</span>
                  <span>{formatPhp(activeReceipt.serviceFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                  <span>Total Charged</span>
                  <span className="text-blue-900">{formatPhp(activeReceipt.totalPaid)}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-amber-900">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Immediate credit posting. Please save or keep this electronic receipt for your records.</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => alert("E-Receipt saved & ready to print.")}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center space-x-2 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share / Download Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow transition"
                >
                  <Home className="w-4 h-4" />
                  <span>Pay Another Bill</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <>
            {/* Banner Card */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 text-white">
                <Zap className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="bg-amber-400 text-blue-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Official E-Cooperative Payment
                </span>
                <h2 className="text-2xl font-extrabold">Pay Agusan Electricity Bill Online</h2>
                <p className="text-xs text-blue-100 max-w-lg">
                  Direct billing integration with PayMongo API supporting instant GCash and Maya e-Wallet transactions.
                </p>
              </div>
            </div>

            {/* Saved Accounts Quick Fill */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Fill Saved Meters</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAVED_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSelect(acc)}
                    className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition shadow-sm group"
                  >
                    <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs group-hover:text-blue-700">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{acc.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Acc #{acc.accountNumber}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Form Card */}
            <form onSubmit={handleCreateCheckout} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Receipt className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-bold text-slate-900">Account Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Hash className="w-3.5 h-3.5 text-blue-900" />
                    <span>Account Number</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      if (errors.accountNumber) setErrors({ ...errors, accountNumber: "" });
                    }}
                    placeholder="e.g. 12-8849-2015"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                      errors.accountNumber
                        ? "border-red-400 focus:ring-red-200 bg-red-50/50"
                        : "border-slate-300 focus:ring-blue-100 focus:border-blue-700"
                    }`}
                  />
                  {errors.accountNumber && (
                    <p className="text-xs text-red-500 font-medium flex items-center space-x-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountNumber}</span>
                    </p>
                  )}
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-blue-900" />
                    <span>Account Name</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      if (errors.accountName) setErrors({ ...errors, accountName: "" });
                    }}
                    placeholder="e.g. Maria Clara Santos"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                      errors.accountName
                        ? "border-red-400 focus:ring-red-200 bg-red-50/50"
                        : "border-slate-300 focus:ring-blue-100 focus:border-blue-700"
                    }`}
                  />
                  {errors.accountName && (
                    <p className="text-xs text-red-500 font-medium flex items-center space-x-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bill Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-900" />
                  <span>Bill Amount (PHP)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors({ ...errors, amount: "" });
                    }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-base font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                      errors.amount
                        ? "border-red-400 focus:ring-red-200 bg-red-50/50"
                        : "border-slate-300 focus:ring-blue-100 focus:border-blue-700"
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-500 font-medium flex items-center space-x-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-blue-900" />
                  <span>Select PayMongo Payment Method</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* GCash Option */}
                  <label
                    onClick={() => setPaymentMethod("gcash")}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition ${
                      paymentMethod === "gcash"
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow">
                        G
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-sm">GCash</span>
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">PayMongo GCash e-Wallet</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={paymentMethod === "gcash"}
                      onChange={() => setPaymentMethod("gcash")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  {/* Maya Option */}
                  <label
                    onClick={() => setPaymentMethod("paymaya")}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition ${
                      paymentMethod === "paymaya"
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow">
                        M
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-sm">Maya</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Fast
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">PayMongo Maya e-Wallet</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paymaya"
                      checked={paymentMethod === "paymaya"}
                      onChange={() => setPaymentMethod("paymaya")}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>ASELCO Electric Bill</span>
                  <span>{formatPhp(numericAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PayMongo Processing Fee</span>
                  <span>{formatPhp(SERVICE_FEE)}</span>
                </div>
                <hr className="border-slate-200 my-1" />
                <div className="flex justify-between font-bold text-slate-900 text-base">
                  <span>Total Amount Due</span>
                  <span className="text-blue-900 text-lg">{formatPhp(totalAmount)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg transition ${
                  paymentMethod === "gcash"
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                } ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creating PayMongo Session...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>
                      Pay {formatPhp(totalAmount)} via {paymentMethod === "gcash" ? "GCash" : "Maya"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Secured by PayMongo Philippines API</span>
              </div>
            </form>

            {/* History Section */}
            {history.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2 text-blue-900">
                  <History className="w-4 h-4" />
                  <h3 className="font-bold text-sm">Recent Paid Bills</h3>
                </div>

                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveReceipt(item)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">Acc #{item.accountNumber}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.paymentMethod === "gcash" ? "GCash" : "Maya"} • {item.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-blue-900">{formatPhp(item.totalPaid)}</p>
                        <span className="text-[10px] font-semibold text-blue-600">View Receipt &gt;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* PayMongo Checkout Portal Modal */}
      {showCheckoutModal && sessionData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Modal Top Bar */}
            <div
              className={`p-4 text-white flex items-center justify-between ${
                paymentMethod === "gcash" ? "bg-blue-600" : "bg-emerald-600"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span className="font-bold text-sm">PayMongo {paymentMethod === "gcash" ? "GCash" : "Maya"} Portal</span>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>

              <div>
                <h3 className="font-black text-lg text-slate-900">PayMongo Checkout Session Created</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Reference: <span className="font-mono font-bold text-slate-700">{sessionData.referenceNumber}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Account Number:</span>
                  <span className="font-bold text-slate-900">{accountNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account Name:</span>
                  <span className="font-medium text-slate-900">{accountName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount Due:</span>
                  <span className="font-bold text-blue-900">{formatPhp(totalAmount)}</span>
                </div>
              </div>

              {/* Simulation Interactive Helper */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left space-y-1 text-xs text-amber-900">
                <div className="flex items-center space-x-1 font-bold text-amber-800">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Vercel Prototype Testing Mode</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Click the button below to complete payment and instantly generate your official ASELCO e-Receipt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCompletePayment}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow transition ${
                    paymentMethod === "gcash"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate {paymentMethod === "gcash" ? "GCash" : "Maya"} Payment Success</span>
                </button>

                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
