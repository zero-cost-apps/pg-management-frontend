import React from 'react';
import { usePG } from '../../context/PGContext';
import { 
  Building2, 
  Home, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Clock, 
  DollarSign 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenRentModal: (tenantId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenRentModal }) => {
  const { 
    stats, 
    buildings, 
    rooms, 
    coOccupants,
    overdueList, 
    payments, 
    setReceiptToView,
    tenants,
    selectedBuilding,
    selectedBuildingId
  } = usePG();

  // Filter relative to selected building
  const buildingPayments = payments.filter(p => !selectedBuildingId || selectedBuildingId === 'all' || p.buildingId === selectedBuildingId);
  const buildingTenants = tenants.filter(t => !selectedBuildingId || selectedBuildingId === 'all' || t.buildingId === selectedBuildingId);

  // Occupancy breakdown by building for charts (or rooms breakdown if single building)
  const buildingAnalytics = buildings.map(b => {
    const bRooms = rooms.filter(r => r.buildingId === b.id);
    const bOccupied = bRooms.filter(r => r.status === 'occupied').length;
    const bVacant = bRooms.filter(r => r.status === 'vacant').length;
    const bTotal = bRooms.length;
    const bRate = bTotal > 0 ? Math.round((bOccupied / bTotal) * 100) : 0;

    return {
      name: b.code || b.name.substring(0, 10),
      fullName: b.name,
      totalRooms: bTotal,
      occupied: bOccupied,
      vacant: bVacant,
      occupancyRate: bRate
    };
  });

  // Room status distribution data for donut
  const roomStatusData = [
    { name: 'Occupied Rooms', value: stats.occupiedRooms, color: '#4f46e5' },
    { name: 'Vacant Ready', value: stats.vacantRooms, color: '#10b981' },
    { name: 'Under Maintenance', value: stats.maintenanceRooms, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Active tenants & total residents for current scope
  const activeTenantsCount = buildingTenants.filter(t => t.status === 'active').length;
  const totalResidentsCount = stats.totalResidents;
  const collectionRate = stats.expectedRevenue > 0 ? Math.round((stats.collectedRevenue / stats.expectedRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Active Building Property Focus Banner */}
      {selectedBuilding && (
        <div className="bg-white p-4 rounded-2xl border border-indigo-100/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              {selectedBuilding.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{selectedBuilding.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Property
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedBuilding.address}, {selectedBuilding.city} • Managed by <strong>{selectedBuilding.managerName}</strong> ({selectedBuilding.managerPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
              Rent Due: <strong className="text-slate-900">{selectedBuilding.billingDueDay}th of month</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
              Electricity Tariff: <strong className="font-mono font-bold">₹{selectedBuilding.electricityRatePerUnit}/unit</strong>
            </div>
          </div>
        </div>
      )}
      
      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Real-time Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Real-Time Occupancy</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">{stats.occupancyRate}%</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Optimum
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              <strong className="text-indigo-600 font-mono">{stats.occupiedRooms}</strong> of {stats.totalRooms} rooms
            </span>
            <button 
              onClick={() => onNavigate('rooms')}
              className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {stats.vacantRooms} Vacant <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Rent Collected</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                ₹{(stats.collectedRevenue / 1000).toFixed(0)}k
              </span>
              <span className="text-xs font-medium text-slate-400">
                / ₹{(stats.expectedRevenue / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Collection: <strong className="text-emerald-600 font-mono">{collectionRate}%</strong>
            </span>
            <button
              onClick={() => onOpenRentModal()}
              className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              + Collect <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-rose-600">
                ₹{stats.totalOverdueAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              <strong className="text-rose-600 font-bold">{overdueList.length}</strong> overdue tenants
            </span>
            <button
              onClick={() => onNavigate('overdue')}
              className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              Send Notices <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Active Tenancy & Residents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Residents</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">{totalResidentsCount}</span>
              <span className="text-xs font-medium text-slate-400">
                ({activeTenantsCount} primary + {coOccupants.length} guests)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-indigo-600 font-medium">
              Multi-person room capacity active
            </span>
            <button
              onClick={() => onNavigate('tenants')}
              className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              Directory <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Multi-building Occupancy comparison (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Building Occupancy Performance</h3>
              <p className="text-xs text-slate-500">Track occupied vs vacant room capacity across all registered PG properties</p>
            </div>
            <button
              onClick={() => onNavigate('buildings')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Manage Config <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [value, name === 'occupied' ? 'Occupied Rooms' : 'Vacant Rooms']}
                  labelFormatter={(label: any) => `Property: ${label}`}
                />
                <Bar dataKey="occupied" name="Occupied Rooms" fill="#4f46e5" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="vacant" name="Vacant Rooms" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Status Distribution Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Room Utilization Mix</h3>
            <p className="text-xs text-slate-500">Unit operational status</p>
          </div>

          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {roomStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-slate-900">{item.value} rooms</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Two Column Section: Overdue Action Center & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Overdue Tracker Snippet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Overdue Rent Collection Action</h3>
              </div>
              <button
                onClick={() => onNavigate('overdue')}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                Full Aging Report ({overdueList.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {overdueList.slice(0, 4).map((item, idx) => (
                <div 
                  key={`${item.tenant.id}-${idx}`}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.tenant.fullName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-100 text-rose-800 font-bold">
                        {item.daysOverdue} days late
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.building.name} • Room {item.room.roomNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      ₹{item.totalOverdue.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => onOpenRentModal(item.tenant.id)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated calculation based on building due day</span>
            <button
              onClick={() => onNavigate('overdue')}
              className="text-indigo-600 font-bold hover:underline"
            >
              1-Click Reminders
            </button>
          </div>
        </div>

        {/* Recent Rent Payments & Receipts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Recent Collections & Receipts</h3>
              </div>
              <button
                onClick={() => onNavigate('rent')}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                All Receipts <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {buildingPayments.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  No rent payments logged yet for {selectedBuilding?.name || 'this property'}.
                </div>
              ) : (
                buildingPayments.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-600 font-bold text-[11px]">{p.receiptNumber}</span>
                        <span className="font-bold text-slate-900">{p.tenantName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Room {p.roomNumber} • Paid on {p.paymentDate} via <span className="uppercase font-semibold">{p.paymentMode}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        ₹{p.amountPaid.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setReceiptToView(p)}
                        title="Print / View Receipt"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Official printable tax invoices</span>
            <button
              onClick={() => onOpenRentModal()}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              + Manual Rent Entry
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
