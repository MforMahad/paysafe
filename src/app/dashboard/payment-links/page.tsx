// app/dashboard/payment-links/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  Plus,
  Search,
  Building2,
  Link2,
  User,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

const statusFilters = [
  'All',
  'Pending',
  'Confirmed',
  'Failed',
  'Expired',
] as const;

type StatusFilter = (typeof statusFilters)[number];

export default function PaymentLinksPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

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
      className="space-y-6"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Payment Links
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Create and manage payment requests.
          </p>
        </div>

        <Link
          href="/dashboard/payment-links/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment Link</span>
        </Link>
      </div>

      {/* WORKSPACE TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment links..."
            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-10 pr-4 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
          />
        </div>

        {/* Status filter controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none border border-[#E2E8F0] bg-white p-1 rounded-lg shrink-0">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B132B] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* PAYMENT LINKS TABLE CONTAINER */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {/* Desktop Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
                <th className="py-3 px-6 font-semibold">Payment Request</th>
                <th className="py-3 px-6 font-semibold">Amount</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold">Created</th>
                <th className="py-3 px-6 font-semibold">Expiration</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* EMPTY STATE WORKSPACE */}
        <div className="p-8 sm:p-12 text-center border-t border-[#E2E8F0]/40">
          <div className="max-w-xl mx-auto space-y-6">
            {/* RESTRAINED CONCEPTUAL WORKFLOW VISUAL */}
            <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
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
                <span>CUSTOMER</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F172A]">
                No payment links yet
              </h2>
              <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
                Create a payment link to send a payment request to a customer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/payment-links/create"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Payment Link</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Learn How It Works</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}