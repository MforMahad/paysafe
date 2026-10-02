// app/dashboard/merchants/create/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Globe,
  Key,
  Sliders,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function CreateMerchantPage() {
  const [merchantName, setMerchantName] = useState('');
  const [statementDescriptor, setStatementDescriptor] = useState('');
  const [integrationType, setIntegrationType] = useState('Hosted Payment Page');
  const [hostedPaymentUrl, setHostedPaymentUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showApiSecret, setShowApiSecret] = useState(false);

  // URL Parameter mappings
  const [paramAmount, setParamAmount] = useState('amount');
  const [paramCurrency, setParamCurrency] = useState('currency');
  const [paramReference, setParamReference] = useState('reference');
  const [paramCallbackUrl, setParamCallbackUrl] = useState('callback_url');

  const isValid =
    merchantName.trim() !== '' &&
    statementDescriptor.trim() !== '' &&
    integrationType.trim() !== '' &&
    hostedPaymentUrl.trim() !== '' &&
    apiKey.trim() !== '' &&
    apiSecret.trim() !== '' &&
    paramAmount.trim() !== '' &&
    paramCurrency.trim() !== '' &&
    paramReference.trim() !== '' &&
    paramCallbackUrl.trim() !== '';

  const getCredentialsStatusText = () => {
    const hasKey = apiKey.trim() !== '';
    const hasSecret = apiSecret.trim() !== '';

    if (hasKey && hasSecret) {
      return 'API key & secret provided';
    }
    if (hasKey) {
      return 'API key provided';
    }
    if (hasSecret) {
      return 'API secret provided';
    }
    return 'Not configured';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* PAGE HEADER */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/merchants"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Merchants</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Add Merchant
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Configure a payment destination for use with your PaySafe payment links.
          </p>
        </div>
      </div>

      {/* TWO-COLUMN CONFIGURATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN (7 cols) */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-lg">
          {/* SECTION 1 — MERCHANT DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Merchant Details
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Merchant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Merchant name"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Statement Descriptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={statementDescriptor}
                onChange={(e) => setStatementDescriptor(e.target.value)}
                placeholder="Statement shown to customers"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                Use the descriptor customers should recognize when reviewing a payment.
              </p>
            </div>
          </div>

          {/* SECTION 2 — INTEGRATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Globe className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Integration
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Integration Type <span className="text-red-500">*</span>
              </label>
              <select
                value={integrationType}
                onChange={(e) => setIntegrationType(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              >
                <option value="Hosted Payment Page">Hosted Payment Page</option>
                <option value="Payment API">Payment API</option>
              </select>
              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                Choose how PaySafe will hand off or submit payment requests.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Hosted Payment URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hostedPaymentUrl}
                onChange={(e) => setHostedPaymentUrl(e.target.value)}
                placeholder="https://example.com/pay"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                The URL PaySafe will use when routing a payment request.
              </p>
            </div>
          </div>

          {/* SECTION 3 — CREDENTIALS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Key className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  API Secret <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter API secret"
                    className="w-full bg-white border border-[#E2E8F0] rounded-md pl-3 pr-9 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] transition-colors"
                  >
                    {showApiSecret ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#64748B]">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Credentials are required only when the selected integration requires them.</span>
            </div>
          </div>

          {/* SECTION 4 — PAYMENT URL PARAMETERS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment URL Parameters
              </h2>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed">
              Map PaySafe payment fields to the parameter names expected by the configured payment destination.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Amount
                </span>
                <input
                  type="text"
                  value={paramAmount}
                  onChange={(e) => setParamAmount(e.target.value)}
                  placeholder="amount"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Currency
                </span>
                <input
                  type="text"
                  value={paramCurrency}
                  onChange={(e) => setParamCurrency(e.target.value)}
                  placeholder="currency"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Reference
                </span>
                <input
                  type="text"
                  value={paramReference}
                  onChange={(e) => setParamReference(e.target.value)}
                  placeholder="reference"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-md">
                <span className="text-xs font-mono font-medium text-[#0F172A] sm:w-1/3">
                  Callback URL
                </span>
                <input
                  type="text"
                  value={paramCallbackUrl}
                  onChange={(e) => setParamCallbackUrl(e.target.value)}
                  placeholder="callback_url"
                  className="w-full sm:w-2/3 bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              href="/dashboard/merchants"
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
              Save Merchant
            </button>
          </div>
        </div>

        {/* RIGHT SUMMARY COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Merchant Configuration
              </h3>
              <div>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    READY TO SAVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <AlertCircle className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                  Merchant
                </span>
                <div className="text-lg font-bold font-mono text-[#0F172A] truncate">
                  {merchantName || '—'}
                </div>
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Descriptor</span>
                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {statementDescriptor || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Integration</span>
                  <span className="text-[#0F172A] font-medium text-right">
                    {integrationType || '—'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#64748B]">Hosted Payment URL</span>
                  <span className="text-[#0F172A] font-medium text-right max-w-[180px] truncate">
                    {hostedPaymentUrl || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">Credentials</span>
                  <span className="text-[#0F172A] font-medium text-right">
                    {getCredentialsStatusText()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B]">URL Parameters</span>
                  <span className="text-[#0F172A] font-medium text-right">
                    4 configured
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed text-center">
              This summary reflects local form inputs only. No backend records or credential validation endpoints are called upon saving in UI phase.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}