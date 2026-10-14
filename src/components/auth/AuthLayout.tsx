import React from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Left Column - Auth Form Container */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              PaySafe
            </span>
          </Link>
        </div>

        {/* Form Content */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          {children}
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-200/60">
          <p>© 2026 PaySafe. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column - Brand Showcase */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none" />

        {/* Eyebrow */}
        <div className="relative z-10 text-xs font-semibold tracking-wider text-blue-400 uppercase">
          PAYMENT OPERATIONS
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Payment operations,<br />
              simplified.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create secure payment requests, manage payment destinations, and keep your payment activity organized from one workspace.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Create payment links for your customers</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Manage merchants and customer-facing brands</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Track payment status from one workspace</span>
            </div>
          </div>
        </div>

        {/* Right Column Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800 text-xs text-slate-400">
          <p>© 2026 PaySafe. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}