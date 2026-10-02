'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FileText, Link2, CreditCard, CheckCircle2, Globe } from 'lucide-react';

const stages = [
  {
    number: '01',
    title: 'CREATE',
    description: 'The business creates a payment request.',
    icon: FileText,
    detail: null,
  },
  {
    number: '02',
    title: 'SEND',
    description: 'PaySafe generates a payment link which the business can share with the customer.',
    icon: Link2,
    detail: (
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
        <span>PAYMENT LINK</span>
        <span className="tracking-widest text-[#2563EB]">••••••••••</span>
      </div>
    ),
  },
  {
    number: '03',
    title: 'PAY',
    description: 'The customer follows the link and completes payment through the configured merchant gateway.',
    icon: CreditCard,
    detail: null,
  },
  {
    number: '04',
    title: 'CONFIRM',
    description: 'The payment result is confirmed and the resulting payment record / receipt becomes available.',
    icon: CheckCircle2,
    detail: (
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#2563EB] font-bold flex items-center gap-1">
          ✓ CONFIRMED
        </span>
        <span className="text-[#64748B]">RECEIPT AVAILABLE</span>
      </div>
    ),
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
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

const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const verticalLineVariants: Variants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function HowItWorks() {
  return (
    <section className="bg-[#F5F7FB] text-[#0B132B] py-28 md:py-40 px-6 lg:px-12 border-t border-[#E2E8F0] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20 md:space-y-28">
        
        {/* SECTION INTRODUCTION */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-3xl space-y-4"
        >
          {/* SYSTEM EYEBROW PILL */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/[0.08] border border-[#2563EB]/20 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.12)] text-[#2563EB] font-mono text-xs font-semibold uppercase tracking-wider select-none">
            <Globe className="w-[15px] h-[15px] shrink-0 text-[#2563EB]" />
            <span>HOW PAYSAFE WORKS</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0B132B] leading-[1.15]">
            From payment request<br />to confirmed payment.
          </h2>
          <p className="text-base md:text-lg text-[#64748B] font-normal leading-relaxed max-w-2xl pt-1">
            PaySafe keeps the payment journey connected from the initial request to the resulting payment record.
          </p>
        </motion.div>

        {/* PROCESS VISUALIZATION */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative"
        >
          {/* DESKTOP LAYOUT (Continuous Horizontal Axis) */}
          <div className="hidden lg:block relative">
            <div className="absolute top-[38px] left-0 right-0 h-0.5 bg-[#E2E8F0] z-0">
              <motion.div 
                variants={lineVariants}
                className="h-full bg-[#2563EB] origin-left"
              />
            </div>

            <div className="grid grid-cols-4 gap-8 relative z-10">
              {stages.map((stage, idx) => {
                const IconComponent = stage.icon;
                return (
                  <motion.div key={stage.number} variants={itemVariants} className="flex flex-col">
                    <div className="flex items-center mb-8 h-5">
                      <div className={`w-4 h-4 rounded-full border-2 bg-[#F5F7FB] transition-colors ${
                        idx === 0 ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#2563EB] bg-white'
                      }`} />
                    </div>

                    <div className="space-y-2 pr-4">
                      <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider block">
                        {stage.number}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold tracking-tight text-[#0B132B]">
                          {stage.title}
                        </h3>
                        <IconComponent className="w-4 h-4 text-[#64748B]" />
                      </div>

                      <p className="text-sm text-[#64748B] leading-relaxed pt-1 min-h-[60px]">
                        {stage.description}
                      </p>

                      {stage.detail}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* MOBILE LAYOUT (Continuous Vertical Axis) */}
          <div className="block lg:hidden relative pl-6">
            <div className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-[#E2E8F0]">
              <motion.div 
                variants={verticalLineVariants}
                className="w-full bg-[#2563EB] origin-top h-full"
              />
            </div>

            <div className="space-y-12">
              {stages.map((stage, idx) => {
                const IconComponent = stage.icon;
                return (
                  <motion.div key={stage.number} variants={itemVariants} className="relative pl-6">
                    <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 bg-[#F5F7FB] ${
                      idx === 0 ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#2563EB] bg-white'
                    }`} />

                    <div className="space-y-1.5">
                      <span className="text-xs font-mono font-bold text-[#2563EB] tracking-wider block">
                        {stage.number}
                      </span>

                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight text-[#0B132B]">
                          {stage.title}
                        </h3>
                        <IconComponent className="w-4 h-4 text-[#64748B]" />
                      </div>

                      <p className="text-sm text-[#64748B] leading-relaxed max-w-md">
                        {stage.description}
                      </p>

                      <div className="max-w-xs">
                        {stage.detail}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}