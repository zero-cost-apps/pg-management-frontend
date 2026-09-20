import React, { useState } from 'react';
import { useAuth, SAAS_PLANS } from '../../context/AuthContext';
import { usePG } from '../../context/PGContext';
import { SaasPlanTier } from '../../types';
import { 
  X, 
  Check, 
  Zap, 
  Crown, 
  ShieldCheck, 
  Building2, 
  Home, 
  CreditCard, 
  ArrowRight,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, upgradeSubscription } = useAuth();
  const { rooms, buildings } = usePG();
  const [selectedTier, setSelectedTier] = useState<SaasPlanTier>(
    currentUser?.subscription?.planTier || 'growth'
  );
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const currentSub = currentUser.subscription || {
    planTier: 'growth' as SaasPlanTier,
    planName: 'Growth Pro Multi-Property',
    status: 'active' as const,
    renewalDate: '2026-12-31',
    monthlyPrice: 1499,
    maxRooms: 50,
    maxBuildings: 5,
    features: SAAS_PLANS.growth.features
  };

  const totalRoomsUsed = rooms.length;
  const totalBuildingsUsed = buildings.length;
  const roomPercentage = Math.min(100, Math.round((totalRoomsUsed / currentSub.maxRooms) * 100));
  const buildingPercentage = Math.min(100, Math.round((totalBuildingsUsed / currentSub.maxBuildings) * 100));

  const handleUpgrade = (tier: SaasPlanTier) => {
    setIsUpgrading(true);
    setTimeout(() => {
      upgradeSubscription(tier);
      setIsUpgrading(false);
      setUpgradeSuccess(true);
      setTimeout(() => setUpgradeSuccess(false), 3500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">StaySync SaaS Plan & Quota</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentSub.status === 'active' ? 'Active Subscription' : 'Free Trial'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Workspace plan for <span className="font-semibold text-white">{currentUser.businessName || 'Your PG'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {upgradeSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your StaySync subscription was successfully updated to <strong>{currentUser.subscription?.planName}</strong>! Quota updated immediately.</span>
            </div>
          )}

          {/* Current Plan & Usage Meter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Active Plan Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Plan</p>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{currentSub.planName}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  ₹{currentSub.monthlyPrice.toLocaleString('en-IN')}<span className="text-[11px] text-slate-400"> / month</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Renews:
                </span>
                <span className="font-bold text-slate-700">{currentSub.renewalDate}</span>
              </div>
            </div>

            {/* Room Quota Gauge */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rooms Quota</p>
                  <span className="text-xs font-bold text-indigo-600">{totalRoomsUsed} / {currentSub.maxRooms}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      roomPercentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${roomPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {currentSub.maxRooms - totalRoomsUsed} additional rooms available on current tier
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity limit</span>
                <span className="font-bold text-slate-700">{currentSub.maxRooms} Rooms</span>
              </div>
            </div>

            {/* Building Quota Gauge */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Properties Quota</p>
                  <span className="text-xs font-bold text-indigo-600">{totalBuildingsUsed} / {currentSub.maxBuildings}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      buildingPercentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${buildingPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {currentSub.maxBuildings - totalBuildingsUsed} building slots remaining
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Branch limit</span>
                <span className="font-bold text-slate-700">{currentSub.maxBuildings} Buildings</span>
              </div>
            </div>

          </div>

          {/* Pricing Tier Comparison */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Available StaySync Plans for PG Owners
              </h3>
              <span className="text-xs text-slate-500">Prices exclude GST (18%)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Starter Tier */}
              <div className={`p-4 rounded-xl border transition-all ${
                currentSub.planTier === 'starter' 
                  ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/20' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Starter</h4>
                  {currentSub.planTier === 'starter' && (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">₹699</span>
                  <span className="text-xs text-slate-500"> / month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Ideal for single-building PG owners starting out.</p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 20 Rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 PG Building Property</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Aadhaar Document Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Manual Rent Receipts</span>
                  </div>
                </div>

                <div className="mt-5">
                  {currentSub.planTier === 'starter' ? (
                    <button
                      disabled
                      className="w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('starter')}
                      disabled={isUpgrading}
                      className="w-full py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Switch to Starter
                    </button>
                  )}
                </div>
              </div>

              {/* Growth Pro Tier */}
              <div className={`p-4 rounded-xl border relative transition-all ${
                currentSub.planTier === 'growth' 
                  ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/20 shadow-md shadow-indigo-100' 
                  : 'border-indigo-300 hover:border-indigo-500 bg-white'
              }`}>
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider">
                  Most Popular
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Growth Pro</h4>
                  {currentSub.planTier === 'growth' && (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">₹1,499</span>
                  <span className="text-xs text-slate-500"> / month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">For multi-building owners with high occupancy.</p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 50 Rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 5 PG Buildings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sub-meter Auto Calculation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp Rent Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Custom UPI QR Receipts</span>
                  </div>
                </div>

                <div className="mt-5">
                  {currentSub.planTier === 'growth' ? (
                    <button
                      disabled
                      className="w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('growth')}
                      disabled={isUpgrading}
                      className="w-full py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      Upgrade to Growth
                    </button>
                  )}
                </div>
              </div>

              {/* Enterprise Tier */}
              <div className={`p-4 rounded-xl border transition-all ${
                currentSub.planTier === 'enterprise' 
                  ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/20' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Enterprise Co-Living</h4>
                  {currentSub.planTier === 'enterprise' && (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">₹3,499</span>
                  <span className="text-xs text-slate-500"> / month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Complete portfolio management with 24/7 VIP support.</p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 200 Rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Up to 20 PG Buildings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Advanced Multi-City Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Bulk CSV Data Export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dedicated Relationship Manager</span>
                  </div>
                </div>

                <div className="mt-5">
                  {currentSub.planTier === 'enterprise' ? (
                    <button
                      disabled
                      className="w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-lg cursor-default"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('enterprise')}
                      disabled={isUpgrading}
                      className="w-full py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Upgrade to Enterprise
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure 256-bit encrypted SaaS subscription billing via Razorpay & UPI AutoPay.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
