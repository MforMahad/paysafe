'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Link2,
  Store,
  Briefcase,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payment Links', href: '/dashboard/payment-links', icon: Link2 },
  { name: 'Merchants', href: '/dashboard/merchants', icon: Store },
  { name: 'Brands', href: '/dashboard/brands', icon: Briefcase },
  { name: 'Users', href: '/dashboard/users', icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F7FB] flex text-[#0F172A] font-sans antialiased">
      {/* FIXED DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[250px] bg-[#0B132B] text-white border-r border-[#0F172A]/10 shrink-0 select-none h-full">
        {/* BRAND HEADER */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-white/10 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
            PAYSAFE
          </span>
        </div>

        {/* NAVIGATION AREA */}
        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-white/10 mx-1" />

          {/* SETTINGS LINK */}
          <div>
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors duration-150 ${
                pathname === '/dashboard/settings'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* FOOTER USER CONTEXT */}
        <div className="p-4 border-t border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-xs font-mono overflow-hidden">
            <span className="font-semibold text-white truncate">Admin User</span>
            <span className="text-slate-400 text-[10px] truncate">
              admin@paysafe.gateway
            </span>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-[#0B132B] text-white z-50 transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
              PAYSAFE
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-white/10 mx-1" />

          <Link
            href="/dashboard/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* FIXED TOP BAR HEADER */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 lg:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span>Application</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-semibold uppercase">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-mono font-bold text-slate-900">
                Admin User
              </span>
              <span className="block text-[10px] font-mono text-slate-500">
                Primary Account
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-[#0B132B] text-white flex items-center justify-center font-mono text-xs font-bold">
              AU
            </div>
          </div>
        </header>

        {/* INDEPENDENTLY SCROLLABLE DASHBOARD BODY */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}