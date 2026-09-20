import React, { useState, useEffect, useRef } from 'react';
import { usePG } from '../../context/PGContext';
import { CoOccupant, RelationshipType } from '../../types';
import { 
  X, 
  UserPlus, 
  User, 
  Phone, 
  Home, 
  Building2, 
  Calendar, 
  FileText, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Users
} from 'lucide-react';

interface CoOccupantModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  tenantId?: string;
  coOccupantToEdit?: CoOccupant | null;
}

const RELATIONSHIPS: RelationshipType[] = [
  'Spouse',
  'Brother',
  'Sister',
  'Friend',
  'Colleague',
  'Roommate',
  'Parent',
  'Child',
  'Relative',
  'Other'
];

export const CoOccupantModal: React.FC<CoOccupantModalProps> = ({
  isOpen,
  onClose,
  roomId,
  tenantId,
  coOccupantToEdit
}) => {
  const { 
    rooms, 
    tenants, 
    buildings, 
    addCoOccupant, 
    updateCoOccupant 
  } = usePG();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetRoomId, setTargetRoomId] = useState<string>(roomId || '');
  const [targetTenantId, setTargetTenantId] = useState<string>(tenantId || '');
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('Friend');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<string>('');
  const [occupation, setOccupation] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharDocName, setAadharDocName] = useState('');
  const [aadharDocUrl, setAadharDocUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Available occupied rooms
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');

  useEffect(() => {
    if (coOccupantToEdit) {
      setTargetRoomId(coOccupantToEdit.roomId);
      setTargetTenantId(coOccupantToEdit.tenantId);
      setFullName(coOccupantToEdit.fullName);
      setRelationship((coOccupantToEdit.relationship as RelationshipType) || 'Friend');
      setPhone(coOccupantToEdit.phone);
      setGender(coOccupantToEdit.gender);
      setAge(coOccupantToEdit.age ? String(coOccupantToEdit.age) : '');
      setOccupation(coOccupantToEdit.occupation || '');
      setCheckInDate(coOccupantToEdit.checkInDate);
      setAadharNumber(coOccupantToEdit.aadharNumber || '');
      setAadharDocName(coOccupantToEdit.aadharDocName || '');
      setAadharDocUrl(coOccupantToEdit.aadharDocUrl || '');
      setNotes(coOccupantToEdit.notes || '');
    } else {
      setTargetRoomId(roomId || (occupiedRooms[0]?.id || ''));
      const activeTenant = tenants.find(t => t.roomId === (roomId || occupiedRooms[0]?.id) && t.status !== 'vacated');
      setTargetTenantId(tenantId || activeTenant?.id || '');
      setFullName('');
      setRelationship('Friend');
      setPhone('');
      setGender('male');
      setAge('');
      setOccupation('');
      setCheckInDate(new Date().toISOString().split('T')[0]);
      setAadharNumber('');
      setAadharDocName('');
      setAadharDocUrl('');
      setNotes('');
    }
  }, [coOccupantToEdit, isOpen, roomId, tenantId]);

  // When selected room changes, sync tenantId
  const handleRoomChange = (newRoomId: string) => {
    setTargetRoomId(newRoomId);
    const roomTenant = tenants.find(t => t.roomId === newRoomId && t.status !== 'vacated');
    if (roomTenant) {
      setTargetTenantId(roomTenant.id);
    }
  };

  const selectedRoom = rooms.find(r => r.id === targetRoomId);
  const selectedBuilding = buildings.find(b => b.id === selectedRoom?.buildingId);
  const primaryTenant = tenants.find(t => t.id === targetTenantId);

  // Handle PDF file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setAadharDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAadharDocUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const formatAadhaarInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1-');
    setAadharNumber(formatted);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetRoomId) {
      alert('Please select a room for this resident.');
      return;
    }
    if (!fullName.trim()) {
      alert('Please enter resident full name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter phone number.');
      return;
    }

    const payload = {
      roomId: targetRoomId,
      tenantId: targetTenantId || (primaryTenant?.id || ''),
      fullName: fullName.trim(),
      relationship,
      phone: phone.trim(),
      gender,
      age: age ? parseInt(age, 10) : undefined,
      occupation: occupation.trim() || undefined,
      checkInDate,
      aadharNumber: aadharNumber.trim() || undefined,
      aadharDocName: aadharDocName || (aadharNumber ? `aadhaar_${fullName.toLowerCase().replace(/\s+/g, '_')}.pdf` : undefined),
      aadharDocUrl: aadharDocUrl || undefined,
      notes: notes.trim() || undefined
    };

    if (coOccupantToEdit) {
      updateCoOccupant(coOccupantToEdit.id, payload);
    } else {
      addCoOccupant(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {coOccupantToEdit ? 'Edit Room Resident / Guest Details' : 'Add Person Living in Room (Guest / Family)'}
              </h2>
              <p className="text-xs text-slate-500">
                Register additional occupant living in the same room with the tenant
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Target Room & Primary Tenant Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Room *
              </label>
              <select
                value={targetRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              >
                <option value="" disabled>Select Occupied Room</option>
                {rooms.map(rm => {
                  const bld = buildings.find(b => b.id === rm.buildingId);
                  return (
                    <option key={rm.id} value={rm.id}>
                      Room {rm.roomNumber} ({bld?.name}) - {rm.status.toUpperCase()} (Cap: {rm.capacity})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Tenant in Room
              </label>
              <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-semibold truncate">
                  {primaryTenant ? primaryTenant.fullName : 'No Primary Tenant Assigned'}
                </span>
                {primaryTenant && (
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    ({primaryTenant.phone})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Resident Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Resident Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Pooja Mehta"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship with Primary Tenant *
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                >
                  {RELATIONSHIPS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender & Age
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age (e.g. 26)"
                    min={1}
                    max={120}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation / Workplace
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. UX Designer at Flipkart"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Check-in Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Aadhaar Verification & PDF Document Upload */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Identity Verification & Aadhaar Card (PDF)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aadhaar Card Number (12 Digits)
                </label>
                <input
                  type="text"
                  value={aadharNumber}
                  onChange={(e) => formatAadhaarInput(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={14}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aadhaar Card Document (PDF / Scan Copy)
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {aadharDocName ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{aadharDocName}</p>
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" /> Aadhaar PDF Attached
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAadharDocName('');
                          setAadharDocUrl('');
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-800">
                      Click to browse or drag & drop Aadhaar PDF
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG (Government Identity Proof)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Remarks / Relationship Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Authorized guest staying with primary tenant, submitted office ID card and Aadhaar"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
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
              <UserPlus className="w-4 h-4" />
              {coOccupantToEdit ? 'Save Changes' : 'Save Resident Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
