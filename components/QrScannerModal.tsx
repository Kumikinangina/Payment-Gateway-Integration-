"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  X,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  RefreshCw,
  FileImage,
  ArrowRight
} from "lucide-react";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "bill" | "gcash";
  onScanSuccess: (data: {
    accountNumber?: string;
    accountName?: string;
    amount?: string;
    rawText: string;
    gcashUrl?: string;
  }) => void;
}

const SAMPLE_BILL_QRS = [
  {
    label: "Home Meter (San Francisco)",
    accountNumber: "12-8849-2015",
    accountName: "Maria Clara Santos",
    amount: "1850.00",
    qrString: JSON.stringify({
      biller: "ASELCO",
      accountNumber: "12-8849-2015",
      accountName: "Maria Clara Santos",
      amount: "1850.00",
      billDate: "2026-07-25"
    })
  },
  {
    label: "Store Meter (Bayugan)",
    accountNumber: "15-3029-8812",
    accountName: "Santos General Store",
    amount: "3420.75",
    qrString: JSON.stringify({
      biller: "ASELCO",
      accountNumber: "15-3029-8812",
      accountName: "Santos General Store",
      amount: "3420.75",
      billDate: "2026-07-20"
    })
  },
  {
    label: "Farm Meter (Prosperidad)",
    accountNumber: "09-1102-4491",
    accountName: "Juan Dela Cruz",
    amount: "980.00",
    qrString: JSON.stringify({
      biller: "ASELCO",
      accountNumber: "09-1102-4491",
      accountName: "Juan Dela Cruz",
      amount: "980.00",
      billDate: "2026-07-28"
    })
  }
];

export default function QrScannerModal({
  isOpen,
  onClose,
  mode,
  onScanSuccess
}: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "samples">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrContainerId = "qr-reader-view";

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      // Ensure container exists
      const container = document.getElementById(qrContainerId);
      if (!container) return;

      if (scannerRef.current) {
        await stopCamera();
      }

      const html5Qrcode = new Html5Qrcode(qrContainerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });

      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          handleDecodedResult(decodedText);
        },
        () => {
          // Ignore frame decode errors
        }
      );
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err?.message || "Could not access camera. Please check permissions or upload an image file instead."
      );
      setIsScanning(false);
    }
  };

  const handleDecodedResult = (decodedText: string) => {
    setScannedResult(decodedText);
    stopCamera();

    let accountNumber: string | undefined;
    let accountName: string | undefined;
    let amount: string | undefined;
    let gcashUrl: string | undefined;

    // Try parsing JSON format first
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.accountNumber || parsed.account_number || parsed.acc) {
        accountNumber = parsed.accountNumber || parsed.account_number || parsed.acc;
      }
      if (parsed.accountName || parsed.account_name || parsed.name) {
        accountName = parsed.accountName || parsed.account_name || parsed.name;
      }
      if (parsed.amount || parsed.billAmount || parsed.amt) {
        amount = String(parsed.amount || parsed.billAmount || parsed.amt);
      }
      if (parsed.gcashUrl || parsed.checkoutUrl || parsed.url) {
        gcashUrl = parsed.gcashUrl || parsed.checkoutUrl || parsed.url;
      }
    } catch (e) {
      // Fallback: pipe/comma separated strings or raw URLs
      if (decodedText.startsWith("http")) {
        gcashUrl = decodedText;
      } else if (decodedText.includes("|") || decodedText.includes(",")) {
        const parts = decodedText.split(/[|,]/).map((p) => p.trim());
        if (parts.length >= 1) accountNumber = parts[0];
        if (parts.length >= 2) accountName = parts[1];
        if (parts.length >= 3) amount = parts[2].replace(/[^0-9.]/g, "");
      } else {
        accountNumber = decodedText.trim();
      }
    }

    onScanSuccess({
      accountNumber,
      accountName,
      amount,
      rawText: decodedText,
      gcashUrl
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    try {
      const html5Qrcode = new Html5Qrcode("qr-file-temp");
      const decodedText = await html5Qrcode.scanFile(file, true);
      handleDecodedResult(decodedText);
    } catch (err: any) {
      console.error("File decode error:", err);
      setCameraError("No clear QR code found in the uploaded image. Please try another image.");
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_BILL_QRS[0]) => {
    handleDecodedResult(sample.qrString);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-amber-400 text-blue-950 p-1.5 rounded-lg shadow">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === "bill" ? "Scan ASELCO Bill QR" : "Scan GCash Payment QR"}
              </h3>
              <p className="text-[11px] text-blue-200">
                {mode === "bill"
                  ? "Auto-fill Account Number, Name & Amount"
                  : "Scan GCash Merchant QR or Payment Link"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 transition ${
              activeTab === "camera"
                ? "bg-white text-blue-900 border-b-2 border-blue-900"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 transition ${
              activeTab === "upload"
                ? "bg-white text-blue-900 border-b-2 border-blue-900"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => setActiveTab("samples")}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 transition ${
              activeTab === "samples"
                ? "bg-white text-blue-900 border-b-2 border-blue-900"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sample Bills</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Camera Scanner Tab */}
          {activeTab === "camera" && (
            <div className="space-y-3">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[240px] flex items-center justify-center border border-slate-800">
                <div id={qrContainerId} className="w-full h-full min-h-[240px]"></div>

                {/* Overlay helper frame */}
                {!cameraError && isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div className="w-48 h-48 border-2 border-amber-400 rounded-2xl border-dashed animate-pulse flex items-center justify-center">
                      <Zap className="w-8 h-8 text-amber-400 opacity-60" />
                    </div>
                    <p className="text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full mt-3">
                      Align QR code inside box
                    </p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Camera Unavailable</p>
                    <p className="text-[11px] mt-0.5">{cameraError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Image Tab */}
          {activeTab === "upload" && (
            <div className="space-y-3 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-900 flex items-center justify-center transition">
                  <FileImage className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-slate-800">Click to Select QR Code Image</p>
                <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP formats</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Sample Presets Tab */}
          {activeTab === "samples" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Test QR scanning instantly by selecting a pre-configured ASELCO bill statement:
              </p>
              <div className="space-y-2 pt-1">
                {SAMPLE_BILL_QRS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample)}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-xs text-blue-900 group-hover:text-blue-700">
                        {sample.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Acc #{sample.accountNumber} • {sample.accountName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-slate-900">₱{sample.amount}</p>
                      <span className="text-[10px] font-bold text-blue-600 flex items-center justify-end space-x-0.5">
                        <span>Auto-Fill</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden element for file scanner */}
          <div id="qr-file-temp" className="hidden"></div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
          <p className="text-[11px] text-slate-500">
            ASELCO Official Electronic Bill & GCash Payment QR Standard
          </p>
        </div>
      </div>
    </div>
  );
}
