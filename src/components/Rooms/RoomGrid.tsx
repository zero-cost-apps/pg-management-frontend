import React, { useState, useMemo } from 'react';
import { usePG } from '../../context/PGContext';
import { Room, Building } from '../../types';
import { RoomCard } from './RoomCard';
import { RoomModal } from './RoomModal';
import { RoomCheckInModal } from './RoomCheckInModal';
import { CoOccupantModal } from './CoOccupantModal';
import { AadharPdfViewerModal } from './AadharPdfViewerModal';
import { MeterReadingModal } from '../Electricity/MeterReadingModal';
import { 
  Plus, 
  Search, 
  Home, 
  Users, 
  Zap, 
  Layers, 
  Filter, 
  Wrench,
  CheckCircle2
} from 'lucide-react';

export const RoomGrid: React.FC = () => {
  const { 
    rooms, 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId,
    coOccupantToViewAadhaar,
    setCoOccupantToViewAadhaar,
    stats,
    coOccupants
  } = usePG();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'vacant' | 'maintenance'>('all');
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInRoomId, setCheckInRoomId] = useState<string | undefined>(undefined);

  const [isCoOccupantModalOpen, setIsCoOccupantModalOpen] = useState(false);
  const [coOccupantTargetRoomId, setCoOccupantTargetRoomId] = useState<string | undefined>(undefined);
  const [coOccupantTargetTenantId, setCoOccupantTargetTenantId] = useState<string | undefined>(undefined);

  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [meterRoomId, setMeterRoomId] = useState<string | undefined>(undefined);

  // Filter logic
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      // Building
      if (selectedBuildingId !== 'all' && r.buildingId !== selectedBuildingId) return false;

      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Floor
      if (floorFilter !== 'all' && r.floor !== floorFilter) return false;

      // Search (room number, meter number)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRoomNumber = r.roomNumber.toLowerCase().includes(query);
        const matchesMeter = (r.meterNumber || '').toLowerCase().includes(query);
        if (!matchesRoomNumber && !matchesMeter) return false;
      }

      return true;
    });
  }, [rooms, selectedBuildingId, statusFilter, floorFilter, searchTerm]);

  // Unique floors for current building selection
  const availableFloors = useMemo(() => {
    const relevantRooms = selectedBuildingId === 'all' 
      ? rooms 
      : rooms.filter(r => r.buildingId === selectedBuildingId);
    return Array.from(new Set(relevantRooms.map(r => r.floor))).sort((a, b) => a - b);
  }, [rooms, selectedBuildingId]);

  // Handler helpers
  const handleOpenAddRoom = () => {
    setRoomToEdit(null);
    setIsRoomModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setIsRoomModalOpen(true);
  };

  const handleOpenCheckIn = (roomId: string) => {
    setCheckInRoomId(roomId);
    setIsCheckInOpen(true);
  };

  const handleOpenAddCoOccupant = (roomId: string, tenantId?: string) => {
    setCoOccupantTargetRoomId(roomId);
    setCoOccupantTargetTenantId(tenantId);
    setIsCoOccupantModalOpen(true);
  };

  const handleOpenLogMeter = (roomId: string) => {
    setMeterRoomId(roomId);
    setIsMeterModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-600" />
            Rooms & Unit Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status tracking for vacant and occupied single rooms. Multiple occupants per room supported with guest profiles and Aadhaar storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddRoom}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      {/* Metric Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Total Rooms
            </span>
            <span className="text-2xl font-mono font-extrabold text-slate-900">
              {stats.totalRooms}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Occupied Rooms
            </span>
            <span className="text-2xl font-mono font-extrabold text-emerald-600">
              {stats.occupiedRooms}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Vacant Ready
            </span>
            <span className="text-2xl font-mono font-extrabold text-blue-600">
              {stats.vacantRooms}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Total Residents
            </span>
            <span className="text-2xl font-mono font-extrabold text-purple-600">
              {stats.totalResidents}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Room Number or Meter Serial..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Status Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['all', 'occupied', 'vacant', 'maintenance'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Floor Filter */}
            {availableFloors.length > 1 && (
              <select
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Floors</option>
                {availableFloors.map(fl => (
                  <option key={fl} value={fl}>Floor {fl}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map(room => {
            const building = buildings.find(b => b.id === room.buildingId) || buildings[0];
            return (
              <RoomCard
                key={room.id}
                room={room}
                building={building}
                onEditRoom={handleEditRoom}
                onCheckInTenant={handleOpenCheckIn}
                onAddCoOccupant={handleOpenAddCoOccupant}
                onLogElectricity={handleOpenLogMeter}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No rooms match the criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or create a new room for this property.
          </p>
          <button
            onClick={handleOpenAddRoom}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Room Now
          </button>
        </div>
      )}

      {/* Room Modal (Create/Edit) */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomToEdit={roomToEdit}
      />

      {/* Check-In Modal (Primary Tenant) */}
      <RoomCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        roomId={checkInRoomId}
      />

      {/* Co-Occupant / Guest Modal */}
      <CoOccupantModal
        isOpen={isCoOccupantModalOpen}
        onClose={() => setIsCoOccupantModalOpen(false)}
        roomId={coOccupantTargetRoomId}
        tenantId={coOccupantTargetTenantId}
      />

      {/* Aadhaar PDF Viewer Modal */}
      <AadharPdfViewerModal
        coOccupant={coOccupantToViewAadhaar}
        onClose={() => setCoOccupantToViewAadhaar(null)}
      />

      {/* Meter Reading Modal */}
      <MeterReadingModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
        preselectedRoomId={meterRoomId}
      />
    </div>
  );
};
