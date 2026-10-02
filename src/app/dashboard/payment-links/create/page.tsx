// app/dashboard/payment-links/create/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Store,
  Briefcase,
  Clock,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function CreatePaymentLinkPage() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [merchant, setMerchant] = useState('');
  const [brand, setBrand] = useState('');
  const [expiration, setExpiration] = useState('24 hours');

  const isValid =
    amount.trim() !== '' &&
    parseFloat(amount) > 0 &&
    currency.trim() !== '' &&
    description.trim() !== '' &&
    merchant.trim() !== '' &&
    brand.trim() !== '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* HEADER SECTION */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/payment-links"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Payment Links</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Create Payment Link
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Create a payment request and configure how the customer will pay.
          </p>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN (60% equivalent: 7 cols) */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-lg">
          {/* SECTION 1 — PAYMENT DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="PKR">PKR (Rs)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Reference / Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website development"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* SECTION 2 — CUSTOMER */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <User className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Customer
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3 — PAYMENT CONFIGURATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Merchant <span className="text-red-500">*</span>
                </label>
                <select
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                >
                  <option value="">No merchants configured</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                >
                  <option value="">No brands configured</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Expiration
              </label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              >
                <option value="24 hours">24 hours</option>
                <option value="3 days">3 days</option>
                <option value="7 days">7 days</option>
                <option value="30 days">30 days</option>
              </select>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              href="/dashboard/payment-links"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={!isValid}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                isValid
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              Generate Payment Link
            </button>
          </div>
        </div>

        {/* RIGHT PREVIEW COLUMN (40% equivalent: 5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Link Preview
              </h3>
              <div className="flex items-center gap-1.5">
                {isValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    READY TO GENERATE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <AlertCircle className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
              </div>
            </div>

            {!amount && !description ? (
              <p className="text-xs text-[#64748B] font-normal leading-relaxed text-center py-6">
                Complete the payment details to preview the request.
              </p>
            ) : null}

            {/* CONCEPTUAL PREVIEW CARD */}
            <div className="bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                  Amount Requested
                </span>
                <div className="text-2xl font-bold font-mono text-[#0F172A]">
                  {amount ? `${currency} ${amount}` : '—'}
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Description</span>
                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {description || '—'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Customer</span>
                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {customerName || customerEmail || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Merchant</span>
                  <span className="text-[#0F172A] font-medium text-right">
                    {merchant || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Brand</span>
                  <span className="text-[#0F172A] font-medium text-right">
                    {brand || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Expiration</span>
                  <span className="text-[#0F172A] font-medium text-right flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {expiration}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed text-center">
              The preview reflects local inputs only. No live payment request or URL is generated until submission.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}