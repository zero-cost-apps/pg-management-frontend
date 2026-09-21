import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { Building, RoomTypeConfig, FloorConfig } from '../../types';
import { getFloorLabel } from '../../utils/floor';
import { X, Building2, Check, Plus, Trash2, Zap, DollarSign, Layers, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

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
  const { addBuilding, updateBuilding, rooms, generateRoomsForBuilding } = usePG();

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

  // Room Generation State
  const [generateRooms, setGenerateRooms] = useState<boolean>(true);
  const [defaultRoomTypeId, setDefaultRoomTypeId] = useState<string>('');
  const [autoAttachedBath, setAutoAttachedBath] = useState<boolean>(true);
  const [autoAc, setAutoAc] = useState<boolean>(false);
  const [isGeneratingRooms, setIsGeneratingRooms] = useState<boolean>(false);
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // Existing rooms for this building (when editing)
  const existingRooms = buildingToEdit ? rooms.filter(r => r.buildingId === buildingToEdit.id) : [];
  const existingRoomNumbers = new Set(existingRooms.map(r => r.roomNumber.toUpperCase().trim()));
  const totalConfiguredRooms = floorConfigs.reduce((sum, fc) => sum + fc.roomCount, 0);

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
      setGenerationFeedback(null);
      const bldRooms = rooms.filter(r => r.buildingId === buildingToEdit.id);
      setGenerateRooms(bldRooms.length === 0);
      setDefaultRoomTypeId(buildingToEdit.roomTypes?.[0]?.id || 'rt-single');
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
      setGenerateRooms(true);
      setGenerationFeedback(null);
      setDefaultRoomTypeId('rt-double');
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
  }, [buildingToEdit, isOpen, rooms]);

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

  const handleGenerateRoomsDirect = async () => {
    if (!buildingToEdit) return;
    setIsGeneratingRooms(true);
    setGenerationFeedback(null);
    try {
      const res = await generateRoomsForBuilding(buildingToEdit.id, {
        floorConfigs,
        defaultRoomTypeId: defaultRoomTypeId || roomTypes[0]?.id,
        hasAirConditioner: autoAc,
        hasAttachedBathroom: autoAttachedBath,
      });
      if (res.success) {
        setGenerationFeedback(`Successfully generated ${res.generatedCount} rooms according to floor configuration!`);
      } else {
        setGenerationFeedback('Failed to generate rooms. Please check backend connection.');
      }
    } catch (err) {
      setGenerationFeedback('Error generating rooms.');
    } finally {
      setIsGeneratingRooms(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter building name');
      return;
    }

    const finalTotalFloors = floorConfigs.length > 0 ? Math.max(...floorConfigs.map(f => f.floor)) : totalFloors;
    const selectedRtId = defaultRoomTypeId || roomTypes[0]?.id;

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
        roomTypes,
        generateRooms,
        defaultRoomTypeId: selectedRtId,
        hasAirConditioner: autoAc,
        hasAttachedBathroom: autoAttachedBath,
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
        roomTypes,
        generateRooms,
        defaultRoomTypeId: selectedRtId,
        hasAirConditioner: autoAc,
        hasAttachedBathroom: autoAttachedBath,
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
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${fc.floor === 0
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-white border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${fc.floor === 0
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
              <button
                type="button"
                onClick={handleAddUpperFloor}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Upper Floor
              </button>
            </div>

            {/* Summary Strip */}
            <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Floor Configuration Summary:
              </span>
              <span className="font-bold font-mono">
                {floorConfigs.length} Levels • {totalConfiguredRooms} Total Rooms
              </span>
            </div>

            {/* Room Generation from Floor Config Card */}
            <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Auto-Generate Rooms from Floor Configuration
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Automatically creates room units (Ground Floor: G01, G02... Upper Floors: 101, 201...)
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateRooms}
                    onChange={(e) => setGenerateRooms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Status & Immediate Sync for existing building */}
              {buildingToEdit && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Database Status:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {existingRooms.length} of {totalConfiguredRooms} rooms registered
                    </span>
                  </div>
                  {totalConfiguredRooms > existingRooms.length && (
                    <button
                      type="button"
                      disabled={isGeneratingRooms}
                      onClick={handleGenerateRoomsDirect}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
                    >
                      {isGeneratingRooms ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Generate {totalConfiguredRooms - existingRooms.length} Missing Rooms Now
                    </button>
                  )}
                </div>
              )}

              {generationFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{generationFeedback}</span>
                </div>
              )}

              {/* Live Preview of Rooms to be Generated */}
              {generateRooms && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Room Units Preview ({totalConfiguredRooms} rooms planned)
                    </span>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {floorConfigs.map((fc) => {
                        const floorLabel = fc.floor === 0 ? 'Ground Floor' : fc.name || `Floor ${fc.floor}`;
                        const roomNums: string[] = [];
                        for (let idx = 1; idx <= fc.roomCount; idx++) {
                          roomNums.push(
                            fc.floor === 0
                              ? `G${String(idx).padStart(2, '0')}`
                              : `${fc.floor}${String(idx).padStart(2, '0')}`
                          );
                        }
                        return (
                          <div key={fc.floor} className="flex flex-wrap items-center gap-1.5 text-xs py-1 border-b border-slate-100 last:border-b-0">
                            <span className="w-28 shrink-0 font-semibold text-slate-700 text-[11px]">
                              {floorLabel} ({fc.roomCount}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {roomNums.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">No rooms on this floor</span>
                              ) : (
                                roomNums.map((rn) => {
                                  const exists = existingRoomNumbers.has(rn.toUpperCase());
                                  return (
                                    <span
                                      key={rn}
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 ${
                                        exists
                                          ? 'bg-slate-100 text-slate-500 border border-slate-200 line-through'
                                          : fc.floor === 0
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      }`}
                                      title={exists ? `${rn} already exists in database` : `Will generate ${rn}`}
                                    >
                                      {rn}
                                      {exists && <span className="text-[9px] no-underline">✓</span>}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Type & Amenity Config for Generated Rooms */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Default Room Classification
                      </label>
                      <select
                        value={defaultRoomTypeId || (roomTypes[0]?.id || '')}
                        onChange={(e) => setDefaultRoomTypeId(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-800 focus:outline-none"
                      >
                        {roomTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name} (Cap {rt.capacity} • ₹{rt.baseRent.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Attached Bathroom
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={autoAttachedBath}
                          onChange={(e) => setAutoAttachedBath(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Included in all</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Air Conditioner
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={autoAc}
                          onChange={(e) => setAutoAc(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Equip AC units</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
