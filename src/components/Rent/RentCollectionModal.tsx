import React, { useState, useEffect, useMemo } from 'react';
import { usePG } from '../../context/PGContext';
import { Tenant, PaymentMode } from '../../types';
import confetti from 'canvas-confetti';
import { 
  X, 
  CreditCard, 
  Building2, 
  User, 
  Home, 
  Zap, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface RentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTenantId?: string;
  onPaymentRecorded?: (paymentId: string) => void;
}

export const RentCollectionModal: React.FC<RentCollectionModalProps> = ({
  isOpen,
  onClose,
  preselectedTenantId,
  onPaymentRecorded
}) => {
  const { 
    buildings, 
    rooms, 
    tenants, 
    electricityRecords, 
    recordRentPayment, 
    setReceiptToView,
    selectedBuildingId
  } = usePG();

  // Active tenants strictly for the selected building (or all if 'all')
  const activeTenants: Tenant[] = useMemo(() => {
    return tenants.filter((t: Tenant) => {
      if (t.status === 'vacated') return false;
      if (selectedBuildingId && selectedBuildingId !== 'all' && t.buildingId !== selectedBuildingId) return false;
      return true;
    });
  }, [tenants, selectedBuildingId]);

  const activeBuildingScope = buildings.find(b => b.id === selectedBuildingId);

  const [selectedTenantId, setSelectedTenantId] = useState<string>(preselectedTenantId || '');
  const [billingMonth, setBillingMonth] = useState<string>('2026-09');
  
  // Breakdown amounts
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [includeElectricity, setIncludeElectricity] = useState<boolean>(true);
  const [electricityAmount, setElectricityAmount] = useState<number>(0);
  const [electricityUnits, setElectricityUnits] = useState<number>(0);
  const [maintenanceCharges, setMaintenanceCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Payment details
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [justRecordedPayment, setJustRecordedPayment] = useState<any>(null);

  // Sync when preselectedTenantId or selectedBuildingId changes
  useEffect(() => {
    if (preselectedTenantId && activeTenants.some(t => t.id === preselectedTenantId)) {
      setSelectedTenantId(preselectedTenantId);
    } else if (activeTenants.length > 0) {
      // If current selection is not part of this building's tenants, reset to first
      if (!selectedTenantId || !activeTenants.some(t => t.id === selectedTenantId)) {
        setSelectedTenantId(activeTenants[0].id);
      }
    } else {
      setSelectedTenantId('');
    }
  }, [preselectedTenantId, isOpen, selectedBuildingId, activeTenants]);

  // Current tenant data
  const currentTenant = activeTenants.find(t => t.id === selectedTenantId);
  const currentBuilding = buildings.find(b => b.id === currentTenant?.buildingId);
  const currentRoom = rooms.find(r => r.id === currentTenant?.roomId);

  // Auto-populate rent and check electricity records for selected tenant & billing month
  useEffect(() => {
    if (!currentTenant || !currentRoom) return;

    setRentAmount(currentTenant.monthlyRent);

    // Look for electricity record for this room and month
    const elecRecord = electricityRecords.find(
      e => e.roomId === currentRoom.id && e.month === billingMonth && e.billedTenantIds.includes(currentTenant.id)
    );

    if (elecRecord) {
      setElectricityAmount(Math.round(elecRecord.amountPerTenant));
      const unitsPerTenant = Math.round(elecRecord.unitsConsumed / Math.max(1, elecRecord.splitCount));
      setElectricityUnits(unitsPerTenant);
      setIncludeElectricity(true);
    } else {
      // Default to 0 or manual
      setElectricityAmount(0);
      setElectricityUnits(0);
    }

    if (currentBuilding) {
      setReceivedBy(currentBuilding.managerName);
    }
  }, [selectedTenantId, billingMonth, currentTenant, currentRoom, currentBuilding, electricityRecords]);

  // Total payable computation
  const activeElec = includeElectricity ? electricityAmount : 0;
  const totalPayable = Math.max(0, rentAmount + activeElec + maintenanceCharges + otherCharges - discount);

  // Auto-set amountPaid to totalPayable initially if user hasn't typed a custom amount
  useEffect(() => {
    setAmountPaid(totalPayable);
  }, [totalPayable]);

  const balanceDue = Math.max(0, totalPayable - amountPaid);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !currentBuilding || !currentRoom) {
      alert('Please select a valid tenant.');
      return;
    }

    if (amountPaid <= 0) {
      if (!window.confirm('Amount paid is 0 or negative. Record this payment anyway?')) return;
    }

    const paymentStatus = balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

    const recorded = recordRentPayment({
      tenantId: currentTenant.id,
      tenantName: currentTenant.fullName,
      buildingId: currentBuilding.id,
      buildingName: currentBuilding.name,
      roomId: currentRoom.id,
      roomNumber: currentRoom.roomNumber,
      billingMonth,
      billingPeriodStart: `${billingMonth}-01`,
      billingPeriodEnd: `${billingMonth}-30`,
      rentAmount,
      electricityAmount: activeElec,
      electricityUnits: includeElectricity ? electricityUnits : 0,
      maintenanceCharges,
      otherCharges,
      discount,
      totalPayable,
      amountPaid,
      balanceDue,
      paymentDate,
      paymentMode,
      transactionReference: transactionReference.trim() || undefined,
      status: paymentStatus,
      receivedBy: receivedBy.trim() || currentBuilding.managerName,
      notes: notes.trim() || undefined
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      // ignore
    }

    setJustRecordedPayment(recorded);
    if (onPaymentRecorded) {
      onPaymentRecorded(recorded.id);
    }
  };

  const handleResetAndClose = () => {
    setJustRecordedPayment(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manual Rent Collection</h3>
              <p className="text-xs text-slate-500">Record incoming rent, electricity & generate instant receipt</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {justRecordedPayment ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Payment Successfully Recorded!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Receipt <strong className="font-mono text-slate-800">{justRecordedPayment.receiptNumber}</strong> generated for {justRecordedPayment.tenantName}.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-left space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Amount Received:</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">₹{justRecordedPayment.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="uppercase font-medium text-slate-800">{justRecordedPayment.paymentMode}</span>
                </div>
                {justRecordedPayment.balanceDue > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Remaining Due:</span>
                    <span className="font-mono">₹{justRecordedPayment.balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptToView(justRecordedPayment);
                  handleResetAndClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                View & Print Official Receipt
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Entry Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Active Building Context Banner */}
            {activeBuildingScope && (
              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {activeBuildingScope.code}
                  </div>
                  <div>
                    <span className="font-bold text-indigo-950">{activeBuildingScope.name}</span>
                    <p className="text-[11px] text-indigo-600">Showing tenants for this building only</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold border border-indigo-200">
                  ⚡ ₹{activeBuildingScope.electricityRatePerUnit}/u
                </span>
              </div>
            )}

            {/* Tenant Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Tenant * ({activeTenants.length} available in this property)
              </label>
              {activeTenants.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  No active tenants currently registered in {activeBuildingScope?.name || 'this property'}. Please assign a tenant to a room first.
                </div>
              ) : (
                <select
                  id="tenant-select"
                  value={selectedTenantId}
                  onChange={e => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  required
                >
                  <option value="" disabled>-- Select Tenant --</option>
                  {activeTenants.map(t => {
                    const b = buildings.find(bld => bld.id === t.buildingId);
                    const r = rooms.find(rm => rm.id === t.roomId);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.fullName} — Room {r?.roomNumber || '?'} ({b?.name})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Tenant Quick Info Card */}
            {currentTenant && currentBuilding && currentRoom && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Building</span>
                  <p className="font-semibold text-slate-800 truncate">{currentBuilding.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Unit</span>
                  <p className="font-semibold text-slate-800 font-mono">Room {currentRoom.roomNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Monthly Rent</span>
                  <p className="font-bold font-mono text-indigo-600">₹{currentTenant.monthlyRent.toLocaleString('en-IN')}/mo</p>
                </div>
              </div>
            )}

            {/* Billing Period & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Month *
                </label>
                <input
                  type="month"
                  value={billingMonth}
                  onChange={e => setBillingMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Collection Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            {/* Financial Breakdown Section */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/40">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Bill Breakdown & Adjustments
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Room Rent (₹) *
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={e => setRentAmount(Number(e.target.value))}
                    min="0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Electricity Charge (₹)
                    </label>
                    <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeElectricity}
                        onChange={e => setIncludeElectricity(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      Include
                    </label>
                  </div>
                  <input
                    type="number"
                    value={electricityAmount}
                    onChange={e => setElectricityAmount(Number(e.target.value))}
                    disabled={!includeElectricity}
                    min="0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {includeElectricity && electricityUnits > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      ~{electricityUnits} units share based on building rate
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Maintenance / Cleaning (₹)
                  </label>
                  <input
                    type="number"
                    value={maintenanceCharges}
                    onChange={e => setMaintenanceCharges(Number(e.target.value))}
                    min="0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Discount / Waiver (₹)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    min="0"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs font-semibold">
                <span className="text-indigo-900">Calculated Total Due:</span>
                <span className="font-mono text-sm text-indigo-700">₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Execution Fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid by Tenant (₹) *
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value))}
                    min="0"
                    className="w-full px-3.5 py-2 text-sm font-bold font-mono text-emerald-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  {balanceDue > 0 && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Partial payment: ₹{balanceDue.toLocaleString('en-IN')} will remain due.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash Collection</option>
                    <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Txn ID / UTR / Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/624912083/SER or Cash receipt #"
                    value={transactionReference}
                    onChange={e => setTransactionReference(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Received By (Staff / Manager)
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={e => setReceivedBy(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Collection Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid advance for next month or requested invoice copy"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="submit-payment-btn"
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                Record Payment & Issue Receipt
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
