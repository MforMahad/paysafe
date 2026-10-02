'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 transition-all duration-300">
      <div 
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 px-6 py-3.5 flex items-center justify-between border ${
          isScrolled 
            ? 'bg-[#0B132B]/85 backdrop-blur-md border-[#1E293B] shadow-lg shadow-black/20' 
            : 'bg-[#0B132B]/60 backdrop-blur-sm border-[#1E293B]/60'
        }`}
      >
        {/* BRAND LOGO */}
        <a href="#" className="flex items-center gap-2.5 group">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] group-hover:scale-125 transition-transform duration-200" />
          <span className="font-mono text-sm sm:text-base font-bold tracking-wider uppercase text-white">
            PAYSAFE GATEWAY
          </span>
        </a>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a 
            href="#features" 
            className="text-[#94A3B8] hover:text-white transition-colors duration-150"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-[#94A3B8] hover:text-white transition-colors duration-150"
          >
            How It Works
          </a>
          <a 
            href="#about" 
            className="text-[#94A3B8] hover:text-white transition-colors duration-150"
          >
            About
          </a>
          <a 
            href="#contact" 
            className="text-[#94A3B8] hover:text-white transition-colors duration-150"
          >
            Contact
          </a>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-5">
          <a 
            href="#sign-in" 
            className="text-sm font-medium text-[#94A3B8] hover:text-white transition-colors duration-150"
          >
            Sign In
          </a>
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors duration-150 shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#94A3B8] hover:text-white p-1 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 p-6 bg-[#0B132B] border border-[#1E293B] rounded-2xl shadow-xl flex flex-col space-y-5 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <a 
            href="#features" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#94A3B8] hover:text-white transition-colors py-1"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#94A3B8] hover:text-white transition-colors py-1"
          >
            How It Works
          </a>
          <a 
            href="#about" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#94A3B8] hover:text-white transition-colors py-1"
          >
            About
          </a>
          <a 
            href="#contact" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#94A3B8] hover:text-white transition-colors py-1"
          >
            Contact
          </a>

          <div className="pt-4 border-t border-[#1E293B] flex flex-col gap-3">
            <a 
              href="#sign-in" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#94A3B8] hover:text-white transition-colors py-1 text-center"
            >
              Sign In
            </a>
            <a
              href="#get-started"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}