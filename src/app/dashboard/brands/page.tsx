// app/dashboard/brands/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  Plus,
  Briefcase,
  Link2,
  User,
  ArrowRight,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function BrandsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Brands
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Manage the business identities used across your payment links.
          </p>
        </div>

        <Link
          href="/dashboard/brands/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </Link>
      </div>

      {/* BRAND WORKSPACE CONTAINER */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
        {/* Table Structure for Future Populated Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[11px] font-mono font-bold uppercase text-[#64748B] tracking-wider">
                <th className="py-3 px-6 font-semibold">Brand</th>
                <th className="py-3 px-6 font-semibold">Customer-Facing Information</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* EMPTY STATE WORKSPACE */}
        <div className="p-8 sm:p-12 text-center border-t border-[#E2E8F0]/40">
          <div className="max-w-xl mx-auto space-y-6">
            {/* CONCEPTUAL WORKFLOW VISUAL */}
            <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg text-slate-600">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2563EB]">
                <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>BRAND IDENTITY</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>PAYMENT LINK</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>CUSTOMER</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F172A]">
                No brands configured
              </h2>
              <p className="text-sm text-[#64748B] font-normal leading-relaxed max-w-md mx-auto">
                Add a brand to define the customer-facing identity used by your payment links.
              </p>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link
                href="/dashboard/brands/create"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors duration-150 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Brand</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}