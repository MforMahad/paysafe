'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link2, ArrowRight, ArrowDown, ShieldCheck, CheckCircle2, CreditCard, ChevronRight, Globe } from 'lucide-react';

export default function Features() {
  return (
    <section className="bg-[#FFFFFF] text-[#0F172A] py-24 md:py-36 px-6 lg:px-12 border-t border-slate-200 relative overflow-hidden">
      {/* Light Blueprint Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{
          backgroundImage: `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto space-y-28 md:space-y-40 relative z-10">
        
        {/* ==========================================
            SECTION INTRO
        ========================================== */}
        <div className="max-w-3xl space-y-6">
          {/* Custom Pill Badge Matching Your Image Style */}
          <div className="inline-flex items-center gap-2.5 bg-[#2563EB]/10 border border-[#2563EB]/20 px-4 py-1.5 rounded-full shadow-sm">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#2563EB] uppercase">
              PAYSAFE GATEWAY v2.0
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1]">
            Everything around the payment link, kept in one clear flow.
          </h2>

          <p className="text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
            Create the request, connect the payment path, and keep the resulting payment record tied to the original transaction.
          </p>
        </div>

        {/* ==========================================
            FEATURE 01 — PAYMENT LINKS
        ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: Card UI */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50"
          >
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                  Payment Request
                </span>
              </div>
              <span className="text-xs font-mono text-slate-600 border border-slate-200 px-3 py-1 rounded-full bg-slate-50">
                Draft
              </span>
            </div>

            {/* Spec Fields Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6 text-sm bg-slate-50/80 p-5 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono uppercase">Amount</span>
                <span className="font-mono font-bold text-[#0F172A] text-base">$1,250.00</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono uppercase">Currency</span>
                <span className="font-mono font-bold text-[#0F172A] text-base">USD</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono uppercase">Reference</span>
                <span className="font-mono font-medium text-slate-700">#REQ-88421</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-mono uppercase">Expiration</span>
                <span className="font-mono font-medium text-slate-700">24 Hours</span>
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="flex justify-center my-4">
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-full text-[#2563EB]">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>

            {/* Generated Link Card */}
            <div className="p-4 bg-[#0F172A] rounded-xl flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white/10 rounded-lg text-blue-400 shrink-0">
                  <Link2 className="w-4 h-4"/>
                </div>
                <span className="font-mono text-xs text-slate-200 truncate">
                  https://paysafe.link/request/9a8f21c
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-white bg-[#2563EB] px-3 py-1 rounded-full shrink-0 ml-3">
                GENERATED LINK
              </span>
            </div>
          </motion.div>

          {/* RIGHT: Text Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
              01 / Payment Links
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              Create once.<br />Share simply.
            </h3>
            <p className="text-slate-600 leading-relaxed text-base">
              Create a structured payment request and generate a dedicated payment link that can be shared directly with the customer.
            </p>
            <div className="pt-2">
              <a 
                href="#payment-links" 
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-blue-700 transition-colors group"
              >
                Explore payment links
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
              </a>
            </div>
          </div>

        </div>

        {/* ==========================================
            FEATURE 02 — MERCHANT CONNECTION
        ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: Text Content */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-6">
            <div className="inline-block font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
              02 / Merchant Connections
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              Connect the payment path.
            </h3>
            <p className="text-slate-600 leading-relaxed text-base">
              Use the merchant gateway configured for the payment request so the customer can complete the payment through the intended processing path.
            </p>
          </div>

          {/* RIGHT: Flow Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 order-1 lg:order-2 bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xl shadow-slate-200/50"
          >
            <div className="max-w-md mx-auto space-y-3">
              
              {/* Node 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-mono font-bold text-[#0F172A]">
                    PAYMENT REQUEST
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Origin</span>
              </div>

              <div className="flex justify-center py-1">
                <div className="w-0.5 h-5 bg-slate-200" />
              </div>

              {/* Node 2 - Hero Blue Card */}
              <div className="p-4 bg-[#2563EB] text-white rounded-xl flex items-center justify-between shadow-lg shadow-blue-500/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-white"/>
                  <span className="text-xs font-mono font-extrabold tracking-wider">
                    PAYSAFE ROUTER
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#2563EB] bg-white font-bold px-3 py-1 rounded-full">
                  ACTIVE CORE
                </span>
              </div>

              <div className="flex justify-center py-1">
                <div className="w-0.5 h-5 bg-slate-200" />
              </div>

              {/* Node 3 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-600"/>
                  <span className="text-xs font-mono font-bold text-[#0F172A]">
                    CONFIGURED GATEWAY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">Active</span>
              </div>

              <div className="flex justify-center py-1">
                <div className="w-0.5 h-5 bg-slate-200" />
              </div>

              {/* Node 4 */}
              <div className="p-4 bg-[#0F172A] text-white rounded-xl flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                  <span className="text-xs font-mono font-bold">
                    CUSTOMER PAYMENT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  Completed
                </span>
              </div>

            </div>
          </motion.div>

        </div>

        {/* ==========================================
            FEATURE 03 — PAYMENT RECORD
        ========================================== */}
        <div className="pt-12 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-block font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
                03 / Payment Record
              </div>
              <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                Every payment stays connected to its request.
              </h3>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                
                <div className="sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">01</span>
                  <span className="text-xs font-mono font-bold text-[#0F172A] block">REQUEST</span>
                </div>

                <div className="hidden sm:flex justify-center text-slate-400">
                  <ChevronRight className="w-4 h-4"/>
                </div>

                <div className="sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">02</span>
                  <span className="text-xs font-mono font-bold text-[#0F172A] block">STATUS</span>
                </div>

                <div className="hidden sm:flex justify-center text-slate-400">
                  <ChevronRight className="w-4 h-4"/>
                </div>

                <div className="sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[10px] font-mono text-[#2563EB] block mb-1">03</span>
                  <span className="text-xs font-mono font-bold text-[#0F172A] block">CONFIRMED</span>
                </div>

                <div className="hidden sm:flex justify-center text-slate-400">
                  <ChevronRight className="w-4 h-4"/>
                </div>

                <div className="sm:col-span-1 p-3 bg-[#2563EB] text-white rounded-xl text-left font-bold shadow-md">
                  <span className="text-[10px] font-mono text-blue-200 block mb-1">04</span>
                  <span className="text-xs font-mono block">RECEIPT</span>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Record Continuity</span>
                <span className="text-[#0F172A] font-bold">Unified Lifecycle</span>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}