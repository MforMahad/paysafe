'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#1D4ED8] text-white pt-20 pb-10 px-6 sm:px-10 lg:px-16 overflow-hidden border-t border-blue-600/40 font-sans">
      {/* DOT GRID BACKGROUND OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* TOP ROW: BRAND & NAVIGATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              <span className="font-mono text-base font-bold tracking-wider uppercase text-white">
                PAYSAFE GATEWAY
              </span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
              Payment links and payment-request orchestration for modern digital businesses.
            </p>
          </div>

          {/* QUIET NAVIGATION COLUMNS */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* PRODUCT */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-200/70 block">
                Product
              </span>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#features" className="text-white/90 hover:text-white transition-colors duration-150">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-white/90 hover:text-white transition-colors duration-150">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            {/* COMPANY */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-200/70 block">
                Company
              </span>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#about" className="text-white/90 hover:text-white transition-colors duration-150">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-white/90 hover:text-white transition-colors duration-150">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* ACCOUNT */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-200/70 block">
                Account
              </span>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#sign-in" className="text-white/90 hover:text-white transition-colors duration-150">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="#get-started" className="text-white font-medium hover:underline underline-offset-4 transition-colors duration-150">
                    Get Started →
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* SUBTLE DIVIDER */}
        <div className="h-[1px] w-full bg-white/20" />

        {/* BOTTOM LEGAL ROW */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-blue-100/80">
          <p>© 2026 PaySafe Gateway. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-white transition-colors duration-150">Privacy</a>
            <a href="#terms" className="hover:text-white transition-colors duration-150">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}