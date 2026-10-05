"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
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
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Payment Links",
    href: "/dashboard/payment-links",
    icon: Link2,
  },
  {
    name: "Merchants",
    href: "/dashboard/merchants",
    icon: Store,
  },
  {
    name: "Brands",
    href: "/dashboard/brands",
    icon: Briefcase,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    initials: string;
  };
  business: {
    name: string;
    role: string;
  };
};

export default function DashboardShell({
  children,
  user,
  business,
}: DashboardShellProps) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  const roleLabel =
    business.role === "admin"
      ? "Admin"
      : business.role === "staff"
        ? "Staff"
        : business.role;

  /*
   * Close account dropdown when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Close account dropdown with Escape.
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleNavigationClick() {
    setAccountMenuOpen(false);
    closeMobileMenu();
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F7FB] flex text-[#0F172A] font-sans antialiased">
      {/* =========================================================
          FIXED DESKTOP SIDEBAR
      ========================================================= */}
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
                  onClick={() => setAccountMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors duration-150 ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-white/10 mx-1" />

          {/* SETTINGS */}
          <div>
            <Link
              href="/dashboard/settings"
              onClick={() => setAccountMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors duration-150 ${
                pathname === "/dashboard/settings"
                  ? "bg-[#2563EB] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />

              <span>Settings</span>
            </Link>
          </div>
        </div>

       {/* DESKTOP USER CONTEXT */}
<div className="p-4 border-t border-white/10 shrink-0">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-slate-300 shrink-0">
      <User className="w-4 h-4" />
    </div>

    <div className="flex flex-col text-xs font-mono overflow-hidden min-w-0">
      <span className="font-semibold text-white truncate">
        {user.name}
      </span>

      <span className="text-slate-400 text-[10px] truncate">
        {user.email}
      </span>
    </div>
  </div>
</div>
      </aside>

      {/* =========================================================
          MOBILE DRAWER BACKDROP
      ========================================================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* =========================================================
          MOBILE SIDEBAR DRAWER
      ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-[#0B132B] text-white z-50 transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* MOBILE BRAND HEADER */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />

            <span className="font-mono text-sm font-bold tracking-wider uppercase text-white">
              PAYSAFE
            </span>
          </div>

          <button
            onClick={closeMobileMenu}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavigationClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors ${
                    isActive
                      ? "bg-[#2563EB] text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
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
            onClick={handleNavigationClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium tracking-wide uppercase transition-colors ${
              pathname === "/dashboard/settings"
                ? "bg-[#2563EB] text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />

            <span>Settings</span>
          </Link>
        </div>

        {/* MOBILE ACCOUNT AREA */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="relative">
            {/* MOBILE ACCOUNT TRIGGER */}
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className="w-full flex items-center gap-3 rounded-md p-2 -m-2 text-left hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>

              <div className="flex flex-col text-xs font-mono overflow-hidden min-w-0 flex-1">
                <span className="font-semibold text-white truncate">
                  {user.name}
                </span>

                <span className="text-slate-400 text-[10px] truncate">
                  {user.email}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* MOBILE ACCOUNT DROPDOWN */}
            {accountMenuOpen && (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+10px)] left-0 right-0 rounded-lg border border-white/10 bg-[#111A33] shadow-2xl shadow-black/30 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {user.initials}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.name}
                      </p>

                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-white/10">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Workspace
                  </p>

                  <p className="text-xs font-medium text-white truncate">
                    {business.name}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {roleLabel}
                  </p>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <User className="w-3.5 h-3.5" />
                    Account
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================
          RIGHT SIDE MAIN CONTAINER
      ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 lg:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Open navigation"
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

          {/* TOP-RIGHT ACCOUNT TRIGGER + DROPDOWN */}
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-mono font-bold text-slate-900">
                  {user.name}
                </span>

                <span className="block text-[10px] font-mono text-slate-500">
                  {business.name} · {roleLabel}
                </span>
              </div>

              <div className="w-8 h-8 rounded-md bg-[#0B132B] text-white flex items-center justify-center font-mono text-xs font-bold">
                {user.initials}
              </div>

              <ChevronDown
                className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-[250px] rounded-lg border border-[#E2E8F0] bg-white shadow-xl shadow-slate-900/10 overflow-hidden z-50"
              >
                {/* PROFILE */}
                <div className="p-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-[#0B132B] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {user.initials}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>

                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WORKSPACE */}
                <div className="px-4 py-3 border-b border-[#E2E8F0]">
                  <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Workspace
                  </p>

                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {business.name}
                  </p>

                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {roleLabel}
                  </p>
                </div>

                {/* MENU */}
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-mono text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
                  >
                    <User className="w-3.5 h-3.5" />
                    Account
                  </button>

                  <div className="h-px bg-[#E2E8F0] my-1" />

                  <div className="[&_button]:!text-slate-600 [&_button:hover]:!text-slate-900 [&_button:hover]:!bg-slate-50">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}