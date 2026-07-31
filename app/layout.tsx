import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASELCO Pay - Agusan del Sur Electric Cooperative Bill Payment",
  description: "Official E-Payment portal for ASELCO electricity bills supporting GCash & Maya via PayMongo API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
