import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { getFloorLabel } from '../../utils/floor';
import { 
  X, 
  Zap, 
  Building2, 
  Home, 
  Users, 
  Check, 
  Camera, 
  AlertCircle 
} from 'lucide-react';

interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoomId?: string;
}

export const MeterReadingModal: React.FC<MeterReadingModalProps> = ({
  isOpen,
  onClose,
  preselectedRoomId
}) => {
  const { 
    buildings, 
    rooms, 
    tenants, 
    logElectricityReading,
    selectedBuildingId: globalSelectedBuildingId 
  } = usePG();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    globalSelectedBuildingId && globalSelectedBuildingId !== 'all' ? globalSelectedBuildingId : buildings[0]?.id || ''
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(preselectedRoomId || '');
  const [month, setMonth] = useState<string>('2026-09');
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previousReading, setPreviousReading] = useState<number>(0);
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [ratePerUnit, setRatePerUnit] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [meterPhoto, setMeterPhoto] = useState<string>('');

  // Available rooms for selected building
  const availableRooms = rooms.filter(r => !selectedBuildingId || r.buildingId === selectedBuildingId);

  // Initialize selected building & room
  useEffect(() => {
    if (preselectedRoomId) {
      const rm = rooms.find(r => r.id === preselectedRoomId);
      if (rm) {
        setSelectedBuildingId(rm.buildingId);
        setSelectedRoomId(rm.id);
      }
    } else {
      const targetBldId = (globalSelectedBuildingId && globalSelectedBuildingId !== 'all') 
        ? globalSelectedBuildingId 
        : buildings[0]?.id || '';
      setSelectedBuildingId(targetBldId);
      const bldRooms = rooms.filter(r => r.buildingId === targetBldId);
      if (bldRooms.length > 0) {
        setSelectedRoomId(bldRooms[0].id);
      }
    }
  }, [preselectedRoomId, isOpen, globalSelectedBuildingId]);

  const currentRoom = rooms.find(r => r.id === selectedRoomId);
  const currentBuilding = buildings.find(b => b.id === (currentRoom?.buildingId || selectedBuildingId));

  // Sync previous reading & rate when room or building changes
  useEffect(() => {
    if (currentRoom) {
      const prev = currentRoom.lastMeterReading || 1000;
      setPreviousReading(prev);
      setCurrentReading(prev + 45); // default realistic increment
    }
    if (currentBuilding) {
      setRatePerUnit(currentBuilding.electricityRatePerUnit);
    }
  }, [currentRoom, currentBuilding]);

  // Active occupants in this room
  const occupants = tenants.filter(t => t.roomId === selectedRoomId && t.status !== 'vacated');
  const splitCount = Math.max(1, occupants.length);

  // Units and cost
  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const totalAmount = Math.round(unitsConsumed * ratePerUnit);
  const amountPerTenant = Number((totalAmount / splitCount).toFixed(1));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !currentBuilding) {
      alert('Please select a valid room and building');
      return;
    }

    if (currentReading < previousReading) {
      if (!window.confirm('Current reading is lower than previous reading. Proceed anyway?')) {
        return;
      }
    }

    logElectricityReading({
      buildingId: currentBuilding.id,
      roomId: currentRoom.id,
      roomNumber: currentRoom.roomNumber,
      month,
      readingDate,
      previousReading,
      currentReading,
      unitsConsumed,
      ratePerUnit,
      totalAmount,
      splitCount,
      amountPerTenant,
      status: 'billed',
      meterPhotoUrl: meterPhoto || undefined,
      notes: notes.trim() || undefined,
      billedTenantIds: occupants.map(o => o.id)
    });

    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMeterPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Electricity Meter</h3>
              <p className="text-xs text-slate-500">Log monthly units and split charges between occupants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Building & Room Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Building *
              </label>
              <select
                value={selectedBuildingId}
                onChange={e => {
                  setSelectedBuildingId(e.target.value);
                  const firstRoomInBld = rooms.find(r => r.buildingId === e.target.value);
                  if (firstRoomInBld) setSelectedRoomId(firstRoomInBld.id);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Room *
              </label>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                required
              >
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({getFloorLabel(r.floor)} • Capacity {r.capacity} pax)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Occupants banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Active Occupants in Room ({occupants.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Sub-meter: {currentRoom?.meterNumber || 'Standard'}
              </span>
            </div>
            {occupants.length === 0 ? (
              <p className="text-amber-600 font-medium">Room currently vacant. Charge will be billed to property owner/empty ledger.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {occupants.map(o => (
                  <span key={o.id} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-800">
                    {o.fullName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Billing Month & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Month *
              </label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reading Date *
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={e => setReadingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                required
              />
            </div>
          </div>

          {/* Meter Readings & Rate */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-3">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Sub-meter Calculation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Previous Reading
                </label>
                <input
                  type="number"
                  value={previousReading}
                  onChange={e => setPreviousReading(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Current Reading *
                </label>
                <input
                  type="number"
                  value={currentReading}
                  onChange={e => setCurrentReading(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-amber-400 bg-white rounded-lg font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Rate/Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={ratePerUnit}
                  onChange={e => setRatePerUnit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
            </div>

            {/* Calculated Results */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-white border border-amber-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Units Consumed</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{unitsConsumed} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Total Bill</span>
                <span className="font-mono font-bold text-amber-700 text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Per Tenant ({splitCount})</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">₹{amountPerTenant.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Photo & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meter Photo Proof (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Meter Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {meterPhoto && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Photo Attached
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meter Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Verified sub-meter dial, AC compressor run confirmed"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              Save Reading & Split Bill
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
