import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Users,
  AlertTriangle,
  Sparkles,
  Smartphone,
  FileText,
  Star,
  ChevronRight,
  CreditCard,
  BedDouble,
  BarChart3,
  Flame,
  Clock,
  Laptop
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'rooms' | 'rent' | 'power'>('rooms');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">

      {/* Background Decorative Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/25 via-purple-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[60%] -right-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">StaySync</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  PG OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Smart PG & Co-Living Management</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Product Demo</a>
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="relative group px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Floating Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 shadow-inner shadow-indigo-500/10 backdrop-blur-md animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Next-Gen Operating System for PG & Co-Living Owners</span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-cyan-300 font-mono">100% Cloud-Synced</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
          Supercharge Your PG. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Collect Rent Faster. Zero Defaulters.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
          Manage multiple buildings, live bed occupancies, per-room electricity sub-meters, and 1-click WhatsApp rent collection with automatic printable PDF receipts.
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <Laptop className="w-4 h-4 text-indigo-400" />
            <span>Open PG Dashboard</span>
          </Link>
        </div>

        {/* Micro-assurances */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Setup in 2 minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-building support</span>
          </div>
        </div>

        {/* INTERACTIVE PRODUCT PREVIEW CARD */}
        <div id="preview" className="mt-16 sm:mt-20 relative mx-auto max-w-5xl rounded-3xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-slate-900/10 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl">
          <div className="bg-slate-900/90 rounded-[23px] border border-slate-800 p-4 sm:p-6 lg:p-8 text-left">
            
            {/* Window bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">StaySync Control Panel — Indiranagar Skyline PG</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Rent Collected</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">₹4,85,000</div>
                <span className="text-[11px] text-emerald-400 font-semibold">+14.2% vs last month</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Occupancy Rate</span>
                  <BedDouble className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">95.8%</div>
                <span className="text-[11px] text-indigo-300 font-semibold">46 / 48 Beds Active</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Electricity Billed</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">1,420 Units</div>
                <span className="text-[11px] text-amber-300 font-semibold">₹14,200 @ ₹10/unit</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Pending Overdue</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-400">₹16,500</div>
                <span className="text-[11px] text-rose-300 font-semibold">2 Tenants Flagged</span>
              </div>
            </div>

            {/* Interactive Tab Switcher in Mockup */}
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-2">
              <button
                onClick={() => setActiveFeatureTab('rooms')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureTab === 'rooms'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Room & Bed Matrix
              </button>
              <button
                onClick={() => setActiveFeatureTab('rent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureTab === 'rent'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                1-Click Rent Receipts
              </button>
              <button
                onClick={() => setActiveFeatureTab('power')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFeatureTab === 'power'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Sub-Meter Electricity
              </button>
            </div>

            {/* Mock View Content */}
            {activeFeatureTab === 'rooms' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Room 101</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      Occupied
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Single Room • Floor 1</p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">Rahul Sharma</span>
                    <span className="text-emerald-400 font-mono">₹12,000/mo</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Room 102</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      Double Sharing
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Double Sharing • Floor 1</p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">Ankit & Co-occupant</span>
                    <span className="text-indigo-300 font-mono">2 / 2 Beds</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex flex-col justify-between bg-gradient-to-br from-cyan-950/20 to-slate-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Room 201</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse">
                      Vacant (Ready)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Single AC • Floor 2</p>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-cyan-400">+ New Check-In</span>
                    <span className="text-white font-mono">₹14,500/mo</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'rent' && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Receipt #RCP-202609-014 Generated</div>
                    <p className="text-xs text-slate-400">₹14,250 received via UPI from Priya Patel (Room 203)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    Sent on WhatsApp
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    PDF Downloaded
                  </span>
                </div>
              </div>
            )}

            {activeFeatureTab === 'power' && (
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Room 302 Meter: 120 Units Consumed</div>
                    <p className="text-xs text-slate-400">Previous: 1040 • Current: 1160 • Divided equally among 2 tenants (₹600 each)</p>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                  Auto-Added to Rent Dues
                </span>
              </div>
            )}

          </div>
        </div>

      </section>

      {/* STATS STRIP */}
      <section className="relative z-10 border-y border-slate-800/80 bg-slate-950/50 backdrop-blur-md py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">500+</div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">PG Buildings Managed</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">14,000+</div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Verified Active Tenants</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400">₹48 Cr+</div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Rent Collected Online</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">99.8%</div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">On-Time Payment Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Engineered For Scale</h2>
          <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Everything You Need To Automate Your PG Operations
          </h3>
          <p className="mt-4 text-base text-slate-400">
            Stop managing hundreds of tenants on WhatsApp and paper diaries. Upgrade to an integrated cloud workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Multi-Building Architecture</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run 1 building or 20 buildings under a single account. Seamlessly switch properties from the top navbar without re-logging in.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">1-Click WhatsApp Invoicing</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Record rent via UPI, Cash, or Netbanking. Automatically generate printable GST-compliant receipts and share them directly on WhatsApp.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Sub-Meter Electricity Splits</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Log monthly meter readings per room. The engine automatically calculates units consumed and splits the amount equally among roommates.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <BedDouble className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Live Room & Bed Matrix</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Color-coded floor-by-floor view of every bed: occupied, vacant, notice period, or maintenance. Never lose revenue to empty beds.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">KYC & Aadhaar Vault</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Complete tenant profile management with built-in Aadhaar ID document viewer. Fast check-ins and legal compliance at your fingertips.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-900 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Automated Overdue Tracking</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Configurable due dates (e.g. 5th of every month). Instant visibility into overdue balances, days delayed, and 1-click payment nudges.
            </p>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="relative z-10 py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">Loved By PG Operators Across India</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "We operate 4 buildings in Indiranagar with 140 beds. Earlier, electricity disputes were a daily nightmare. With StaySync's automated unit split and WhatsApp receipts, our collections happen on time without arguments."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  RS
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Rajesh Sharma</div>
                  <div className="text-[11px] text-slate-400">Skyline Luxury PG, Bengaluru</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "The room grid is phenomenal. I can see in 2 seconds which beds are going on notice next week and fill them before they become vacant. Best investment for our business."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-xs">
                  VP
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Vikas Patil</div>
                  <div className="text-[11px] text-slate-400">GreenWood Coliving, Pune</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "Checking in tenants takes under a minute now. Aadhaar verification and security deposit tracking give me total peace of mind. Highly recommended!"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                  MK
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Meenakshi Kaul</div>
                  <div className="text-[11px] text-slate-400">SilverOak Stay, Gurugram</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-14 text-center border border-indigo-500/30 shadow-2xl shadow-indigo-950">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to automate your PG and collect rent stress-free?
            </h3>
            <p className="mt-4 text-base sm:text-lg text-indigo-200">
              Join 500+ successful PG operators today. Free 14-day trial, no credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-indigo-950 bg-white hover:bg-slate-100 shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-white bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-400/30 transition-all"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">StaySync PG Management</span>
            <span className="text-slate-600">|</span>
            <span>Made for Indian PG & Co-Living Communities</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Live Demo</a>
          </div>

          <div>
            © {new Date().getFullYear()} StaySync Technologies. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
