import React, { useRef } from 'react';
import { RentPayment } from '../../types';
import { usePG } from '../../context/PGContext';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  User, 
  Calendar, 
  CreditCard, 
  Zap, 
  Home,
  ShieldCheck
} from 'lucide-react';

interface ReceiptModalProps {
  payment: RentPayment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const { buildings } = usePG();
  const printRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const building = buildings.find(b => b.id === payment.buildingId);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:m-0">
        
        {/* Modal Action Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Receipt Ready
            </span>
            <span className="text-xs text-slate-500 font-mono">#{payment.receiptNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white print:p-6 print:space-y-4">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {building?.name || payment.buildingName}
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                {building?.address || 'Premium Paying Guest & Coliving Accommodation'}, {building?.city}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Manager: {building?.managerName} ({building?.managerPhone})
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-none border-slate-100 w-full sm:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Official Rent Receipt
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-1">
                {payment.receiptNumber}
              </p>
              <p className="text-xs text-slate-500">
                Date: <span className="font-medium text-slate-700">{formattedDate}</span>
              </p>
            </div>
          </div>

          {/* Tenant & Room Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tenant Details</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{payment.tenantName}</p>
                  <p className="text-xs text-slate-500">Tenant ID: {payment.tenantId}</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unit & Period</span>
              <div className="mt-1">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-indigo-600" />
                  Room {payment.roomNumber}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Billing Month: <span className="font-semibold text-slate-800">{payment.billingMonth}</span> ({payment.billingPeriodStart} to {payment.billingPeriodEnd})
                </p>
              </div>
            </div>
          </div>

          {/* Payment Itemized Table */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Payment Breakdown
            </span>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-center">Reference / Units</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Monthly Accommodation & Room Rent</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">{payment.billingMonth}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">₹{payment.rentAmount.toLocaleString('en-IN')}</td>
                  </tr>

                  {payment.electricityAmount > 0 && (
                    <tr>
                      <td className="py-2.5 px-4 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Electricity Bill Share
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500">
                        {payment.electricityUnits ? `${payment.electricityUnits} units` : 'Room Sub-meter'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium">₹{payment.electricityAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  )}

                  {payment.maintenanceCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">Maintenance & Utilities</td>
                      <td className="py-2.5 px-4 text-center text-slate-500">Fixed</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium">₹{payment.maintenanceCharges.toLocaleString('en-IN')}</td>
                    </tr>
                  )}

                  {payment.otherCharges > 0 && (
                    <tr>
                      <td className="py-2.5 px-4">Other Services / Food & Amenities</td>
                      <td className="py-2.5 px-4 text-center text-slate-500">Add-on</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium">₹{payment.otherCharges.toLocaleString('en-IN')}</td>
                    </tr>
                  )}

                  {payment.discount > 0 && (
                    <tr className="text-emerald-700">
                      <td className="py-2.5 px-4 font-medium">Concession / Promotional Discount</td>
                      <td className="py-2.5 px-4 text-center">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium">-₹{payment.discount.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                    <td colSpan={2} className="py-2.5 px-4 text-right">Total Payable Amount:</td>
                    <td className="py-2.5 px-4 text-right font-mono text-sm">₹{payment.totalPayable.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-900">
                    <td colSpan={2} className="py-2.5 px-4 text-right">Amount Received:</td>
                    <td className="py-2.5 px-4 text-right font-mono text-base text-emerald-700">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                  </tr>
                  {payment.balanceDue > 0 && (
                    <tr className="bg-amber-50/60 font-semibold text-amber-900">
                      <td colSpan={2} className="py-2 px-4 text-right">Pending Balance Due:</td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-amber-700">₹{payment.balanceDue.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Transaction Metadata & Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Mode: <strong className="uppercase text-slate-800">{payment.paymentMode.replace('_', ' ')}</strong></span>
              </div>
              {payment.transactionReference && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500">Ref / Txn ID:</span>
                  <span className="font-mono font-medium text-slate-800">{payment.transactionReference}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>Payment Status: </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {payment.status}
                </span>
              </div>
              {payment.notes && (
                <p className="text-[11px] text-slate-500 italic mt-1">
                  Note: {payment.notes}
                </p>
              )}
            </div>

            {/* Official Stamp & Signature Block */}
            <div className="flex flex-col items-start sm:items-end justify-between gap-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50/60 text-indigo-700 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Verified Digital Receipt
              </div>

              <div className="text-left sm:text-right pt-4">
                <div className="w-32 border-b border-slate-300 mb-1 ml-auto"></div>
                <p className="text-xs font-bold text-slate-800">
                  {payment.receivedBy || building?.managerName || 'Authorized Signatory'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Property Manager / Management Seal
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            This is a computer-generated receipt issued by StaySync PG Management System. Thank you for staying with us!
          </div>

        </div>

        {/* Modal Bottom Actions (hidden on print) */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            id="modal-print-btn"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print or Save as PDF
          </button>
        </div>

      </div>
    </div>
  );
};
