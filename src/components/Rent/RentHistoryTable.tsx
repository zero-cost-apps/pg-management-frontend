import React, { useState, useMemo } from 'react';
import { usePG } from '../../context/PGContext';
import { RentPayment, PaymentMode } from '../../types';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  CreditCard,
  Plus
} from 'lucide-react';

interface RentHistoryTableProps {
  onOpenCollectModal: (tenantId?: string) => void;
}

export const RentHistoryTable: React.FC<RentHistoryTableProps> = ({ onOpenCollectModal }) => {
  const { 
    payments, 
    buildings, 
    selectedBuildingId, 
    setReceiptToView, 
    deletePayment 
  } = usePG();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Building filter
      if (selectedBuildingId !== 'all' && p.buildingId !== selectedBuildingId) return false;

      // Month filter
      if (filterMonth !== 'all' && p.billingMonth !== filterMonth) return false;

      // Payment Mode filter
      if (filterMode !== 'all' && p.paymentMode !== filterMode) return false;

      // Status filter
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.tenantName.toLowerCase().includes(query);
        const matchesReceipt = p.receiptNumber.toLowerCase().includes(query);
        const matchesRoom = p.roomNumber.toLowerCase().includes(query);
        const matchesRef = (p.transactionReference || '').toLowerCase().includes(query);
        if (!matchesName && !matchesReceipt && !matchesRoom && !matchesRef) return false;
      }

      return true;
    });
  }, [payments, selectedBuildingId, filterMonth, filterMode, filterStatus, searchTerm]);

  // Aggregate stats
  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalOutstanding = filteredPayments.reduce((acc, p) => acc + p.balanceDue, 0);

  // Unique billing months in data
  const months = useMemo(() => {
    const set = new Set(payments.map(p => p.billingMonth));
    return Array.from(set).sort().reverse();
  }, [payments]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Tenant Name', 'Building', 'Room No', 'Month', 'Rent (₹)', 'Electricity (₹)', 'Total Payable (₹)', 'Amount Paid (₹)', 'Balance Due (₹)', 'Mode', 'Ref ID', 'Status'];
    const rows = filteredPayments.map(p => [
      p.receiptNumber,
      p.paymentDate,
      `"${p.tenantName}"`,
      `"${p.buildingName}"`,
      p.roomNumber,
      p.billingMonth,
      p.rentAmount,
      p.electricityAmount,
      p.totalPayable,
      p.amountPaid,
      p.balanceDue,
      p.paymentMode,
      `"${p.transactionReference || ''}"`,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rent_ledger_${selectedBuildingId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Rent Ledger & Receipts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View historical rent transactions, generate verified receipts, and monitor balances
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => onOpenCollectModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Collected In View</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {filteredPayments.length} recorded payments</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Balance Due</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Partial payments awaiting balance</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Collection Ratio</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {totalCollected + totalOutstanding > 0 
              ? `${Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100)}%` 
              : '100%'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Billed vs collected efficiency</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tenant name, receipt #, room..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Months</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Modes</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">All Status</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>

      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Tenant & Unit</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4 text-right">Rent + Elec</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No rent payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {payment.receiptNumber}
                      <span className="block text-[10px] text-slate-400 font-normal font-sans">
                        {payment.paymentDate}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{payment.tenantName}</p>
                      <p className="text-[11px] text-slate-500">
                        {payment.buildingName} • Room {payment.roomNumber}
                      </p>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {payment.billingMonth}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <span>₹{payment.rentAmount.toLocaleString('en-IN')}</span>
                      {payment.electricityAmount > 0 && (
                        <span className="block text-[10px] text-amber-600">
                          +₹{payment.electricityAmount} (Elec)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ₹{payment.amountPaid.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {payment.balanceDue > 0 ? (
                        <span className="font-semibold text-amber-600">
                          ₹{payment.balanceDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 uppercase tracking-tight">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {payment.paymentMode.replace('_', ' ')}
                      </span>
                      {payment.transactionReference && (
                        <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                          {payment.transactionReference}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status === 'paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {payment.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptToView(payment)}
                          title="View & Print Official Receipt"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Receipt
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete payment receipt ${payment.receiptNumber}?`)) {
                              deletePayment(payment.id);
                            }
                          }}
                          title="Delete Record"
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
