import React, { useState, useMemo } from 'react';
import { usePG } from '../../context/PGContext';
import { Tenant } from '../../types';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  Home, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Eye, 
  Download, 
  Plus,
  AlertCircle,
  FileText
} from 'lucide-react';

interface TenantListProps {
  onSelectTenant: (tenant: Tenant) => void;
  onOpenCollectRent: (tenantId: string) => void;
}

export const TenantList: React.FC<TenantListProps> = ({
  onSelectTenant,
  onOpenCollectRent
}) => {
  const { tenants, buildings, rooms, coOccupants, selectedBuildingId, setCoOccupantToViewAadhaar } = usePG();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'notice_period' | 'vacated'>('all');

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      // Building filter
      if (selectedBuildingId !== 'all' && t.buildingId !== selectedBuildingId) return false;

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = t.fullName.toLowerCase().includes(query);
        const matchesPhone = t.phone.toLowerCase().includes(query);
        const matchesWork = (t.workOrCollegeName || t.occupation).toLowerCase().includes(query);
        const room = rooms.find(r => r.id === t.roomId);
        const matchesRoom = room?.roomNumber.toLowerCase().includes(query);
        
        // Match co-occupants
        const matchesCo = coOccupants.some(
          co => co.tenantId === t.id && (co.fullName.toLowerCase().includes(query) || co.relationship.toLowerCase().includes(query))
        );

        if (!matchesName && !matchesPhone && !matchesWork && !matchesRoom && !matchesCo) return false;
      }

      return true;
    });
  }, [tenants, selectedBuildingId, statusFilter, searchTerm, rooms, coOccupants]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tenant Name', 'Phone', 'Email', 'Building', 'Room No', 'Co-Occupants', 'Monthly Rent (₹)', 'Deposit (₹)', 'Check-in Date', 'Status', 'Occupation', 'Workplace', 'Documents Count'];
    const rows = filteredTenants.map(t => {
      const bld = buildings.find(b => b.id === t.buildingId);
      const rm = rooms.find(r => r.id === t.roomId);
      const roomGuests = coOccupants.filter(co => co.tenantId === t.id);
      const guestsStr = roomGuests.map(g => `${g.fullName} (${g.relationship})`).join('; ');

      return [
        `"${t.fullName}"`,
        `"${t.phone}"`,
        `"${t.email}"`,
        `"${bld?.name || ''}"`,
        rm?.roomNumber || '',
        `"${guestsStr || 'None'}"`,
        t.monthlyRent,
        t.securityDeposit,
        t.checkInDate,
        t.status,
        `"${t.occupation}"`,
        `"${t.workOrCollegeName || ''}"`,
        t.documents.length
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tenants_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Tenant & Resident Directory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete profiles, emergency contacts, room guest members, identity proof & Aadhaar records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Directory (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, room no, workplace, guest..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(['all', 'active', 'notice_period', 'vacated'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Primary Tenant</th>
                <th className="py-3 px-4">Room & Unit</th>
                <th className="py-3 px-4">Room Members / Guests</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Monthly Rent</th>
                <th className="py-3 px-4 text-center">KYC Docs</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No tenants found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(tenant => {
                  const bld = buildings.find(b => b.id === tenant.buildingId);
                  const rm = rooms.find(r => r.id === tenant.roomId);
                  const tenantGuests = coOccupants.filter(co => co.tenantId === tenant.id);

                  return (
                    <tr 
                      key={tenant.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => onSelectTenant(tenant)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tenant.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={tenant.fullName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{tenant.fullName}</p>
                            <p className="text-[10px] text-slate-400">
                              Joined {tenant.checkInDate}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 flex items-center gap-1 font-mono">
                          <Home className="w-3.5 h-3.5 text-indigo-600" />
                          Room {rm?.roomNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {bld?.name}
                        </p>
                      </td>

                      {/* Co-Occupants / Room Guests Column */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        {tenantGuests.length > 0 ? (
                          <div className="space-y-1">
                            {tenantGuests.map(guest => (
                              <div key={guest.id} className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {guest.fullName}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-purple-100 text-purple-800">
                                  {guest.relationship}
                                </span>
                                <button
                                  onClick={() => setCoOccupantToViewAadhaar(guest)}
                                  className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 ml-1 bg-emerald-50 px-1.5 py-0.5 rounded-sm"
                                  title="View Aadhaar PDF"
                                >
                                  <FileText className="w-2.5 h-2.5" /> PDF
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Single occupant
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 space-y-0.5">
                        <p className="font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {tenant.phone}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {tenant.email}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{tenant.monthlyRent.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-slate-400 font-normal font-sans">
                          Dep: ₹{tenant.securityDeposit.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          {tenant.documents.length} verified
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          tenant.status === 'notice_period' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {tenant.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenCollectRent(tenant.id)}
                            title="Collect rent payment"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            Collect
                          </button>
                          <button
                            onClick={() => onSelectTenant(tenant)}
                            title="View full tenant profile & documents"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
