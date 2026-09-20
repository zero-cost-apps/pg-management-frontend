import React from 'react';
import { Room, Building } from '../../types';
import { usePG } from '../../context/PGContext';
import { 
  Home, 
  Users, 
  User, 
  Phone, 
  Wind, 
  Sparkles, 
  Bath, 
  Zap, 
  UserPlus, 
  MoreVertical, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit2
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  building: Building;
  onEditRoom: (room: Room) => void;
  onCheckInTenant: (roomId: string) => void;
  onAddCoOccupant: (roomId: string, tenantId?: string) => void;
  onLogElectricity: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  building,
  onEditRoom,
  onCheckInTenant,
  onAddCoOccupant,
  onLogElectricity
}) => {
  const { 
    tenants, 
    coOccupants, 
    setTenantToView, 
    setCoOccupantToViewAadhaar,
    updateRoomStatus,
    deleteCoOccupant 
  } = usePG();

  // Find primary tenant
  const primaryTenant = tenants.find(t => t.roomId === room.id && t.status !== 'vacated');
  
  // Find co-occupants in this room
  const roomCoOccupants = coOccupants.filter(co => co.roomId === room.id);

  // Total current occupants
  const totalOccupantsCount = (primaryTenant ? 1 : 0) + roomCoOccupants.length;
  const isAtFullCapacity = totalOccupantsCount >= room.capacity;

  const getStatusBadge = () => {
    switch (room.status) {
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Occupied
          </span>
        );
      case 'vacant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Vacant (Ready)
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Wrench className="w-3 h-3 text-amber-700" />
            Under Maintenance
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-mono">
                Room {room.roomNumber}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Floor {room.floor} • {building.name}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditRoom(room)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Edit Room Config"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Capacity & Price Metrics */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Capacity: <strong className="text-slate-900 font-mono">{room.capacity}</strong> People allowed</span>
          </div>

          <div className="font-mono font-bold text-indigo-700 text-sm">
            ₹{room.baseRent.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
          </div>
        </div>
      </div>

      {/* Main Room Body */}
      <div className="p-4 space-y-4 grow">
        
        {/* State 1: Occupied Room */}
        {room.status === 'occupied' && primaryTenant && (
          <div className="space-y-3">
            
            {/* Primary Tenant Capsule */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Primary Tenant
                </span>
                <span className="text-[11px] text-slate-400">
                  Since {primaryTenant.checkInDate}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {primaryTenant.avatarUrl ? (
                    <img 
                      src={primaryTenant.avatarUrl} 
                      alt={primaryTenant.fullName}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-indigo-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {primaryTenant.fullName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <button
                      onClick={() => setTenantToView(primaryTenant)}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate block text-left"
                    >
                      {primaryTenant.fullName}
                    </button>
                    <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {primaryTenant.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setTenantToView(primaryTenant)}
                  className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs"
                >
                  Profile
                </button>
              </div>
            </div>

            {/* Co-Occupants / Room Guests Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Other Residents ({roomCoOccupants.length})</span>
                </div>

                <button
                  onClick={() => onAddCoOccupant(room.id, primaryTenant.id)}
                  disabled={isAtFullCapacity}
                  className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    isAtFullCapacity
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-purple-600 hover:text-purple-700'
                  }`}
                  title={isAtFullCapacity ? 'Room reached maximum capacity' : 'Add guest / co-occupant'}
                >
                  <Plus className="w-3 h-3" /> Add Guest
                </button>
              </div>

              {roomCoOccupants.length > 0 ? (
                <div className="space-y-2">
                  {roomCoOccupants.map(co => (
                    <div 
                      key={co.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {co.fullName}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 shrink-0">
                            {co.relationship}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {co.phone}
                        </p>
                      </div>

                      {/* Aadhaar Card Action Pill */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setCoOccupantToViewAadhaar(co)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                          title="View Aadhaar Card (PDF)"
                        >
                          <FileText className="w-3 h-3 text-emerald-600" />
                          Aadhaar PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-[11px] text-slate-500">
                    No additional room members registered.
                  </p>
                  <button
                    onClick={() => onAddCoOccupant(room.id, primaryTenant.id)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 mt-1 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add person living in this room
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 2: Vacant Room */}
        {room.status === 'vacant' && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-blue-50/30 rounded-xl border border-blue-100/80">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <Home className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              Vacant & Cleaned
            </h4>
            <p className="text-[11px] text-slate-500 max-w-[200px] mt-0.5">
              Available for immediate check-in. Fits up to {room.capacity} occupants.
            </p>

            <button
              onClick={() => onCheckInTenant(room.id)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Check-in Tenant
            </button>
          </div>
        )}

        {/* State 3: Maintenance */}
        {room.status === 'maintenance' && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-amber-50/40 rounded-xl border border-amber-200/70">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              Maintenance Work in Progress
            </h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {room.maintenanceReason || 'Deep cleaning & fixtures repair'}
            </p>

            <button
              onClick={() => updateRoomStatus(room.id, 'vacant')}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Vacant (Ready)
            </button>
          </div>
        )}

        {/* Amenities Bar */}
        <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
          {room.hasAttachedBathroom && (
            <span className="flex items-center gap-1" title="Attached Bathroom">
              <Bath className="w-3 h-3 text-indigo-500" /> Bath
            </span>
          )}
          {room.hasAirConditioner && (
            <span className="flex items-center gap-1" title="Air Conditioner">
              <Wind className="w-3 h-3 text-sky-500" /> AC
            </span>
          )}
          {room.hasBalcony && (
            <span className="flex items-center gap-1" title="Balcony View">
              <Sparkles className="w-3 h-3 text-amber-500" /> Balcony
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Sub-meter Reading & Status Toggles */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          onClick={() => onLogElectricity(room.id)}
          className="text-slate-600 hover:text-amber-600 font-medium flex items-center gap-1 transition-colors"
          title="Record or update meter reading"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono">{room.lastMeterReading || 0}</span> kWh
        </button>

        {room.status === 'occupied' && (
          <button
            onClick={() => {
              if (window.confirm(`Set Room ${room.roomNumber} to Maintenance status?`)) {
                updateRoomStatus(room.id, 'maintenance', 'Routine maintenance');
              }
            }}
            className="text-[11px] text-slate-400 hover:text-amber-600 transition-colors"
          >
            Mark Maintenance
          </button>
        )}

        {room.status === 'vacant' && (
          <button
            onClick={() => updateRoomStatus(room.id, 'maintenance', 'Repainting & cleaning')}
            className="text-[11px] text-slate-400 hover:text-amber-600 transition-colors"
          >
            Set Maintenance
          </button>
        )}
      </div>
    </div>
  );
};
