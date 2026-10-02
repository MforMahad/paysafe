// app/dashboard/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  Plus,
  ArrowRight,
  Building2,
  Link2,
  User,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function DashboardPage() {
    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: 'easeOut' },
        },
      };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Monitor payment requests and activity across your PaySafe account.
          </p>
        </div>

        <Link
          href="/dashboard/payment-links"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment Link</span>
        </Link>
      </div>

      {/* OVERVIEW METRICS PLACEHOLDERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
            PAYMENT LINKS
          </span>
          <div className="text-lg font-mono font-semibold text-slate-400">
            —
          </div>
          <span className="text-xs text-slate-400 block font-normal">
            No activity
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
            PENDING PAYMENTS
          </span>
          <div className="text-lg font-mono font-semibold text-slate-400">
            —
          </div>
          <span className="text-xs text-slate-400 block font-normal">
            No activity
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
            CONFIRMED PAYMENTS
          </span>
          <div className="text-lg font-mono font-semibold text-slate-400">
            —
          </div>
          <span className="text-xs text-slate-400 block font-normal">
            No activity
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
            TOTAL COLLECTED
          </span>
          <div className="text-lg font-mono font-semibold text-slate-400">
            — —
          </div>
          <span className="text-xs text-slate-400 block font-normal">
            No settlement data
          </span>
        </div>
      </div>

      {/* PRIMARY EMPTY STATE */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 sm:p-12 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          {/* RESTRAINED CONCEPTUAL VISUAL */}
          <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>REQUEST</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2563EB]">
              <Link2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>LINK</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>PAYER</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F172A]">
              No payment activity yet
            </h2>
            <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
              Create your first payment link to send a payment request to a customer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/payment-links"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create Payment Link</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto justify-center"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Learn How It Works</span>
            </a>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-lg border border-[#E2E8F0]">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-[#0F172A]">
            Recent Activity
          </h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-xs font-mono text-[#64748B]">
            No recent payment activity.
          </p>
        </div>
      </div>
    </motion.div>
  );
}