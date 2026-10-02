import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import CTA from "@/components/ui/CTA";
import WhatWeDo from "@/components/WhatWeDo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0F172A] font-sans">
      <main className="flex-1">
        <Navbar />
        <Hero />
        <WhatWeDo />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}