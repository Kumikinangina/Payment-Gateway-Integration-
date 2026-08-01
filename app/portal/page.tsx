"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Lock, Smartphone, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Zap } from "lucide-react";

function PortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const session = searchParams.get("session") || "cs_test_sample";
  const initialMethod = searchParams.get("method") || "gcash";
  const amount = searchParams.get("amount") || "1850.00";
  const account = searchParams.get("account") || "12-8849-2015";
  const name = searchParams.get("name") || "Maria Clara Santos";
  const ref = searchParams.get("ref") || "ASELCO-102938";

  const [method, setMethod] = useState<"gcash" | "paymaya">(
    initialMethod === "paymaya" ? "paymaya" : "gcash"
  );
  const [phoneNumber, setPhoneNumber] = useState("09171234567");
  const [step, setStep] = useState<"phone" | "otp" | "processing" | "success">("phone");
  const [otp, setOtp] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const totalAmount = numericAmount + 15;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;
    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        // Redirect back home with URL query params
        router.push(`/?status=success&session=${session}&ref=${ref}&account=${encodeURIComponent(account)}&name=${encodeURIComponent(name)}&amount=${amount}&method=${method}`);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* PayMongo Header */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className={`p-5 text-white ${method === "gcash" ? "bg-blue-600" : "bg-emerald-600"} flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-base leading-tight">PayMongo Checkout</h2>
              <p className="text-[11px] text-white/80">Secured Payment Gateway</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/80 block">Merchant</span>
            <span className="font-bold text-xs uppercase tracking-wider">ASELCO Power</span>
          </div>
        </div>

        {/* Amount & Biller Info */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center text-sm">
          <div>
            <p className="text-xs text-slate-500 font-medium">Account #{account}</p>
            <p className="font-bold text-slate-800">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Total Amount</p>
            <p className="text-lg font-black text-slate-900">₱{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Flow Steps */}
        <div className="p-6">
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-black text-xl shadow ${
                  method === "gcash" ? "bg-blue-600" : "bg-emerald-600"
                }`}>
                  {method === "gcash" ? "G" : "M"}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Pay with {method === "gcash" ? "GCash" : "Maya"}
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your registered mobile number to proceed
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mobile Number</span>
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0917XXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow transition flex items-center justify-center space-x-2 ${
                  method === "gcash" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">Enter 6-Digit OTP</h3>
                <p className="text-xs text-slate-500">
                  Authentication code sent to <span className="font-bold text-slate-800">{phoneNumber}</span>
                </p>
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-[0.5em] text-2xl font-black text-slate-900 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow transition flex items-center justify-center space-x-2 ${
                  method === "gcash" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <span>Confirm Payment ₱{totalAmount.toFixed(2)}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "processing" && (
            <div className="py-8 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Processing Payment...</h3>
                <p className="text-xs text-slate-500 mt-1">Communicating with PayMongo API & ASELCO Servers</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl">Payment Authorized!</h3>
                <p className="text-xs text-slate-500 mt-1">Redirecting back to ASELCO portal...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1">
          <Lock className="w-3 h-3" />
          <span>PayMongo Security Standard • Ref: {ref}</span>
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
        Loading PayMongo Portal...
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
