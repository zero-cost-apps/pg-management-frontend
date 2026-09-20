import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePG } from '../../context/PGContext';
import { OnboardingData, RoomTypeConfig, Building, Room, Tenant } from '../../types';
import confetti from 'canvas-confetti';
import {
  Building2,
  Home,
  User,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  Calendar,
  Plus,
  MapPin,
  CheckCircle2,
  Layers,
  Phone,
  QrCode,
  DollarSign,
  Users,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_AMENITIES = [
  'High-Speed Wi-Fi',
  'Attached Washroom',
  '3-Times Homely Food',
  '24/7 RO Drinking Water',
  'CCTV Security',
  'Power Backup / Inverter',
  'Daily Room Housekeeping',
  'Washing Machine & Laundry',
  'Air Conditioner (AC)',
  'Individual Cupboard / Locker'
];

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { currentUser, completeOnboarding, logout } = useAuth();
  const { addBuilding, addRoom, addTenant, setSelectedBuildingId } = usePG();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Business Identity State
  const [businessName, setBusinessName] = useState(currentUser?.businessName || '');
  const [businessType, setBusinessType] = useState<'mens_pg' | 'womens_pg' | 'coliving' | 'hostel'>('coliving');
  const [city, setCity] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(currentUser?.phone || '');
  const [upiId, setUpiId] = useState('');

  // STEP 2: Property & Floor Structure State
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');
  const [address, setAddress] = useState('');
  const [billingDueDay, setBillingDueDay] = useState<number>(5);
  const [electricityRate, setElectricityRate] = useState<number>(10);
  const [totalFloors, setTotalFloors] = useState<number>(2);
  const [roomsPerFloor, setRoomsPerFloor] = useState<number>(3);
  const [defaultRoomCapacity, setDefaultRoomCapacity] = useState<number>(2); // 2-person sharing
  const [defaultBaseRent, setDefaultBaseRent] = useState<number>(8500);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-Speed Wi-Fi',
    'Attached Washroom',
    '24/7 RO Drinking Water',
    'CCTV Security',
    'Power Backup / Inverter'
  ]);

  // STEP 3: Initial Tenant Intake (Optional)
  const [intakeMode, setIntakeMode] = useState<'sample' | 'custom' | 'empty'>('sample');
  const [firstTenantName, setFirstTenantName] = useState('');
  const [firstTenantPhone, setFirstTenantPhone] = useState('');
  // const [firstTenantEmail, setFirstTenantEmail] = useState('');
  const [firstTenantRent, setFirstTenantRent] = useState<number>(0);
  const [firstTenantDeposit, setFirstTenantDeposit] = useState<number>(0);

  // Toggle amenity helper
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Calculate generated total rooms
  const totalGeneratedRooms = totalFloors * roomsPerFloor;

  useEffect(() => {
    if (buildingName && buildingName.length >= 2) {
      setBuildingCode(buildingName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    }
  }, [buildingName])
  // Final submit & property provisioning
  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);

    try {
      // 1. Create configured building
      const defaultRoomTypes: RoomTypeConfig[] = [
        {
          id: 'rt_single',
          name: 'Single Private',
          capacity: 1,
          baseRent: Math.round(defaultBaseRent * 1.35),
          description: 'Private single room with personal washroom'
        },
        {
          id: 'rt_double',
          name: 'Double Sharing',
          capacity: 2,
          baseRent: defaultBaseRent,
          description: 'Spacious 2-sharing room with individual lockers'
        },
        {
          id: 'rt_triple',
          name: 'Triple Sharing',
          capacity: 3,
          baseRent: Math.round(defaultBaseRent * 0.8),
          description: 'Affordable 3-sharing room'
        }
      ];
      // Execute atomic onboarding on the backend
      const onboardingData: OnboardingData = {
        businessName,
        businessType,
        city,
        phone: ownerPhone,
        upiId,
        buildingName,
        buildingCode,
        address,
        billingDueDay: Number(billingDueDay),
        electricityRatePerUnit: Number(electricityRate),
        totalFloors: Number(totalFloors),
        roomsPerFloor: Number(roomsPerFloor),
        roomCapacity: defaultRoomCapacity,
        defaultBaseRent,
        amenities: selectedAmenities,
        addInitialTenant: false,
        seedSampleData: false,
        initialTenantName: firstTenantName,
        initialTenantPhone: firstTenantPhone,
        // initialTenantEmail: firstTenantEmail,
        initialTenantRent: firstTenantRent,
        initialTenantDeposit: firstTenantDeposit,
      };

      await completeOnboarding(onboardingData);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">

      {/* Ambient background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar with User Identity & Sign Out */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">StaySync Setup Wizard</span>
              <p className="text-[11px] text-slate-400">Welcome, {currentUser?.fullName || 'Property Owner'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              New Account Onboarding
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stepper Progress Bar */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pt-8 pb-4">
        <div className="flex items-center justify-between relative">

          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {[
            { step: 1, label: 'PG Profile', icon: Building2 },
            { step: 2, label: 'Property & Rooms', icon: Home },
            { step: 3, label: 'Initial Resident', icon: User },
            { step: 4, label: 'Launch Dashboard', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (item.step < currentStep) setCurrentStep(item.step);
                  }}
                  disabled={item.step > currentStep}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-600/40'
                      : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </button>
                <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${isCurrent ? 'text-white' : 'text-slate-400'
                  }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Content Card */}
      <main className="relative z-10 max-w-3xl mx-auto w-full px-4 py-4 flex-1">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">

          {/* STEP 1: BUSINESS BRAND & PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Step 1 of 4: Business Profile
                </div>
                <h2 className="text-xl font-bold text-white">Let's setup your PG & Hostel Brand</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your business details for official rent receipts, tenant agreements, and billing notices.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    PG / Hostel Brand Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Skyline Co-Living & PG"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Property Accommodation Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'coliving', label: 'Co-Living / Unisex', desc: 'Flexible shared living' },
                      { id: 'mens_pg', label: "Men's PG", desc: 'Male working/students' },
                      { id: 'womens_pg', label: "Women's PG", desc: 'Safe female residency' },
                      { id: 'hostel', label: 'Student Hostel', desc: 'College/institute dorm' },
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setBusinessType(type.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${businessType === type.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <p className="text-xs font-bold text-white">{type.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Operating City *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru, Pune, Hyderabad"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Manager / Helpline Phone *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    UPI ID for Rent Collection (Appears on Printable Tax Invoices & QR Codes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourbusiness@upi or 9876543210@paytm"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROPERTY & ROOM MATRIX */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                  <Home className="w-3.5 h-3.5" /> Step 2 of 4: First Property & Rooms
                </div>
                <h2 className="text-xl font-bold text-white">Create your first PG building & room units</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Our wizard will automatically provision rooms, floor numbers, and electric sub-meters for you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Building / Block Name *
                    </label>
                    <input
                      type="text"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="e.g. Skyline Tower - Block A"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Short Code *
                    </label>
                    <input
                      type="text"
                      value={buildingCode}
                      onChange={(e) => setBuildingCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STA"
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-hidden focus:border-indigo-500 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Property Address & Locality
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 14, 5th Main, 7th Sector, HSR Layout"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Floor and Room Generator Matrix */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Quick Room Generator
                    </span>
                    <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      Generates {totalGeneratedRooms} Rooms (e.g. 101, 102, 201...)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Total Floors</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Rooms Per Floor</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={roomsPerFloor}
                        onChange={(e) => setRoomsPerFloor(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Room Capacity</label>
                      <select
                        value={defaultRoomCapacity}
                        onChange={(e) => setDefaultRoomCapacity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-semibold"
                      >
                        <option value={1}>1 Person (Private)</option>
                        <option value={2}>2 Sharing (Standard)</option>
                        <option value={3}>3 Sharing</option>
                        <option value={4}>4 Sharing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Base Monthly Rent (₹)</label>
                      <input
                        type="number"
                        step={500}
                        value={defaultBaseRent}
                        onChange={(e) => setDefaultBaseRent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Cycle & Electricity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Rent Due Date (Every Month)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <select
                        value={billingDueDay}
                        onChange={(e) => setBillingDueDay(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-medium"
                      >
                        {[1, 2, 3, 5, 7, 10, 15].map(day => (
                          <option key={day} value={day}>{day}th of every month</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Electricity Sub-Meter Rate (₹ per unit)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <input
                        type="number"
                        step={0.5}
                        value={electricityRate}
                        onChange={(e) => setElectricityRate(Number(e.target.value))}
                        placeholder="10"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Amenities checklist */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Property Amenities Included
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMMON_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`p-2 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                          <span className="text-[11px] truncate">{amenity}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL RESIDENT INTAKE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                  <User className="w-3.5 h-3.5" /> Step 3 of 4: Resident Intake
                </div>
                <h2 className="text-xl font-bold text-white">How would you like to start?</h2>
                <p className="text-xs text-slate-400 mt-1">
                  You can seed a sample resident to test receipts and overdue reports, add a real tenant now, or start fresh.
                </p>
              </div>

              {/* Intake Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIntakeMode('sample')}
                  className={`p-4 rounded-xl border text-left transition-all ${intakeMode === 'sample'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">Pre-load Starter Resident</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Adds 1 sample tenant in Room 101 with pre-filled profile to test rent collection instantly.
                  </p>
                </button>

                {/* <button
                  type="button"
                  onClick={() => setIntakeMode('custom')}
                  className={`p-4 rounded-xl border text-left transition-all ${intakeMode === 'custom'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Plus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white">Add My First Tenant</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter details for a real resident checking into Room 101 right now.
                  </p>
                </button> */}

                <button
                  type="button"
                  onClick={() => setIntakeMode('empty')}
                  className={`p-4 rounded-xl border text-left transition-all ${intakeMode === 'empty'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Home className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-white">Start With Empty Rooms</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    All {totalGeneratedRooms} rooms vacant. Add tenants later via the Rooms or Tenants screen.
                  </p>
                </button>
              </div>

              {/* Custom Tenant Form if selected */}
              {intakeMode === 'custom' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    First Resident Details (Assigned to Room 101)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Tenant Full Name *</label>
                      <input
                        type="text"
                        value={firstTenantName}
                        onChange={(e) => setFirstTenantName(e.target.value)}
                        placeholder="e.g. Aditya Nair"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={firstTenantPhone}
                        onChange={(e) => setFirstTenantPhone(e.target.value)}
                        placeholder="10-digit phone"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        value={firstTenantRent}
                        onChange={(e) => setFirstTenantRent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={firstTenantDeposit}
                        onChange={(e) => setFirstTenantDeposit(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {intakeMode === 'sample' && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Starter Resident Ready:</span> Aditya Nair will be assigned to Room 101 with rent of ₹{defaultBaseRent.toLocaleString('en-IN')}/month. You can test manual rent receipts, collect rent, or log sub-meter readings immediately.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: VERIFICATION & LAUNCH */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Step 4 of 4: Review & Launch
                </div>
                <h2 className="text-xl font-bold text-white">Your PG property is ready to launch!</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Review your property configuration before opening the operations dashboard.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Brand & Building Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Property & Brand</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{businessName}</h3>
                    <p className="text-xs text-slate-400">{buildingName} ({buildingCode})</p>
                    <p className="text-[11px] text-slate-500 mt-1">{address}, {city}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Accommodation:</span>
                    <span className="font-semibold text-slate-200 capitalize">{businessType.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Rooms & Capacity Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Home className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Rooms & Inventory</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase">Total Rooms</span>
                      <p className="text-lg font-bold font-mono text-white mt-0.5">{totalGeneratedRooms}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 uppercase">Floors</span>
                      <p className="text-lg font-bold font-mono text-white mt-0.5">{totalFloors}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Base Monthly Rent:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{defaultBaseRent.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>

                {/* Billing & Tariff */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Billing Setup</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due Date:</span>
                      <span className="font-semibold text-white">{billingDueDay}th of month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Electricity Tariff:</span>
                      <span className="font-mono font-semibold text-white">₹{electricityRate}/unit</span>
                    </div>
                    {upiId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">UPI ID:</span>
                        <span className="font-mono text-indigo-400 truncate max-w-[150px]">{upiId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resident Status */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Initial Residents</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {intakeMode === 'empty'
                      ? 'No tenants yet — all rooms ready for check-in.'
                      : intakeMode === 'sample'
                        ? 'Aditya Nair (Room 101) pre-loaded for instant operations.'
                        : `${firstTenantName} (Room 101) registered.`
                    }
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedAmenities.length} property amenities configured.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                id="onboarding-next-btn"
                onClick={() => {
                  // console.log("clicked", businessName, currentStep)
                  if (currentStep === 1 && !businessName.trim()) {
                    toast.error("Business name is mandatory!")
                    return;
                  }
                  if (currentStep === 2 && !buildingName.trim()) {
                    toast.error("Building name is mandatory!")
                    return;
                  }
                  setCurrentStep(prev => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/30 active:scale-98"
              >
                Continue to Step {currentStep + 1}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                id="onboarding-finish-btn"
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Provisioning PG Property...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Complete Setup & Open Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer reassurance */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-500 border-t border-slate-900 bg-slate-950">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          StaySync PG Management • Local IndexedDB Database Active
        </p>
      </footer>

    </div>
  );
};
