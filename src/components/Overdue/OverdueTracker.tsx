import React, { useState } from 'react';
import { usePG } from '../../context/PGContext';
import { OverdueSummary } from '../../types';
import { 
  AlertTriangle, 
  Send, 
  Copy, 
  Check, 
  Phone, 
  DollarSign, 
  Download, 
  Printer, 
  Clock, 
  Building2, 
  User, 
  Home,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface OverdueTrackerProps {
  onCollectPayment: (tenantId: string) => void;
}

export const OverdueTracker: React.FC<OverdueTrackerProps> = ({ onCollectPayment }) => {
  const { overdueList, selectedBuildingId, buildings, updateTenant } = usePG();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'moderate' | 'recent'>('all');

  const currentBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Filter based strictly on selected building if set
  const buildingOverdue = overdueList.filter(item => {
    if (selectedBuildingId && selectedBuildingId !== 'all' && item.building.id !== selectedBuildingId) return false;
    return true;
  });

  const filteredOverdue = buildingOverdue.filter(item => {
    if (activeFilter === 'critical') return item.daysOverdue >= 15;
    if (activeFilter === 'moderate') return item.daysOverdue >= 8 && item.daysOverdue < 15;
    if (activeFilter === 'recent') return item.daysOverdue < 8;
    return true;
  });

  // Aging summary strictly scoped to current building
  const recentCount = buildingOverdue.filter(i => i.daysOverdue < 8).length;
  const moderateCount = buildingOverdue.filter(i => i.daysOverdue >= 8 && i.daysOverdue < 15).length;
  const criticalCount = buildingOverdue.filter(i => i.daysOverdue >= 15).length;
  const totalOverdueSum = buildingOverdue.reduce((acc, i) => acc + i.totalOverdue, 0);

  // Generate automated reminder message
  const getReminderMessage = (item: OverdueSummary) => {
    const upiPart = item.building.upiId ? ` or scan/transfer to UPI ID: ${item.building.upiId}` : '';
    return `Dear ${item.tenant.fullName},\n\nThis is a gentle payment reminder from ${item.building.name}. Your PG accommodation fee of ₹${item.totalOverdue.toLocaleString('en-IN')} for ${item.billingMonth} (Room ${item.room.roomNumber}) was due on ${item.dueDate} and is currently overdue by ${item.daysOverdue} days.\n\nPlease clear the pending dues today via Cash, Bank Transfer${upiPart}.\n\nIf you have already paid, kindly reply with the transaction reference.\n\nWarm regards,\n${item.building.managerName} (${item.building.managerPhone})`;
  };

  const handleCopyMessage = (item: OverdueSummary) => {
    const message = getReminderMessage(item);
    navigator.clipboard.writeText(message);
    setCopiedId(item.tenant.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleWhatsAppSend = (item: OverdueSummary) => {
    const message = encodeURIComponent(getReminderMessage(item));
    // Clean phone number
    const cleanPhone = item.tenant.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  // Export CSV Report
  const handleExportReport = () => {
    const headers = [
      'Tenant Name',
      'Phone Number',
      'Emergency Contact',
      'Building',
      'Room',
      'Billing Month',
      'Due Date',
      'Days Overdue',
      'Overdue Rent (₹)',
      'Overdue Electricity (₹)',
      'Total Overdue (₹)',
      'Employer / College'
    ];

    const rows = filteredOverdue.map(i => [
      `"${i.tenant.fullName}"`,
      `"${i.tenant.phone}"`,
      `"${i.tenant.emergencyContactName} (${i.tenant.emergencyContactPhone})"`,
      `"${i.building.name}"`,
      i.room.roomNumber,
      i.billingMonth,
      i.dueDate,
      i.daysOverdue,
      i.overdueRent,
      i.overdueElectricity,
      i.totalOverdue,
      `"${i.tenant.workOrCollegeName || i.tenant.occupation}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `overdue_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Automated Overdue Tracking & Recovery</h2>
                {currentBuilding && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {currentBuilding.name} ({currentBuilding.code})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated monitoring of overdue rent & electricity dues for {currentBuilding ? currentBuilding.name : 'all properties'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aging Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'all' ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Overdue Sum</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">
            ₹{totalOverdueSum.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{buildingOverdue.length} tenants pending in this property</p>
        </div>

        <div 
          onClick={() => setActiveFilter('recent')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'recent' ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">1 - 7 Days Overdue</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Recent</span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {recentCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Gentle reminder stage</p>
        </div>

        <div 
          onClick={() => setActiveFilter('moderate')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'moderate' ? 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">8 - 14 Days Overdue</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">Follow-up</span>
          </div>
          <p className="text-2xl font-bold font-mono text-orange-600 mt-1">
            {moderateCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Direct phone outreach</p>
        </div>

        <div 
          onClick={() => setActiveFilter('critical')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'critical' ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">15+ Days Overdue</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Critical</span>
          </div>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {criticalCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Security deposit review</p>
        </div>
      </div>

      {/* Overdue Tenants List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pending Dues Ledger ({filteredOverdue.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Sorted by delinquency duration
          </span>
        </div>

        {filteredOverdue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">All Collections Are Up to Date!</p>
            <p className="text-xs text-slate-400">No overdue payments found for the selected filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOverdue.map(item => {
              const severityColor = 
                item.daysOverdue >= 15 ? 'text-rose-700 bg-rose-50 border-rose-200' :
                item.daysOverdue >= 8 ? 'text-orange-700 bg-orange-50 border-orange-200' :
                'text-amber-700 bg-amber-50 border-amber-200';

              return (
                <div key={item.tenant.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    
                    {/* Tenant Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <img
                          src={item.tenant.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={item.tenant.fullName}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white"></span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.tenant.fullName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColor}`}>
                            {item.daysOverdue} Days Overdue
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {item.building.name}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Home className="w-3.5 h-3.5 text-indigo-500" />
                            Room {item.room.roomNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {item.tenant.phone}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1">
                          Emergency Contact: {item.tenant.emergencyContactName} ({item.tenant.emergencyContactPhone})
                        </p>
                      </div>
                    </div>

                    {/* Amount & Due Breakdown */}
                    <div className="flex items-center gap-6 self-end lg:self-center">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          Overdue Balance
                        </span>
                        <p className="text-xl font-bold font-mono text-rose-600">
                          ₹{item.totalOverdue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Rent: ₹{item.overdueRent} {item.overdueElectricity > 0 && `+ Elec: ₹${item.overdueElectricity}`}
                        </p>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleWhatsAppSend(item)}
                          title="Send reminder on WhatsApp"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>

                        <button
                          onClick={() => handleCopyMessage(item)}
                          title="Copy polite reminder text"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                          {copiedId === item.tenant.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Text
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onCollectPayment(item.tenant.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Collect Now
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
