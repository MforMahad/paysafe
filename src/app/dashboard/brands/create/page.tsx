"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Image as ImageIcon,
  Mail,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  Phone,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function CreateBrandPage() {
  const router = useRouter();

  const [brandName, setBrandName] = useState("");
  const [customerFacingName, setCustomerFacingName] = useState("");

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Customer Contact State
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Business Address State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isValid =
    brandName.trim() !== "" && customerFacingName.trim() !== "";

  // Handle local image file selection & cleanup
  const handleLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      setLogoFile(file);

      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(null);
    setLogoPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  async function handleSaveBrand() {
    if (!isValid || saving) return;

    setSaving(true);
    setSaveError("");

    const supabase = createClient();

    const { error } = await supabase.rpc("create_brand", {
      p_name: brandName.trim(),
      p_customer_facing_name: customerFacingName.trim(),

      // Logo storage will be implemented separately.
      // A local blob URL cannot be persisted in the database.
      p_logo_url: null,

      p_contact_email: email.trim() || null,
      p_contact_phone: phone.trim() || null,
      p_website: website.trim() || null,

      p_address_line_1: address.trim() || null,
      p_address_line_2: null,
      p_city: city.trim() || null,
      p_state: state.trim() || null,
      p_postal_code: postalCode.trim() || null,
      p_country: country.trim() || null,
    });

    if (error) {
      console.error("Failed to create brand:", error);

      setSaveError(
        error.message || "Unable to create brand. Please try again."
      );

      setSaving(false);
      return;
    }

    router.push("/dashboard/brands");
    router.refresh();
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* PAGE HEADER */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0]">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Brands</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Create Brand
          </h1>

          <p className="text-sm text-[#64748B] mt-1 font-normal">
            Define the customer-facing identity used by your payment links.
          </p>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-lg">
          {/* SECTION 1 — BRAND IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Briefcase className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Brand Identity
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Brand Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Brand name"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Customer-Facing Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={customerFacingName}
                onChange={(e) =>
                  setCustomerFacingName(e.target.value)
                }
                placeholder="Name shown to customers"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />

              <p className="text-[11px] text-[#64748B] font-normal leading-relaxed pt-0.5">
                This is the name customers will see when viewing a payment
                request.
              </p>
            </div>
          </div>

          {/* SECTION 2 — LOGO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <ImageIcon className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Logo
              </h2>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed">
              Add a logo to display on customer-facing payment pages.
            </p>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-[#E2E8F0] bg-[#F5F7FB] flex items-center justify-center overflow-hidden shrink-0">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-mono font-medium text-[#0F172A] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />

                    <span>Upload Logo</span>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>

                  {logoPreviewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <p className="text-[10px] font-mono text-[#64748B]">
                  Accepted formats: PNG, JPG, SVG
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3 — CUSTOMER CONTACT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Mail className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Customer Contact
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Phone
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 000 000 0000"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Website
              </label>

              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>
          </div>

          {/* SECTION 4 — BUSINESS ADDRESS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <MapPin className="w-4 h-4 text-[#2563EB]" />

              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Business Address
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-medium text-[#0F172A]">
                Address
              </label>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  City
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  State / Province
                </label>

                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State or province"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Postal Code
                </label>

                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-[#0F172A]">
                  Country
                </label>

                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>
          </div>

          {/* SAVE ERROR */}
          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <p className="text-xs leading-relaxed">
                {saveError}
              </p>
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Link
              href="/dashboard/brands"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F5F7FB] hover:bg-slate-200/60 text-[#0F172A] border border-[#E2E8F0] text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={!isValid || saving}
              onClick={handleSaveBrand}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                isValid && !saving
                  ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {saving && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}

              {saving ? "Saving..." : "Save Brand"}
            </button>
          </div>
        </div>

        {/* RIGHT SUMMARY COLUMN */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A]">
                Payment Page Preview
              </h3>

              <div>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    READY TO SAVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <AlertCircle className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
              </div>
            </div>

            {/* CONCEPTUAL PAYMENT PAGE HEADER PREVIEW */}
            <div className="bg-[#F5F7FB] border border-[#E2E8F0] rounded-lg p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Brand preview"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Briefcase className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#64748B] tracking-wider block">
                    Brand Identity
                  </span>

                  <div className="text-sm font-bold font-mono text-[#0F172A]">
                    {customerFacingName || "Brand Preview"}
                  </div>
                </div>
              </div>

              {/* CONTACT & LOCATION SUMMARY */}
              <div className="space-y-2 text-xs font-mono pt-1">
                {email && (
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                )}

                {phone && (
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}

                {website && (
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{website}</span>
                  </div>
                )}

                {(address || city || state || country) && (
                  <div className="flex items-start gap-2 text-[#64748B] pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />

                    <span className="leading-snug">
                      {[
                        address,
                        city,
                        state,
                        postalCode,
                        country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#E2E8F0]" />

              <div className="space-y-1.5 text-xs font-mono text-[#64748B]">
                <div className="flex justify-between">
                  <span>Payment Link</span>
                  <span className="text-slate-400">
                    [not configured]
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="text-slate-400">
                    [not configured]
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] font-normal leading-relaxed text-center">
              This preview illustrates how your customer-facing identity
              will be displayed on Payment Links.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}