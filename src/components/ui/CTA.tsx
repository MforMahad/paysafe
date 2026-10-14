'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function CTA() {
  return (
    <section className="bg-white text-[#0B132B] py-32 md:py-48 px-6 lg:px-12 border-t border-[#E2E8F0] overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-10">
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-center space-y-8"
        >
          {/* SYSTEM EYEBROW PILL */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/[0.08] border border-[#2563EB]/20 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.12)] text-[#2563EB] font-mono text-xs font-semibold uppercase tracking-wider select-none">
              <Sparkles className="w-[15px] h-[15px] shrink-0 text-[#2563EB]" />
              <span>GET STARTED</span>
            </div>
          </motion.div>

          {/* HEADLINE */}
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0B132B] leading-[1.12] max-w-3xl"
          >
            Ready to simplify<br />the way you collect payments?
          </motion.h2>

          {/* SUPPORTING COPY */}
          <motion.p 
            variants={itemVariants}
            className="text-base md:text-xl text-[#64748B] font-normal leading-relaxed max-w-2xl pt-1"
          >
            Create a payment request, share the link, and keep the payment journey connected from request to confirmation.
          </motion.p>

          {/* PRIMARY ACTION */}
          <motion.div variants={itemVariants} className="pt-4">
            <a
              href="#get-started"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-base transition-colors duration-200 shadow-md hover:shadow-lg group"
            >
              <span>GET STARTED</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* RESOLVED PRODUCT DETAIL (CENTER CONTINUATION) */}
          <motion.div 
            variants={itemVariants} 
            className="pt-12 w-full max-w-md"
          >
            <div className="pt-8 border-t border-[#E2E8F0] flex items-center justify-center gap-6 text-xs font-mono text-[#64748B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span className="font-semibold text-[#0B132B]">CONFIRMED</span>
              </div>
              <span className="text-[#CBD5E1]">|</span>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#64748B]" />
                <span>RECEIPT AVAILABLE</span>
              </div>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}