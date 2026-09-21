import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { Building, RoomTypeConfig, FloorConfig } from '../../types';
import { getFloorLabel } from '../../utils/floor';
import { X, Building2, Check, Plus, Trash2, Zap, DollarSign, Layers } from 'lucide-react';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingToEdit?: Building | null;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  isOpen,
  onClose,
  buildingToEdit
}) => {
  const { addBuilding, updateBuilding } = usePG();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru, Karnataka');
  const [totalFloors, setTotalFloors] = useState(3);
  const [electricityRatePerUnit, setElectricityRatePerUnit] = useState(11.5);
  const [billingDueDay, setBillingDueDay] = useState(5);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [rulesNotes, setRulesNotes] = useState('');

  // Floor-Wise Room Configuration State
  const [hasGroundFloor, setHasGroundFloor] = useState<boolean>(true);
  const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>([
    { floor: 0, roomCount: 3, name: 'Ground Floor' },
    { floor: 1, roomCount: 4, name: '1st Floor' },
    { floor: 2, roomCount: 4, name: '2nd Floor' },
  ]);

  // Room Types Configuration
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>([
    { id: 'rt-single', name: 'Private Single Studio', capacity: 1, baseRent: 16000 },
    { id: 'rt-double', name: 'Standard Double Sharing', capacity: 2, baseRent: 10500 },
    { id: 'rt-triple', name: 'Comfort Triple Sharing', capacity: 3, baseRent: 8000 }
  ]);

  useEffect(() => {
    if (buildingToEdit) {
      setName(buildingToEdit.name);
      setCode(buildingToEdit.code);
      setAddress(buildingToEdit.address);
      setCity(buildingToEdit.city);
      setTotalFloors(buildingToEdit.totalFloors);
      setElectricityRatePerUnit(buildingToEdit.electricityRatePerUnit);
      setBillingDueDay(buildingToEdit.billingDueDay);
      setManagerName(buildingToEdit.managerName);
      setManagerPhone(buildingToEdit.managerPhone);
      setUpiId(buildingToEdit.upiId || '');
      setRulesNotes(buildingToEdit.rulesNotes || '');
      setRoomTypes(buildingToEdit.roomTypes || []);
      if (buildingToEdit.floorConfigs && buildingToEdit.floorConfigs.length > 0) {
        setFloorConfigs(buildingToEdit.floorConfigs);
        setHasGroundFloor(buildingToEdit.floorConfigs.some(f => f.floor === 0));
      } else {
        const floors: FloorConfig[] = [];
        floors.push({ floor: 0, roomCount: 3, name: 'Ground Floor' });
        for (let f = 1; f <= (buildingToEdit.totalFloors || 2); f++) {
          floors.push({ floor: f, roomCount: 3, name: getFloorLabel(f) });
        }
        setFloorConfigs(floors);
        setHasGroundFloor(true);
      }
    } else {
      setName('');
      setCode('');
      setAddress('');
      setCity('Bengaluru, Karnataka');
      setTotalFloors(2);
      setElectricityRatePerUnit(11.0);
      setBillingDueDay(5);
      setManagerName('');
      setManagerPhone('');
      setUpiId('');
      setRulesNotes('');
      setRoomTypes([
        { id: 'rt-single', name: 'Private Single', capacity: 1, baseRent: 15000 },
        { id: 'rt-double', name: 'Double Sharing', capacity: 2, baseRent: 10000 },
        { id: 'rt-triple', name: 'Triple Sharing', capacity: 3, baseRent: 8000 }
      ]);
      setFloorConfigs([
        { floor: 0, roomCount: 3, name: 'Ground Floor' },
        { floor: 1, roomCount: 4, name: '1st Floor' },
        { floor: 2, roomCount: 4, name: '2nd Floor' },
      ]);
      setHasGroundFloor(true);
    }
  }, [buildingToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleGroundFloor = () => {
    if (hasGroundFloor) {
      setFloorConfigs(prev => prev.filter(f => f.floor !== 0));
      setHasGroundFloor(false);
    } else {
      setFloorConfigs(prev => [{ floor: 0, roomCount: 3, name: 'Ground Floor' }, ...prev.filter(f => f.floor !== 0)]);
      setHasGroundFloor(true);
    }
  };

  const handleUpdateFloorRooms = (floorNum: number, roomCount: number) => {
    const validCount = Math.max(0, Math.min(50, roomCount));
    setFloorConfigs(prev => prev.map(fc => fc.floor === floorNum ? { ...fc, roomCount: validCount } : fc));
  };

  const handleAddUpperFloor = () => {
    const maxFloor = floorConfigs.length > 0 ? Math.max(...floorConfigs.map(f => f.floor)) : 0;
    const nextFloor = maxFloor + 1;
    setFloorConfigs(prev => [...prev, { floor: nextFloor, roomCount: 4, name: getFloorLabel(nextFloor) }]);
  };

  const handleRemoveFloor = (floorNum: number) => {
    if (floorConfigs.length <= 1) {
      alert('A building must have at least one floor configured.');
      return;
    }
    setFloorConfigs(prev => prev.filter(f => f.floor !== floorNum));
    if (floorNum === 0) setHasGroundFloor(false);
  };

  const handleAddRoomType = () => {
    const newRt: RoomTypeConfig = {
      id: `rt-${Date.now()}`,
      name: 'Executive Room',
      capacity: 2,
      baseRent: 12000
    };
    setRoomTypes([...roomTypes, newRt]);
  };

  const handleUpdateRoomType = (index: number, updates: Partial<RoomTypeConfig>) => {
    setRoomTypes(roomTypes.map((rt, i) => i === index ? { ...rt, ...updates } : rt));
  };

  const handleDeleteRoomType = (index: number) => {
    if (roomTypes.length <= 1) {
      alert('A building must have at least one room type configuration.');
      return;
    }
    setRoomTypes(roomTypes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter building name');
      return;
    }

    const finalTotalFloors = floorConfigs.length > 0 ? Math.max(...floorConfigs.map(f => f.floor)) : totalFloors;

    if (buildingToEdit) {
      updateBuilding(buildingToEdit.id, {
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase(),
        address: address.trim(),
        city: city.trim(),
        totalFloors: finalTotalFloors,
        floorConfigs,
        electricityRatePerUnit,
        billingDueDay,
        managerName: managerName.trim(),
        managerPhone: managerPhone.trim(),
        upiId: upiId.trim() || undefined,
        rulesNotes: rulesNotes.trim() || undefined,
        roomTypes
      });
    } else {
      addBuilding({
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase(),
        address: address.trim(),
        city: city.trim(),
        totalFloors: finalTotalFloors,
        floorConfigs,
        electricityRatePerUnit,
        billingDueDay,
        electricityBillingCycle: 'monthly',
        managerName: managerName.trim() || 'Property Manager',
        managerPhone: managerPhone.trim() || '+91 90000 00000',
        upiId: upiId.trim() || undefined,
        rulesNotes: rulesNotes.trim() || undefined,
        amenities: ['Wi-Fi', 'Daily Meals', 'Housekeeping', 'CCTV Security'],
        roomTypes
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {buildingToEdit ? `Configure ${buildingToEdit.name}` : 'Add New Building Property'}
              </h3>
              <p className="text-xs text-slate-500">Manage separate electricity rates, room types, and managers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* General Property Info */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Property Identification
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amber Heights PG"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code / Short ID</label>
                <input
                  type="text"
                  placeholder="e.g. AHP"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  placeholder="Street, locality, landmarks"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City & Pincode</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Building Specific Financial Rules */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Tariff & Billing Rules (Per Building Config)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Electricity Rate (₹/unit) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={electricityRatePerUnit}
                  onChange={e => setElectricityRatePerUnit(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-slate-900 border border-amber-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-amber-700 mt-0.5 block">Applied to monthly sub-meter</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Billing Due Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={billingDueDay}
                  onChange={e => setBillingDueDay(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">{billingDueDay}th of every month</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Active Floors
                </label>
                <div className="px-3 py-1.5 text-xs font-mono font-bold text-indigo-700 bg-indigo-50/60 border border-indigo-200 rounded-lg">
                  {floorConfigs.length} Floor Levels
                </div>
              </div>
            </div>
          </div>

          {/* 3. Floor-Wise Room Configuration */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  3. Floor Structure & Room Count (Floor-Wise)
                </span>
                <span className="text-[11px] text-slate-500">
                  Configure custom room counts for each floor level
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddUpperFloor}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Upper Floor
              </button>
            </div>

            {/* Ground Floor Toggle Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs">
                  G
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Ground Floor (Floor 0)</span>
                  <span className="text-[11px] text-slate-500">Enable if property includes rooms on the ground level</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGroundFloor}
                  onChange={handleToggleGroundFloor}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Floor Cards List */}
            <div className="space-y-2">
              {floorConfigs.map((fc) => (
                <div
                  key={fc.floor}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    fc.floor === 0
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        fc.floor === 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {fc.floor === 0 ? 'G' : fc.floor}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {fc.name || (fc.floor === 0 ? 'Ground Floor' : `Floor ${fc.floor}`)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Floor index: {fc.floor}
                      </span>
                    </div>
                  </div>

                  {/* Room Count Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Rooms:</span>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateFloorRooms(fc.floor, fc.roomCount - 1)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={fc.roomCount}
                        onChange={(e) => handleUpdateFloorRooms(fc.floor, Number(e.target.value))}
                        className="w-14 text-center py-1 text-xs font-mono font-bold text-slate-900 border-x border-slate-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateFloorRooms(fc.floor, fc.roomCount + 1)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {fc.floor > 0 && floorConfigs.filter(f => f.floor > 0).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFloor(fc.floor)}
                        title="Remove floor"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Strip */}
            <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Floor Configuration Summary:
              </span>
              <span className="font-bold font-mono">
                {floorConfigs.length} Levels • {floorConfigs.reduce((sum, fc) => sum + fc.roomCount, 0)} Total Rooms
              </span>
            </div>
          </div>

          {/* 4. Room Types & Base Tariffs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                4. Room Types & Base Tariffs
              </span>
              <button
                type="button"
                onClick={handleAddRoomType}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Room Type
              </button>
            </div>

            <div className="space-y-2">
              {roomTypes.map((rt, idx) => (
                <div key={rt.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Type Name</label>
                    <input
                      type="text"
                      value={rt.name}
                      onChange={e => handleUpdateRoomType(idx, { name: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Beds (Cap)</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={rt.capacity}
                      onChange={e => handleUpdateRoomType(idx, { capacity: Number(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono"
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block">Base Rent (₹)</label>
                    <input
                      type="number"
                      value={rt.baseRent}
                      onChange={e => handleUpdateRoomType(idx, { baseRent: Number(e.target.value) })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono font-bold text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRoomType(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded mt-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manager & Payment Gateway info */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              5. Property Management & UPI QR
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={managerPhone}
                  onChange={e => setManagerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. skylinepg@icici"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">House Rules & Notes</label>
              <input
                type="text"
                placeholder="Gate timings, guest policy, smoking regulations..."
                value={rulesNotes}
                onChange={e => setRulesNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Footer */}
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              {buildingToEdit ? 'Save Changes' : 'Create Property'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
