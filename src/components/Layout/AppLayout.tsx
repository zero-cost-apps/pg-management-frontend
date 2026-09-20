import React, { useState } from 'react';
import { usePG } from '../../context/PGContext';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionModal } from '../SaaS/SubscriptionModal';
import { BusinessSettingsModal } from '../SaaS/BusinessSettingsModal';
import {
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  Zap,
  AlertTriangle,
  Building2,
  Plus,
  CreditCard,
  Bell,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Search,
  Database,
  Download,
  RotateCcw,
  Sparkles,
  Check,
  User,
  LogOut,
  Sliders,
  RefreshCw,
  Crown,
  ArrowRight,
  Settings
} from 'lucide-react';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  onOpenRentModal: (tenantId?: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
  onOpenRentModal
}) => {
  const {
    buildings,
    rooms,
    selectedBuildingId,
    setSelectedBuildingId,
    overdueList,
    stats,
    tenants,
    coOccupants,
    searchQuery,
    setSearchQuery,
    isDbReady,
    dbEngineName,
    lastSyncTime,
    exportDataJson,
    resetToSampleData
  } = usePG();

  const { currentUser, logout, resetOnboardingForTesting } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDbMenu, setShowDbMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isBusinessSettingsOpen, setIsBusinessSettingsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'rooms',
      label: 'Rooms & Tenancy',
      icon: Home,
      badge: `${stats.vacantRooms} Vacant`
    },
    {
      id: 'tenants',
      label: 'Tenants & Guests',
      icon: Users,
      count: stats.totalResidents
    },
    { id: 'rent', label: 'Rent Collection', icon: Receipt },
    { id: 'electricity', label: 'Electricity Logs', icon: Zap },
    {
      id: 'overdue',
      label: 'Overdue Tracker',
      icon: AlertTriangle,
      alertCount: overdueList.length
    },
    { id: 'buildings', label: 'Building Config', icon: Building2, count: buildings.length },
  ];

  const currentBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Tab Title helper
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'rooms': return 'Rooms & Tenancy Tracking';
      case 'tenants': return 'Tenant & Guest Directory';
      case 'rent': return 'Rent Collection & Ledger';
      case 'electricity': return 'Monthly Electricity Records';
      case 'overdue': return 'Automated Overdue Reports';
      case 'buildings': return 'Building Configuration';
      default: return 'PG Operations Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

      {/* Redesigned Top Header (Spans the entire screen on desktop & mobile) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">

          {/* Left: Brand / Mobile Toggle / Breadcrumb & DB Status */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Mark */}
            <div
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-tight text-slate-900 text-sm">StaySync</span>
                  {/* <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                    PG OS
                  </span> */}
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Rental Management</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-6 w-px bg-slate-200" />

            {/* Breadcrumb / Current View Context */}
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>Management</span>
                <span>/</span>
                <span className="text-indigo-600 font-semibold capitalize">{currentTab}</span>
                {selectedBuildingId !== 'all' && currentBuilding && (
                  <>
                    <span>/</span>
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">{currentBuilding.name}</span>
                  </>
                )}
              </div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
                {getTabTitle(currentTab)}
              </h2>
            </div>

            {/* Database Engine Status Pill */}
            <div className="relative hidden xl:flex items-center">
              {/* <button
                onClick={() => setShowDbMenu(!showDbMenu)}
                title="Pluggable Database Adapter (IndexedDB active, supports MongoDB / Supabase / Firebase)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Database className="w-3 h-3 text-emerald-600" />
                <span className="font-mono text-[10px]">IndexedDB Synced</span>
                <ChevronDown className="w-3 h-3 text-emerald-600 ml-0.5" />
              </button> */}

              {/* Database Dropdown Menu */}
              {showDbMenu && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowDbMenu(false)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" /> Pluggable DB Architecture
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      v1.2
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Persistent browser IndexedDB with seamless migration interface for <strong>MongoDB</strong>, <strong>Supabase</strong>, or <strong>Firebase</strong>.
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Last write: {lastSyncTime || 'Ready'}
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        exportDataJson();
                        setShowDbMenu(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors text-[11px]"
                    >
                      <Download className="w-3 h-3" /> Backup JSON
                    </button>
                    <button
                      onClick={() => {
                        resetToSampleData();
                        setShowDbMenu(false);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Center Search Input */}
          {/* <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search rooms, tenants, receipts..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div> */}

          {/* Right Section: Active Property View & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* ACTIVE PROPERTY VIEW DROPDOWN (PROMINENT TOP RIGHT) */}
            <div className="flex items-center bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl p-1 shadow-2xs transition-colors">
              <div className="flex items-center gap-1.5 pl-2 pr-1 text-slate-600">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="hidden xl:inline text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Property:
                </span>
              </div>

              <div className="relative">
                <select
                  id="navbar-active-property-select"
                  value={selectedBuildingId}
                  onChange={e => setSelectedBuildingId(e.target.value)}
                  className="pl-2 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer max-w-[150px] sm:max-w-[190px] md:max-w-[210px] truncate"
                  title="Switch active building scope"
                >
                  <option value="all">All Buildings ({buildings.length} Properties)</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Live Property Rate Badge when a specific property is chosen */}
              {currentBuilding && (
                <div className="hidden 2xl:flex items-center gap-1.5 pl-2 pr-2 border-l border-slate-200 text-[10px] font-mono text-slate-600 font-semibold">
                  <span className="text-amber-600">⚡ ₹{currentBuilding.electricityRatePerUnit}/u</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600">Due {currentBuilding.billingDueDay}th</span>
                </div>
              )}
            </div>

            {/* Overdue Alert Badge */}
            {/* {overdueList.length > 0 && (
              <button
                id="navbar-overdue-alert-btn"
                onClick={() => onTabChange('overdue')}
                title={`${overdueList.length} tenants with overdue payments`}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                <span className="hidden sm:inline font-semibold">Overdue</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono">
                  {overdueList.length}
                </span>
              </button>
            )} */}

            {/* Manual Collect Rent Button */}
            <button
              id="navbar-collect-rent-btn"
              onClick={() => onOpenRentModal()}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-700/20"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Collect Rent</span>
              <span className="sm:hidden font-mono text-xs">+ Collect</span>
            </button>

            {/* User Profile Menu Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-slate-300 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0)
                    )}
                  </div>
                  <div className="hidden xl:block pr-1 text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                      {currentUser.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in-50 zoom-in-95">

                      {/* User Header */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm overflow-hidden shrink-0">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                          ) : (
                            currentUser.fullName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                              PG Owner
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5 text-emerald-600" />
                              {currentUser.subscription?.planTier === 'enterprise' ? 'Enterprise' : currentUser.subscription?.planTier === 'starter' ? 'Starter' : 'Pro Growth'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="my-2 border-t border-slate-100" />

                      {/* Menu Actions */}
                      <div className="space-y-1 text-xs">

                        {/* Business & Payment Settings */}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setIsBusinessSettingsOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors font-medium text-left"
                        >
                          <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">PG Business & UPI Settings</p>
                            <p className="text-[10px] text-slate-400">Brand, GST, and rent collection UPI VPA</p>
                          </div>
                        </button>

                        {/* SaaS Subscription & Quota */}
                        {/* <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setIsSubscriptionModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors font-medium text-left"
                        >
                          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">SaaS Plan & Quota</p>
                            <p className="text-[10px] text-slate-400">Usage limits, active tier, and billing</p>
                          </div>
                        </button> */}

                        {/* Run Property Setup Wizard */}
                        {/* <button
                          onClick={() => {
                            setShowUserMenu(false);
                            resetOnboardingForTesting();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors font-medium text-left"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">Run Setup Wizard</p>
                            <p className="text-[10px] text-slate-400">Add or configure new PG building</p>
                          </div>
                        </button> */}

                      </div>

                      <div className="my-2 border-t border-slate-100" />

                      {/* Log Out */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Navigation Sidebar (Desktop persistent, mobile drawer) */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between
          transition-transform duration-300 ease-in-out border-r border-slate-800 shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div>
            {/* Mobile Sidebar Close Bar */}
            <div className="lg:hidden p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  PG
                </div>
                <span className="font-extrabold text-sm text-white">StaySync PG</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Property summary pill in sidebar */}
            {/* <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="uppercase tracking-wider font-semibold text-[10px]">Property Filter</span>
                <span className="text-indigo-400 font-mono text-[10px]">Top-Right Switcher</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-200 truncate">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{currentBuilding ? currentBuilding.name : `All ${buildings.length} Properties`}</span>
              </div>
            </div> */}

            {/* Nav Menu Items */}
            <nav className="p-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.alertCount !== undefined && item.alertCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          {item.alertCount}
                        </span>
                      )}
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-emerald-400'
                          }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>


          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800 space-y-2.5">

            {/* SaaS Plan & Quota Card */}
            <div className=" mb-2 p-3 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-900/60 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{currentUser?.subscription?.planName || 'Growth Pro'}</span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
                <span>Rooms Quota</span>
                <span className="font-semibold text-slate-200">{rooms.length} / {currentUser?.subscription?.maxRooms || 50}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((rooms.length / (currentUser?.subscription?.maxRooms || 50)) * 100))}%` }}
                />
              </div>
              {/* <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1"
            >
              <span>Manage SaaS Plan</span>
              <ArrowRight className="w-3 h-3" />
            </button> */}
            </div>

            {currentUser && (
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-400 capitalize truncate">{currentUser.role} • {currentUser.businessName || 'PG'}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* <button
              onClick={() => onOpenRentModal()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              <CreditCard className="w-4 h-4" />
              Collect Rent (Manual)
            </button> */}

            {/* Storage Info Badge */}
            {/* <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] min-w-0">
                  <p className="font-semibold text-slate-200 truncate">IndexedDB Active</p>
                  <p className="text-[9px] text-slate-400 truncate">Pluggable Adapter</p>
                </div>
              </div>

              <button
                onClick={exportDataJson}
                title="Export JSON Data Backup"
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div> */}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-y-auto">

          {/* Main View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

        </div>

      </div>

      {/* SaaS Subscription & Quota Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* PG Business & UPI Payment Settings Modal */}
      <BusinessSettingsModal
        isOpen={isBusinessSettingsOpen}
        onClose={() => setIsBusinessSettingsOpen(false)}
      />

    </div>
  );
};
