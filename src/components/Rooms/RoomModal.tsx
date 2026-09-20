import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { Room } from '../../types';
import { X, Home, Check, Plus, Trash2, Building2, Users } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room | null;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  roomToEdit
}) => {
  const { buildings, selectedBuildingId, addRoom, updateRoom } = usePG();

  const [buildingId, setBuildingId] = useState<string>(selectedBuildingId !== 'all' ? selectedBuildingId : buildings[0]?.id || '');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [floor, setFloor] = useState<number>(1);
  const [roomTypeId, setRoomTypeId] = useState<string>('rt-double');
  const [capacity, setCapacity] = useState<number>(2);
  const [baseRent, setBaseRent] = useState<number>(20000);
  const [hasAirConditioner, setHasAirConditioner] = useState<boolean>(true);
  const [hasAttachedBathroom, setHasAttachedBathroom] = useState<boolean>(true);
  const [hasBalcony, setHasBalcony] = useState<boolean>(false);
  const [meterNumber, setMeterNumber] = useState<string>('');

  const selectedBld = buildings.find(b => b.id === buildingId);

  useEffect(() => {
    if (roomToEdit) {
      setBuildingId(roomToEdit.buildingId);
      setRoomNumber(roomToEdit.roomNumber);
      setFloor(roomToEdit.floor);
      setRoomTypeId(roomToEdit.roomTypeId);
      setCapacity(roomToEdit.capacity);
      setBaseRent(roomToEdit.baseRent);
      setHasAirConditioner(roomToEdit.hasAirConditioner);
      setHasAttachedBathroom(roomToEdit.hasAttachedBathroom);
      setHasBalcony(roomToEdit.hasBalcony);
      setMeterNumber(roomToEdit.meterNumber || '');
    } else {
      setRoomNumber('');
      setFloor(1);
      setMeterNumber('');
      setCapacity(2);
      if (selectedBld?.roomTypes?.[0]) {
        setRoomTypeId(selectedBld.roomTypes[0].id);
        setBaseRent(selectedBld.roomTypes[0].baseRent);
        setCapacity(selectedBld.roomTypes[0].capacity);
      }
    }
  }, [roomToEdit, isOpen, buildingId]);

  if (!isOpen) return null;

  const handleRoomTypeChange = (typeId: string) => {
    setRoomTypeId(typeId);
    const rt = selectedBld?.roomTypes?.find(t => t.id === typeId);
    if (rt) {
      setBaseRent(rt.baseRent);
      setCapacity(rt.capacity);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      alert('Please enter room number.');
      return;
    }

    if (roomToEdit) {
      updateRoom(roomToEdit.id, {
        buildingId,
        roomNumber: roomNumber.trim(),
        floor: Number(floor),
        roomTypeId,
        capacity: Number(capacity),
        baseRent: Number(baseRent),
        hasAirConditioner,
        hasAttachedBathroom,
        hasBalcony,
        meterNumber: meterNumber.trim() || undefined
      });
    } else {
      addRoom({
        buildingId,
        roomNumber: roomNumber.trim(),
        floor: Number(floor),
        roomTypeId,
        capacity: Number(capacity),
        baseRent: Number(baseRent),
        status: 'vacant',
        hasAirConditioner,
        hasAttachedBathroom,
        hasBalcony,
        meterNumber: meterNumber.trim() || `MTR-${roomNumber.trim()}`,
        lastMeterReading: 1000,
        lastMeterReadingDate: new Date().toISOString().split('T')[0]
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {roomToEdit ? `Edit Room ${roomToEdit.roomNumber}` : 'Create New Room'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure room capacity, monthly rent, and amenities
              </p>
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
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Building Property *
            </label>
            <select
              value={buildingId}
              onChange={e => setBuildingId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              {buildings.map(bld => (
                <option key={bld.id} value={bld.id}>{bld.name} ({bld.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room Number / Identifier *
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                placeholder="e.g. 104 or A-201"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor Level *
              </label>
              <input
                type="number"
                required
                min={0}
                max={20}
                value={floor}
                onChange={e => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Room Type & Allowed Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room Classification
              </label>
              <select
                value={roomTypeId}
                onChange={e => handleRoomTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {selectedBld?.roomTypes?.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Allowed People *</span>
                <span className="text-[11px] text-slate-400 font-normal">Max Capacity</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Room Rent (₹) *
              </label>
              <input
                type="number"
                required
                min={1000}
                value={baseRent}
                onChange={e => setBaseRent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sub-meter Serial No.
              </label>
              <input
                type="text"
                value={meterNumber}
                onChange={e => setMeterNumber(e.target.value)}
                placeholder="e.g. MTR-104"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Room Features */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Unit Amenities
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                hasAttachedBathroom ? 'bg-indigo-50/60 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={hasAttachedBathroom}
                  onChange={e => setHasAttachedBathroom(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Attached Bath
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                hasAirConditioner ? 'bg-indigo-50/60 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={hasAirConditioner}
                  onChange={e => setHasAirConditioner(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                AC Fitted
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                hasBalcony ? 'bg-indigo-50/60 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={hasBalcony}
                  onChange={e => setHasBalcony(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Balcony
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {roomToEdit ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
