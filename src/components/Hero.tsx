"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Link2,
  User,
  CheckCircle2,
  ArrowRight,
  Copy,
  ShieldCheck,
  Globe,
  Zap,
  Lock,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full py-24 lg:py-36 bg-[#1E56E3] text-white overflow-hidden">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Architectural Grid Lines */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ==========================================
              LEFT COLUMN: EDITORIAL & TYPOGRAPHY
             ========================================== */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
            
            {/* Monospaced Glass Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full w-fit text-xs font-mono tracking-wider font-medium text-white border border-white/15 shadow-inner">
              <Globe className="w-3.5 h-3.5 text-blue-200" />
              <span>PAYSAFE GATEWAY v2.0</span>
            </div>

            {/* High-Impact Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight leading-[1.02] text-white">
              Instant payment links. <br />
              Zero friction <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-white to-blue-200">
                orchestration.
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed max-w-xl font-normal">
              Generate tokenized payment links, connect instantly to your configured merchant gateway, and track settlements in real time.
            </p>

            {/* High-Contrast CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#get-started"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white text-[#1E56E3] hover:bg-blue-50 transition-all duration-200 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98]"
              >
                Launch Gateway
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-white/90 hover:text-white transition-colors group"
              >
                <span>View Live Architecture</span>
                <ArrowRight className="w-4 h-4 text-blue-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </a>
            </div>

          </div>

          {/* ==========================================
              RIGHT COLUMN: 3D LAYERED PAYMENT STACK
             ========================================== */}
          <div className="lg:col-span-7 w-full">
            <div className="relative perspective-1000">
              
              {/* Back Layer Accent Card (Depth Layer) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 0.95, y: -20 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="absolute inset-0 bg-blue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl transform -rotate-3 scale-95 pointer-events-none"
              />

              {/* Main Floating Payment Surface */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg mx-auto bg-white text-[#0B132B] rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 border border-white/40"
              >
                {/* Header with Live Status */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#1E56E3]/10 rounded-xl text-[#1E56E3]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-900 block uppercase">
                        PAYSAFE LINK HUB
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">TOKEN_ID: #8920-X</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    READY TO SHARE
                  </span>
                </div>

                {/* Central Token Box */}
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>Generated Link URL</span>
                    <span className="flex items-center gap-1 text-[#1E56E3] font-mono text-[11px]">
                      <Lock className="w-3 h-3" /> 256-Bit Encrypted
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between group hover:border-[#1E56E3]/40 transition-colors cursor-pointer">
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                      paysafe.gateway/pay_0892_token
                    </span>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 group-hover:text-[#1E56E3] transition-colors">
                      <Copy className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Micro-Ecosystem Flow Map */}
                <div className="grid grid-cols-4 gap-2 pt-6 border-t border-slate-100 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                    <Building2 className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                    <span className="block text-[10px] font-mono font-bold text-slate-600 uppercase">Merchant</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Link2 className="w-4 h-4 text-[#1E56E3] mx-auto mb-1.5" />
                    <span className="block text-[10px] font-mono font-bold text-[#1E56E3] uppercase">Gateway</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                    <User className="w-4 h-4 text-slate-500 mx-auto mb-1.5" />
                    <span className="block text-[10px] font-mono font-bold text-slate-600 uppercase">Payer</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
                    <span className="block text-[10px] font-mono font-bold text-emerald-700 uppercase">Settled</span>
                  </div>
                </div>

              </motion.div>

              {/* Top-Right Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="hidden sm:flex items-center gap-3 absolute -top-6 -right-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-3 rounded-2xl shadow-xl z-20"
              >
                <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Direct Settlement</div>
                  <div className="text-[10px] font-mono text-blue-200">99.99% Route Uptime</div>
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}