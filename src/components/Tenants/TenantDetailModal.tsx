import React, { useState } from 'react';
import { usePG } from '../../context/PGContext';
import { Tenant, TenantDocument, DocType } from '../../types';
import { CoOccupantModal } from '../Rooms/CoOccupantModal';
import { AadharPdfViewerModal } from '../Rooms/AadharPdfViewerModal';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Upload, 
  Receipt, 
  CreditCard, 
  Clock, 
  LogOut, 
  Check, 
  Eye,
  Building2,
  Home,
  CheckCircle2,
  Download,
  Users,
  Plus
} from 'lucide-react';

interface TenantDetailModalProps {
  tenant: Tenant | null;
  onClose: () => void;
  onOpenCollectRent: (tenantId: string) => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  tenant,
  onClose,
  onOpenCollectRent
}) => {
  const { 
    buildings, 
    rooms, 
    coOccupants,
    payments, 
    setReceiptToView, 
    vacateTenant, 
    addTenantDocument, 
    updateDocumentStatus,
    updateTenant,
    setCoOccupantToViewAadhaar,
    coOccupantToViewAadhaar
  } = usePG();

  const [activeTab, setActiveTab] = useState<'profile' | 'guests' | 'documents' | 'payments'>('profile');
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);

  // New Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newDocType, setNewDocType] = useState<DocType>('aadhaar');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocFile, setNewDocFile] = useState<string>('');

  if (!tenant) return null;

  const building = buildings.find(b => b.id === tenant.buildingId);
  const room = rooms.find(r => r.id === tenant.roomId);
  const roomGuests = coOccupants.filter(co => co.roomId === tenant.roomId);

  // Payments by this tenant
  const tenantPayments = payments.filter(p => p.tenantId === tenant.id);
  const totalPaid = tenantPayments.reduce((acc, p) => acc + p.amountPaid, 0);

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      alert('Please provide a document title');
      return;
    }

    addTenantDocument(tenant.id, {
      type: newDocType,
      title: newDocTitle.trim(),
      documentNumber: newDocNumber.trim() || undefined,
      fileName: `${newDocType}_${Date.now()}.pdf`,
      status: 'verified'
    });

    setIsUploadingDoc(false);
    setNewDocTitle('');
    setNewDocNumber('');
    setNewDocFile('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocFile(reader.result as string);
        if (!newDocTitle) {
          setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVacate = () => {
    if (window.confirm(`Are you sure you want to checkout & vacate ${tenant.fullName}? This will release Room ${room?.roomNumber} and settle their deposit.`)) {
      vacateTenant(tenant.id, true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header & Hero */}
        <div className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={tenant.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={tenant.fullName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold">{tenant.fullName}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tenant.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  tenant.status === 'notice_period' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {tenant.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{building?.name}</span>
                <span>•</span>
                <Home className="w-3.5 h-3.5 text-indigo-400" />
                <span>Room {room?.roomNumber}</span>
                {roomGuests.length > 0 && (
                  <span className="text-purple-300 font-semibold">
                    (+{roomGuests.length} {roomGuests.length === 1 ? 'Guest' : 'Guests'})
                  </span>
                )}
              </p>

              <p className="text-xs text-slate-400">
                Check-in: <strong className="text-slate-200 font-medium">{tenant.checkInDate}</strong> • Rent: <strong className="text-emerald-400 font-mono">₹{tenant.monthlyRent.toLocaleString('en-IN')}/mo</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onOpenCollectRent(tenant.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Collect Rent
            </button>
            <a
              href={`tel:${tenant.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call ({tenant.phone})
            </a>
            {tenant.status === 'active' && (
              <button
                onClick={() => {
                  const days = prompt('Notice period departure date (YYYY-MM-DD):', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
                  if (days) {
                    updateTenant(tenant.id, {
                      status: 'notice_period',
                      expectedCheckOutDate: days,
                      noticeGivenDate: new Date().toISOString().split('T')[0]
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                Serve Notice
              </button>
            )}
            {tenant.status !== 'vacated' && (
              <button
                onClick={handleVacate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-colors ml-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                Vacate Room
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'profile' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Personal & Work Info
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guests' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Room Guests & Members ({roomGuests.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'documents' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            KYC Documents ({tenant.documents.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Rent Receipts & Ledger ({tenantPayments.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5 text-xs text-slate-700">
              
              {/* Personal Details */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Personal Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                    <span className="font-semibold text-slate-900">{tenant.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                    <span className="font-medium text-slate-900">{tenant.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gender</span>
                    <span className="font-medium text-slate-900 capitalize">{tenant.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Permanent Address</span>
                    <span className="font-medium text-slate-900">{tenant.permanentAddress}</span>
                  </div>
                </div>
              </div>

              {/* Work / College Details */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Employment / Student Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Occupation</span>
                    <span className="font-semibold text-slate-900">{tenant.occupation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Workplace / College</span>
                    <span className="font-medium text-slate-900">{tenant.workOrCollegeName || 'Self-employed / Remote'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Emergency Contact (Next of Kin)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Name</span>
                    <span className="font-bold text-slate-900">{tenant.emergencyContactName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Relationship</span>
                    <span className="font-semibold text-slate-900">{tenant.emergencyContactRelation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                    <span className="font-mono font-bold text-indigo-700">{tenant.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Security Deposit Ledger */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Security Deposit Information
                </span>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-slate-500">Security Deposit Total</p>
                    <p className="text-base font-bold font-mono text-slate-900">₹{tenant.securityDeposit.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Deposit Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      tenant.depositStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      tenant.depositStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {tenant.depositStatus}
                    </span>
                  </div>
                </div>
              </div>

              {tenant.notes && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Manager Remarks
                  </span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                    {tenant.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Room Guests & Members Tab */}
          {activeTab === 'guests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    People Living in this Room
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Room {room?.roomNumber} (Allowed: Up to {room?.capacity} occupants)
                  </p>
                </div>

                <button
                  onClick={() => setIsAddGuestModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Room Member
                </button>
              </div>

              {roomGuests.length > 0 ? (
                <div className="space-y-3">
                  {roomGuests.map(guest => (
                    <div
                      key={guest.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900">{guest.fullName}</h5>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            {guest.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {guest.phone} • {guest.gender} {guest.age ? `• ${guest.age} yrs` : ''}
                        </p>
                        {guest.occupation && (
                          <p className="text-[11px] text-slate-600">
                            {guest.occupation}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Joined: {guest.checkInDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setCoOccupantToViewAadhaar(guest)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          View Aadhaar Card (PDF)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No additional members currently registered</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    If this tenant shares the room with a spouse, sibling, or friend, register their details and Aadhaar PDF here.
                  </p>
                  <button
                    onClick={() => setIsAddGuestModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Room Member
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    KYC & Identity Verification Files
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Government IDs, police verification forms and college/work credentials
                  </p>
                </div>

                <button
                  onClick={() => setIsUploadingDoc(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Add Document
                </button>
              </div>

              {/* Upload Form (if toggled) */}
              {isUploadingDoc && (
                <form onSubmit={handleDocumentSubmit} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">Upload New Tenant Document</span>
                    <button type="button" onClick={() => setIsUploadingDoc(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document Type *</label>
                      <select
                        value={newDocType}
                        onChange={e => setNewDocType(e.target.value as DocType)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="passport">Passport</option>
                        <option value="police_verification">Police Verification Form</option>
                        <option value="employment_letter">Employment ID / Letter</option>
                        <option value="student_id">College / Student ID</option>
                        <option value="pan">PAN Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Aadhaar Card Front & Back"
                        value={newDocTitle}
                        onChange={e => setNewDocTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document / ID Number</label>
                      <input
                        type="text"
                        placeholder="e.g. XXXX-XXXX-9901"
                        value={newDocNumber}
                        onChange={e => setNewDocNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Upload File (PDF / Image)</label>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadingDoc(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Save Document
                    </button>
                  </div>
                </form>
              )}

              {/* Document List */}
              <div className="space-y-2">
                {tenant.documents.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                          {doc.documentNumber && <span>• ID: <strong className="font-mono">{doc.documentNumber}</strong></span>}
                          <span>• Uploaded: {doc.uploadDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        doc.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Payment Ledger & Rent Receipts
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Total Collected: <strong className="text-emerald-600 font-mono">₹{totalPaid.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    onOpenCollectRent(tenant.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  + Collect Payment
                </button>
              </div>

              <div className="space-y-2">
                {tenantPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded yet.</p>
                ) : (
                  tenantPayments.map(payment => (
                    <div key={payment.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{payment.billingMonth} Accommodation & Rent</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{payment.paymentDate}</span>
                          <span>•</span>
                          <span className="uppercase">{payment.paymentMode.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="font-mono">{payment.receiptNumber}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ₹{payment.amountPaid.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => {
                            setReceiptToView(payment);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 shadow-2xs"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>

      {/* Embedded Co-Occupant Modal */}
      <CoOccupantModal
        isOpen={isAddGuestModalOpen}
        onClose={() => setIsAddGuestModalOpen(false)}
        roomId={tenant.roomId}
        tenantId={tenant.id}
      />

      {/* Embedded Aadhaar PDF Viewer */}
      <AadharPdfViewerModal
        coOccupant={coOccupantToViewAadhaar}
        onClose={() => setCoOccupantToViewAadhaar(null)}
      />
    </div>
  );
};
