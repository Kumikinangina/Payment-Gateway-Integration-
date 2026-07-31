"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-100">
      <h2 className="text-2xl font-bold text-slate-800">404 - Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-1">The requested page could not be found.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold">
        Return to Home
      </Link>
    </div>
  );
}
