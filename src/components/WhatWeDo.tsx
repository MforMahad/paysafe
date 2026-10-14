"use client";

import { motion } from "framer-motion";
import { Link2, Network, CheckCircle2, ArrowRight } from "lucide-react";

export default function WhatWeDo() {
  const capabilities = [
    {
      number: "01",
      title: "LINK GENERATION",
      status: "STAGE 01",
      description:
        "Create structured payment requests and generate tokenized payment links instantly for seamless customer delivery.",
      icon: Link2,
    },
    {
      number: "02",
      title: "MERCHANT GATEWAY",
      status: "STAGE 02",
      description:
        "Connect incoming payment requests directly to your configured merchant gateway for low-latency transaction processing.",
      icon: Network,
    },
    {
      number: "03",
      title: "PAYMENT CONFIRMATION",
      status: "STAGE 03",
      description:
        "Bind confirmed payment records directly to the originating request ID for complete end-to-end transaction visibility.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="w-full py-28 lg:py-36 bg-white text-[#0B132B] relative overflow-hidden border-t border-slate-100">
      
      {/* Background Architectural Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-16 border-b border-slate-200">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-mono font-bold text-[#1E56E3] uppercase tracking-wider">
              <span>ORCHESTRATION LAYER</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-[#0B132B] tracking-tight leading-[1.05]">
              From payment request <br />
              to <span className="text-[#1E56E3]">confirmed settlement.</span>
            </h2>
          </div>

          <p className="text-base text-slate-500 max-w-md font-normal leading-relaxed">
            PaySafe sits cleanly between the payment request and the merchant gateway, keeping every transaction structured, traceable, and simple to execute.
          </p>
        </div>

        {/* 3-COLUMN CAPABILITY CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
          {capabilities.map((item, idx) => {
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group relative bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#1E56E3] rounded-2xl p-8 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-3xl font-mono font-black text-slate-300 group-hover:text-[#1E56E3] transition-colors">
                      {item.number}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#1E56E3] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                      {item.status}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 group-hover:bg-[#1E56E3] group-hover:border-[#1E56E3] group-hover:text-white flex items-center justify-center text-[#1E56E3] transition-all duration-200 shadow-sm">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <h3 className="text-lg font-bold tracking-tight text-[#0B132B] uppercase pt-2">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mt-3">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono font-semibold text-slate-400 group-hover:text-[#1E56E3] transition-colors">
                  <span>PAYSAFE PIPELINE</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E56E3] group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}