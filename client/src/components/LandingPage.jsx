import React, { useState } from 'react';
import { 
  Store, 
  ShoppingCart, 
  Package, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Share2, 
  ChevronRight, 
  WifiOff,
  Heart
} from 'lucide-react';

export default function LandingPage({ onOpenLogin, onOpenRegister }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const faqs = [
    {
      q: 'Can I use this with my existing USB barcode scanner and thermal printer?',
      a: 'Yes! RetailPOS Cloud supports any standard USB or Bluetooth ESC/POS barcode scanner and 58mm/80mm thermal receipt printer out of the box with zero drivers required.'
    },
    {
      q: 'What happens if my shop’s internet goes down during a rush?',
      a: 'RetailPOS Cloud features automatic offline persistence. You can continue scanning items, billing customers, and making sales smoothly offline. All transactions sync to the cloud automatically once your connection returns.'
    },
    {
      q: 'How does WhatsApp digital billing save me money?',
      a: 'Instead of spending thousands every month on thermal paper rolls that customers throw away, you can send itemized, branded receipts straight to customer WhatsApp in 1 click, creating zero paper waste and building a loyal customer contact database.'
    },
    {
      q: 'How does the Super Admin console work for the platform owner?',
      a: 'As the SaaS product owner, logging in with admin credentials automatically launches the Super Admin Headquarters. You can view all attached retail organizations, live daily transaction volumes, subscription MRR, and activate or suspend merchant accounts.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                RetailPOS <span className="text-indigo-400 font-medium text-xs bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-400/20">Cloud SaaS</span>
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')}
              className="hover:text-white transition cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#superadmin" 
              onClick={(e) => scrollToSection(e, 'superadmin')}
              className="hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>👑 Super Admin</span>
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="hover:text-white transition cursor-pointer"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={(e) => scrollToSection(e, 'faq')}
              className="hover:text-white transition cursor-pointer"
            >
              FAQ
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin()}
              className="text-xs font-bold text-slate-200 hover:text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-slate-800 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenRegister('pro')}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-slate-300 mb-6 shadow-xs animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Cloud POS, Inventory & Khata Ledger SaaS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Run, Grow & Scale Your Store with <br />
            <span className="bg-gradient-to-r from-emerald-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
              Lightning Speed & Intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            High-speed barcode checkout, zero-paper WhatsApp receipts, automated customer credit recovery, live inventory radar, and central multi-tenant telemetry. One system for your entire retail business.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onOpenRegister('pro')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 group"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onOpenLogin()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Launch Live Interactive Demo</span>
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> 2-minute setup
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Offline-resilient
            </span>
          </div>

          {/* Interactive Hero Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-2 sm:p-3 shadow-2xl shadow-indigo-950/50 backdrop-blur-sm overflow-hidden">
              {/* Window Title Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/60 bg-slate-900/60 rounded-xl mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  retailpos.cloud/terminal • Apna Super Mart
                </div>
                <div className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Live Terminal
                </div>
              </div>

              {/* Mockup Inside Visual */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
                {/* Mockup Left Catalog Preview */}
                <div className="md:col-span-7 bg-slate-900/80 rounded-xl p-4 border border-slate-700/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                    <span>⚡ Quick Scan Catalog</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">F2 Shortcut</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Aashirvaad Shudh Chakki Atta 5kg', price: '₹245', cat: 'Staples', stock: '22 in stock' },
                      { name: 'Fortune Sunlite Refined Oil 1L', price: '₹148', cat: 'Oils & Ghee', stock: '18 in stock' },
                      { name: 'Amul Butter 100g', price: '₹56', cat: 'Dairy', stock: '12 in stock' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
                        <div>
                          <div className="font-semibold text-white">{item.name}</div>
                          <span className="text-[10px] text-slate-400">{item.cat} • {item.stock}</span>
                        </div>
                        <div className="font-bold text-emerald-400">{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup Right Cart Preview */}
                <div className="md:col-span-5 bg-slate-900/90 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                      <span>🛒 Current Cart (3 items)</span>
                      <span className="text-indigo-400 text-[10px]">INV-20261006-0001</span>
                    </div>

                    <div className="py-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>₹449</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Discount Applied</span>
                        <span>-₹0</span>
                      </div>
                      <div className="flex justify-between text-white font-extrabold text-base pt-2 border-t border-slate-800">
                        <span>Grand Total</span>
                        <span className="text-emerald-400">₹449</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3">
                    <button 
                      onClick={() => onOpenLogin()}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-700/30 hover:bg-emerald-500 transition"
                    >
                      Instant Cash / UPI Checkout
                    </button>
                    <button 
                      onClick={() => onOpenLogin()}
                      className="w-full py-1.5 bg-slate-800 text-slate-300 rounded-lg font-medium text-[11px] hover:bg-slate-700 transition"
                    >
                      📲 WhatsApp Digital Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Metric Badges */}
            <div className="hidden sm:flex items-center gap-2 absolute -top-4 -left-4 bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>0.8s Checkout Speed</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 absolute -bottom-4 -right-4 bg-slate-900/95 border border-indigo-500/40 text-indigo-300 text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Zero-Paper WhatsApp Receipts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Numbers */}
      <section className="py-10 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">50,000+</p>
              <span className="text-xs text-slate-400 font-medium">Invoices Processed</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">₹2.5 Cr+</p>
              <span className="text-xs text-slate-400 font-medium">Platform GMV Handled</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-400">99.98%</p>
              <span className="text-xs text-slate-400 font-medium">System Uptime SLA</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">4.9 / 5</p>
              <span className="text-xs text-slate-400 font-medium">Merchant Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Bento Box */}
      <section id="features" className="scroll-mt-20 py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Engineered for High-Volume Stores</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Everything Your Retail Store Needs to Thrive
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Replace fragmented bookkeeping, slow registers, and paper clutter with an integrated cloud platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Lightning POS Terminal</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hardware barcode scanner integration, keyboard shortcuts (<code className="text-emerald-400">F2</code>), cart quantity adjustments, discount percentages, and cash change calculations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">1-Click WhatsApp Receipts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Save money on paper rolls! Automatically generate itemized receipts with store details and dispatch them directly to the customer's WhatsApp in one tap.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Customer Credit (Khata) Ledger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Digitally track customer balances, credit limits, purchase timelines, and send polite WhatsApp reminders to collect dues faster.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Inventory & Low-Stock Alerts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time stock decrements upon sale completion, profit margin indicator per item, and automatic low-stock reorder warnings.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">100% Offline-Resilient</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Never halt your checkout queue during internet blackouts. The terminal continues processing sales locally and synchronizes automatically upon reconnect.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Daily Profit Insights</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time calculation of today’s gross sales, estimated profit margins, Khata receivables, and tender breakdown (Cash vs UPI vs Card).
              </p>
            </div>

            {/* Feature 7: AI Distributor Bill Scanner */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-800/80 p-6 rounded-2xl border-2 border-indigo-500/50 hover:border-indigo-400 transition group relative overflow-hidden shadow-lg shadow-indigo-950/50 md:col-span-3 lg:col-span-1">
              <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" /> Standout AI
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">AI Distributor Bill Scanner</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Photograph wholesale paper bills or drop supplier PDFs. AI OCR extracts line items, wholesale buy rates, calculates suggested selling prices, matches catalog, and updates stock in 1-click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Super Admin Callout Section */}
      <section id="superadmin" className="scroll-mt-20 py-16 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 rounded-3xl border border-indigo-500/30 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 mb-3">
                <ShieldCheck className="w-4 h-4" /> Built for the SaaS Product Owner
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Super Admin Headquarters
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                As the platform owner, you have a global command dashboard to monitor all onboarded retail organizations, track daily multi-store transaction volume, projected subscription MRR, and suspend or activate accounts in real-time.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Cross-store Daily GMV</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> SaaS MRR & Plan Billing</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Instant Tenant Suspension</span>
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0 flex flex-col gap-2.5">
              <button
                onClick={() => onOpenLogin()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Sign In as Super Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Demo: admin@retailpos.com / admin123
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Transparent Subscription Plans</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Affordable Plans for Every Retail Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Pick the right tier for your store. Upgrade or cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <div className="bg-slate-800/70 p-6 sm:p-8 rounded-3xl border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400 font-medium">/ month forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Perfect for single kiosks, roadside fruit/vegetable stalls, and mini-shops.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 100 orders / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Basic Barcode POS terminal</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Thermal receipt printing</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Offline resilience</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenRegister('starter')}
                className="mt-8 w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Merchant Plan (Highlighted) */}
            <div className="bg-gradient-to-b from-indigo-900/60 to-slate-800/90 p-6 sm:p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl shadow-indigo-950/60 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                ⭐ Most Popular for Retailers
              </div>

              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Pro Merchant</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹799</span>
                  <span className="text-xs text-slate-300 font-medium">/ month</span>
                </div>
                <p className="text-xs text-slate-300 mt-2">For busy grocery, kirana, chemists, and supermarkets.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> <strong>Unlimited</strong> POS Billing Orders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1-Click WhatsApp digital receipts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Customer Khata Credit Ledger & Reminders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Full Inventory & Low-Stock Alerts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Real-time Gross Profit Margin Radar</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenRegister('pro')}
                className="mt-8 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                Start 14-Day Free Pro Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-800/70 p-6 sm:p-8 rounded-3xl border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise & Multi-Store</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹1,999</span>
                  <span className="text-xs text-slate-400 font-medium">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">For retail chains, supermarkets, and multi-branch operations.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Everything in Pro Merchant</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-branch & central inventory</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Staff Cashier accounts & anti-theft logs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority 24/7 WhatsApp & Phone Support</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenRegister('enterprise')}
                className="mt-8 w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
              >
                Get Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="scroll-mt-20 py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Frequently Asked Questions</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Have Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-indigo-300 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white text-center border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black">
            Ready to Take Your Retail Business to the Next Level?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-2 max-w-xl mx-auto">
            Join forward-thinking retailers and start billing in under 2 minutes. Free trial included.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenRegister('pro')}
              className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shadow-lg transition flex items-center gap-2"
            >
              <span>Create Store Account Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenLogin()}
              className="px-6 py-3 rounded-xl bg-indigo-800/80 hover:bg-indigo-700/80 text-white font-bold text-xs border border-indigo-400/30 transition"
            >
              Sign In (Merchant / Super Admin)
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">RetailPOS Cloud SaaS</span>
            <span>• © {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline animate-pulse" />
            <span>by <strong className="text-emerald-400 font-bold">Suman</strong></span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => onOpenLogin()} className="hover:text-white transition">Admin Login</button>
            <button onClick={() => onOpenRegister('starter')} className="hover:text-white transition">Merchant Sign Up</button>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
