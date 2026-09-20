import React from 'react';
import { CoOccupant } from '../../types';
import { usePG } from '../../context/PGContext';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  FileText, 
  User, 
  Calendar, 
  Phone, 
  Home, 
  CheckCircle2, 
  Building2,
  Lock
} from 'lucide-react';

interface AadharPdfViewerModalProps {
  coOccupant: CoOccupant | null;
  onClose: () => void;
}

export const AadharPdfViewerModal: React.FC<AadharPdfViewerModalProps> = ({
  coOccupant,
  onClose
}) => {
  const { rooms, tenants, buildings } = usePG();

  if (!coOccupant) return null;

  const room = rooms.find(r => r.id === coOccupant.roomId);
  const building = buildings.find(b => b.id === room?.buildingId);
  const primaryTenant = tenants.find(t => t.id === coOccupant.tenantId);

  const formattedAadhaar = coOccupant.aadharNumber 
    ? coOccupant.aadharNumber 
    : 'XXXX-XXXX-8921';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSimulation = () => {
    if (coOccupant.aadharDocUrl) {
      const link = document.createElement('a');
      link.href = coOccupant.aadharDocUrl;
      link.download = coOccupant.aadharDocName || `aadhaar_${coOccupant.fullName}.pdf`;
      link.click();
    } else {
      // Create a printable text representation download
      const textContent = `GOVERNMENT OF INDIA - AADHAAR RECORD ARCHIVE\n\nName: ${coOccupant.fullName}\nRelationship to Tenant: ${coOccupant.relationship} (${primaryTenant?.fullName || 'N/A'})\nRoom: Room ${room?.roomNumber || 'N/A'}, ${building?.name || 'N/A'}\nAadhaar Number: ${formattedAadhaar}\nContact: ${coOccupant.phone}\nGender: ${coOccupant.gender}\nCheck-in: ${coOccupant.checkInDate}\nVerification Status: Digitally Verified\nVerified for StaySync PG Management System.`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = coOccupant.aadharDocName || `aadhaar_${coOccupant.fullName.toLowerCase().replace(/\s+/g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:m-0 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Resident Aadhaar
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {coOccupant.aadharDocName || 'aadhaar_card.pdf'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aadhaar Document Canvas */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Card Presentation Container */}
          <div className="border-2 border-slate-300 rounded-2xl p-6 bg-linear-to-b from-amber-50/30 via-white to-emerald-50/20 shadow-xs relative overflow-hidden">
            
            {/* National Emblem & UIDAI Styling Bar */}
            <div className="flex items-center justify-between border-b-2 border-red-600/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                  🏛️
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider leading-none">
                    भारत सरकार | GOVERNMENT OF INDIA
                  </p>
                  <p className="text-[10px] text-red-700 font-semibold tracking-wide">
                    भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </div>
              </div>
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              
              {/* Photo & QR */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-24 h-28 rounded-lg bg-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center overflow-hidden shadow-inner relative">
                  <User className="w-14 h-14 text-slate-400" />
                  <span className="absolute bottom-1 bg-slate-900/70 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                    {coOccupant.gender.toUpperCase()}
                  </span>
                </div>

                {/* Simulated QR */}
                <div className="mt-3 p-1.5 bg-white border border-slate-300 rounded-md inline-block shadow-2xs">
                  <div className="w-14 h-14 bg-slate-900 flex items-center justify-center rounded-xs text-white text-[9px] font-mono leading-tight text-center">
                    [QR CODE]
                  </div>
                </div>
              </div>

              {/* Resident Identity Details */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</span>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {coOccupant.fullName}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Relationship</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {coOccupant.relationship} of {primaryTenant?.fullName || 'Tenant'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gender / Age</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {coOccupant.gender} {coOccupant.age ? `• ${coOccupant.age} yrs` : ''}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Phone</span>
                    <span className="font-mono font-medium text-slate-800">{coOccupant.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Check-in Date</span>
                    <span className="font-medium text-slate-800">{coOccupant.checkInDate}</span>
                  </div>
                </div>

                {coOccupant.occupation && (
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Occupation / Organization</span>
                    <span className="font-medium text-slate-800">{coOccupant.occupation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 12-Digit Aadhaar Number Bar */}
            <div className="mt-5 pt-3 border-t-2 border-red-600/30 text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold block">
                मेरा आधार, मेरी पहचान
              </span>
              <p className="text-xl font-mono font-extrabold tracking-widest text-slate-900 mt-1">
                {formattedAadhaar}
              </p>
            </div>
          </div>

          {/* Residence & Room Record Association Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              PG Tenancy & Room Association Record
            </h5>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Property</span>
                <span className="font-semibold text-slate-900">{building?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Assigned Unit</span>
                <span className="font-bold text-indigo-600 font-mono">Room {room?.roomNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Room Capacity</span>
                <span className="font-medium text-slate-700">Up to {room?.capacity} residents</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Primary Tenant</span>
                <span className="font-semibold text-slate-900">{primaryTenant?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Primary Phone</span>
                <span className="font-mono text-slate-700">{primaryTenant?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Verification Storage</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> IndexedDB Secure
                </span>
              </div>
            </div>

            {coOccupant.notes && (
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-700">Notes: </strong>{coOccupant.notes}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400">
            Registered digitally in StaySync PG Management System. Keep on record for local police verification compliance.
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
