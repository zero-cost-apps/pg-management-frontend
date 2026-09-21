import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { getFloorLabel } from '../../utils/floor';
import { 
  X, 
  UserCheck, 
  Home, 
  Building2, 
  DollarSign, 
  Calendar, 
  Check, 
  UserPlus, 
  Shield, 
  Users,
  Plus,
  FileText
} from 'lucide-react';
import { RelationshipType } from '../../types';

interface RoomCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export const RoomCheckInModal: React.FC<RoomCheckInModalProps> = ({
  isOpen,
  onClose,
  roomId
}) => {
  const { buildings, rooms, addTenant } = usePG();

  const targetRoom = rooms.find(r => r.id === roomId);
  const targetBuilding = buildings.find(b => b.id === targetRoom?.buildingId);

  // Primary Tenant Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [occupation, setOccupation] = useState('');
  const [workOrCollegeName, setWorkOrCollegeName] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Parent');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [monthlyRent, setMonthlyRent] = useState(targetRoom?.baseRent || 15000);
  const [securityDeposit, setSecurityDeposit] = useState(30000);
  const [depositStatus, setDepositStatus] = useState<'paid' | 'partial' | 'pending'>('paid');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [idProofNumber, setIdProofNumber] = useState('');

  // Optional: Add Co-Occupant / Guest living with tenant directly during check-in
  const [hasCoOccupant, setHasCoOccupant] = useState(false);
  const [coFullName, setCoFullName] = useState('');
  const [coRelationship, setCoRelationship] = useState<RelationshipType>('Spouse');
  const [coPhone, setCoPhone] = useState('');
  const [coGender, setCoGender] = useState<'male' | 'female' | 'other'>('female');
  const [coAadhar, setCoAadhar] = useState('');
  const [coAadharDocName, setCoAadharDocName] = useState('');

  useEffect(() => {
    if (targetRoom) {
      setMonthlyRent(targetRoom.baseRent);
      setSecurityDeposit(targetRoom.baseRent * 2);
    }
  }, [targetRoom, isOpen]);

  if (!isOpen || !targetRoom || !targetBuilding) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      alert('Please fill tenant full name and phone number.');
      return;
    }

    const coOccupantsPayload = hasCoOccupant && coFullName.trim() ? [
      {
        fullName: coFullName.trim(),
        relationship: coRelationship,
        phone: coPhone.trim() || phone,
        gender: coGender,
        checkInDate,
        aadharNumber: coAadhar.trim() || undefined,
        aadharDocName: coAadharDocName || (coAadhar ? `aadhaar_${coFullName.toLowerCase().replace(/\s+/g, '_')}.pdf` : undefined),
        notes: `Checked in alongside primary tenant ${fullName}`
      }
    ] : undefined;

    addTenant({
      buildingId: targetBuilding.id,
      roomId: targetRoom.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gender,
      occupation: occupation.trim() || 'Software Professional',
      workOrCollegeName: workOrCollegeName.trim(),
      permanentAddress: permanentAddress.trim() || 'Bangalore, India',
      emergencyContactName: emergencyContactName.trim() || 'Family',
      emergencyContactRelation,
      emergencyContactPhone: emergencyContactPhone.trim() || phone,
      checkInDate,
      status: 'active',
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      depositStatus,
      depositPaidAmount: depositStatus === 'paid' ? Number(securityDeposit) : 0,
      documents: idProofNumber ? [
        {
          id: `doc-${Date.now()}`,
          type: 'aadhaar',
          title: 'Aadhaar Identity Proof',
          documentNumber: idProofNumber,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'verified'
        }
      ] : []
    }, coOccupantsPayload);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Check-in Tenant to Room {targetRoom.roomNumber}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {targetBuilding.name} • {getFloorLabel(targetRoom.floor)} • Allowed Capacity: {targetRoom.capacity} People
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Primary Tenant Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              Primary Tenant Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation / Role
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workplace / College Name
                </label>
                <input
                  type="text"
                  value={workOrCollegeName}
                  onChange={e => setWorkOrCollegeName(e.target.value)}
                  placeholder="e.g. Swiggy / Infosys / Christ Univ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Rental Terms */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Room Rent & Security Deposit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Room Rent (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={e => setSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deposit Status
                </label>
                <select
                  value={depositStatus}
                  onChange={e => setDepositStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Aadhaar ID Number
                </label>
                <input
                  type="text"
                  value={idProofNumber}
                  onChange={e => setIdProofNumber(e.target.value)}
                  placeholder="e.g. 5412-8871-3320"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Additional Person Living in Room (Co-Occupant / Guest) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  Additional Resident in Same Room (Guest / Spouse / Relative)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Multiple people allowed per room (Capacity: {targetRoom.capacity})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHasCoOccupant(!hasCoOccupant)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  hasCoOccupant 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {hasCoOccupant ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {hasCoOccupant ? 'Include Room Member' : '+ Add Room Member'}
              </button>
            </div>

            {hasCoOccupant && (
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Member Full Name *
                    </label>
                    <input
                      type="text"
                      value={coFullName}
                      onChange={e => setCoFullName(e.target.value)}
                      placeholder="e.g. Pooja Mehta"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Relationship with Tenant *
                    </label>
                    <select
                      value={coRelationship}
                      onChange={e => setCoRelationship(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Roommate">Roommate</option>
                      <option value="Parent">Parent</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={coPhone}
                      onChange={e => setCoPhone(e.target.value)}
                      placeholder="+91 98200 88991"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={coGender}
                      onChange={e => setCoGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Member Aadhaar Number (12 Digits)
                    </label>
                    <input
                      type="text"
                      value={coAadhar}
                      onChange={e => setCoAadhar(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              Complete Check-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
