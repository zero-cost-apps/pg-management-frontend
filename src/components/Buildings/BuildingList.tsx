import React, { useState } from 'react';
import { usePG } from '../../context/PGContext';
import { Building } from '../../types';
import { BuildingModal } from './BuildingModal';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Zap, 
  Calendar, 
  Phone, 
  User, 
  Layers, 
  Settings, 
  Home, 
  QrCode,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface BuildingListProps {
  onNavigateToRooms: (buildingId: string) => void;
}

export const BuildingList: React.FC<BuildingListProps> = ({ onNavigateToRooms }) => {
  const { buildings, rooms, selectedBuildingId, setSelectedBuildingId, generateRoomsForBuilding } = usePG();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);
  const [generatingBuildingId, setGeneratingBuildingId] = useState<string | null>(null);

  const handleQuickGenerate = async (bldId: string) => {
    setGeneratingBuildingId(bldId);
    try {
      await generateRoomsForBuilding(bldId);
    } finally {
      setGeneratingBuildingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Multi-Building Portfolio & Config</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent electricity tariffs, room types, manager contacts, and policies for each PG branch
          </p>
        </div>

        <button
          onClick={() => {
            setBuildingToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Building Property
        </button>
      </div>

      {/* Buildings Cards Grid */}
      {buildings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No PG Buildings in Your Portfolio</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              You haven't added any PG branches or buildings yet. Add your first property to start configuring rooms, electricity rates, and tenant occupancy.
            </p>
          </div>
          <button
            onClick={() => {
              setBuildingToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add First Building Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {buildings.map(building => {
          const buildingRooms = rooms.filter(r => r.buildingId === building.id);
          const totalRooms = buildingRooms.length;
          const occupiedRooms = buildingRooms.filter(r => r.status === 'occupied').length;
          const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
          const isActive = selectedBuildingId === building.id;

          return (
            <div 
              key={building.id}
              className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                isActive ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className={`p-5 border-b ${isActive ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50/60 border-slate-100'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                        {building.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{building.name}</h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Property
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {building.address}, {building.city}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setBuildingToEdit(building);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                    title="Configure Building"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Mini Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Occupancy</span>
                    <span className="font-mono font-bold text-indigo-600">{occupancyPct}% ({occupiedRooms}/{totalRooms} rooms)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Building Config Specs */}
              <div className="p-5 space-y-4 flex-1 text-xs">
                
                {/* Specific Config highlights */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/40 border border-amber-200/50">
                  <div>
                    <span className="text-[10px] text-amber-800 uppercase font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-600" />
                      Electricity Tariff
                    </span>
                    <span className="text-sm font-mono font-bold text-amber-900 mt-0.5 block">
                      ₹{building.electricityRatePerUnit} <span className="text-xs font-sans text-amber-700 font-normal">/ unit</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Rent Due Date
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {building.billingDueDay}th of month
                    </span>
                  </div>
                </div>

                {/* Room Types Configured */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Configured Room Types & Tariffs
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(building.roomTypes || []).map(rt => (
                      <span key={rt.id} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium flex items-center gap-1">
                        <strong>{rt.name}:</strong>
                        <span className="font-mono text-indigo-700">₹{rt.baseRent.toLocaleString('en-IN')}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Manager & QR Contact */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Manager: <strong>{building.managerName}</strong></span>
                    <span>({building.managerPhone})</span>
                  </div>
                  {building.upiId && (
                    <span className="font-mono text-indigo-600 font-medium">
                      UPI: {building.upiId}
                    </span>
                  )}
                </div>

              </div>

              {/* Card Footer Actions */}
              {(() => {
                const plannedTotal = (building.floorConfigs || []).reduce((s, fc) => s + fc.roomCount, 0);
                const hasMissing = plannedTotal > buildingRooms.length;
                const isGenerating = generatingBuildingId === building.id;

                return (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        {plannedTotal > 0 ? (
                          <>
                            <strong className="text-slate-800 font-mono">{buildingRooms.length}</strong> / {plannedTotal} rooms
                          </>
                        ) : (
                          `${buildingRooms.length} room units registered`
                        )}
                      </span>
                      {hasMissing && (
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => handleQuickGenerate(building.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors"
                          title="Generate missing rooms from floor configuration"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isGenerating ? 'Generating...' : `Generate ${plannedTotal - buildingRooms.length}`}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => setSelectedBuildingId(building.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBuildingId(building.id);
                          onNavigateToRooms(building.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors shadow-2xs"
                      >
                        <Home className="w-3.5 h-3.5" />
                        View Rooms & Occupants
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          );
        })}
      </div>
      )}

      {/* Building Modal */}
      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBuildingToEdit(null);
        }}
        buildingToEdit={buildingToEdit}
      />

    </div>
  );
};
