import React, { useState, useEffect } from 'react';
import { usePG } from '../../context/PGContext';
import { 
  Zap, 
  Plus, 
  Calendar, 
  Building2, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Home, 
  AlertCircle 
} from 'lucide-react';
import { MeterReadingModal } from './MeterReadingModal';

export const ElectricityManager: React.FC = () => {
  const { 
    electricityRecords, 
    rooms, 
    buildings, 
    selectedBuildingId, 
    deleteElectricityRecord 
  } = usePG();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [activeBuildingFilter, setActiveBuildingFilter] = useState<string>(selectedBuildingId);

  // Sync with global selected building from navbar
  useEffect(() => {
    setActiveBuildingFilter(selectedBuildingId);
  }, [selectedBuildingId]);

  // Filter records
  const filteredRecords = electricityRecords.filter(rec => {
    if (activeBuildingFilter !== 'all' && rec.buildingId !== activeBuildingFilter) return false;
    if (selectedMonth !== 'all' && rec.month !== selectedMonth) return false;
    return true;
  });

  // Aggregates
  const totalUnits = filteredRecords.reduce((acc, r) => acc + r.unitsConsumed, 0);
  const totalBilledAmount = filteredRecords.reduce((acc, r) => acc + r.totalAmount, 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Month', 'Date', 'Building', 'Room No', 'Prev Reading', 'Curr Reading', 'Units Consumed', 'Rate (₹)', 'Total Amount (₹)', 'Occupants', 'Per Tenant Share (₹)', 'Status'];
    const rows = filteredRecords.map(r => {
      const bld = buildings.find(b => b.id === r.buildingId);
      return [
        r.month,
        r.readingDate,
        `"${bld?.name || r.buildingId}"`,
        r.roomNumber,
        r.previousReading,
        r.currentReading,
        r.unitsConsumed,
        r.ratePerUnit,
        r.totalAmount,
        r.splitCount,
        r.amountPerTenant,
        r.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `electricity_meter_log_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Monthly Electricity & Sub-Meter Logs</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record meter readings, compute room consumption based on building tariff, and auto-split among tenants
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Log Meter Reading
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Units Logged</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {totalUnits.toLocaleString('en-IN')} <span className="text-xs font-sans text-slate-500 font-normal">kWh</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {filteredRecords.length} recorded meters</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Electricity Billed</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ₹{totalBilledAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Added to tenant monthly invoices</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Unit Cost</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            ₹{totalUnits > 0 ? (totalBilledAmount / totalUnits).toFixed(1) : '11.0'} <span className="text-xs font-sans text-slate-500 font-normal">/ unit</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Configured per building rates</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Filter By:</span>
          
          <select
            value={activeBuildingFilter}
            onChange={e => setActiveBuildingFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium"
          >
            <option value="all">All Buildings</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name} (₹{b.electricityRatePerUnit}/u)</option>
            ))}
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredRecords.length}</strong> meter entries for {selectedMonth}
        </div>
      </div>

      {/* Electricity Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Room & Building</th>
                <th className="py-3 px-4">Reading Date</th>
                <th className="py-3 px-4 text-center">Prev Reading</th>
                <th className="py-3 px-4 text-center">Curr Reading</th>
                <th className="py-3 px-4 text-center">Units Consumed</th>
                <th className="py-3 px-4 text-center">Rate / Unit</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Per Tenant Split</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No meter readings found for this building/month. Click "Log Meter Reading" to add.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const bld = buildings.find(b => b.id === rec.buildingId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-indigo-500" />
                          Room {rec.roomNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {bld?.name || rec.buildingId}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {rec.readingDate}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {rec.previousReading}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {rec.currentReading}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800">
                          {rec.unitsConsumed} units
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        ₹{rec.ratePerUnit}/unit
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{rec.totalAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-indigo-700 font-semibold">
                        ₹{rec.amountPerTenant.toLocaleString('en-IN')}
                        <span className="block text-[10px] text-slate-400 font-normal font-sans">
                          Split among {rec.splitCount} {rec.splitCount === 1 ? 'tenant' : 'tenants'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rec.status === 'collected' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {rec.status === 'collected' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {rec.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete electricity log for Room ${rec.roomNumber}?`)) {
                              deleteElectricityRecord(rec.id);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <MeterReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
};
