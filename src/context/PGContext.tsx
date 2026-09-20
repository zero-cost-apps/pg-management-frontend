import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  Building,
  Room,
  Tenant,
  CoOccupant,
  RentPayment,
  ElectricityRecord,
  OverdueSummary,
  DashboardStats,
  TenantDocument,
} from '../types';
import { useAuth } from './AuthContext';
import {
  useBuildingsQuery,
  useRoomsQuery,
  useTenantsQuery,
  usePaymentsQuery,
  useElectricityQuery,
  useDashboardQuery,
  useOverdueQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useUpdateRoomStatusMutation,
  useCheckInTenantMutation,
  useUpdateTenantMutation,
  useTenantVacateMutation,
  useCreateCoOccupantMutation,
  useUpdateCoOccupantMutation,
  useDeleteCoOccupantMutation,
  useCreatePaymentMutation,
  useCreateElectricityMutation,
} from '../api/queries';

interface PGContextType {
  // Collections
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  coOccupants: CoOccupant[];
  payments: RentPayment[];
  electricityRecords: ElectricityRecord[];

  // Database status
  isDbReady: boolean;
  dbEngineName: string;
  lastSyncTime: string;

  // Selected Building Filter
  selectedBuildingId: string; // 'all' or specific building id
  setSelectedBuildingId: (id: string) => void;
  selectedBuilding: Building | undefined;

  // Search & Global Nav
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Selected view models for modal triggers
  receiptToView: RentPayment | null;
  setReceiptToView: (payment: RentPayment | null) => void;
  tenantToView: Tenant | null;
  setTenantToView: (tenant: Tenant | null) => void;
  coOccupantToViewAadhaar: CoOccupant | null;
  setCoOccupantToViewAadhaar: (co: CoOccupant | null) => void;
  isRentModalOpen: boolean;
  setIsRentModalOpen: (open: boolean) => void;
  rentModalPreselectedTenantId?: string;
  setRentModalPreselectedTenantId: (id?: string) => void;
  openRentModal: (tenantId?: string) => void;
  closeRentModal: () => void;

  // Computed Analytics
  stats: DashboardStats;
  overdueList: OverdueSummary[];

  // Actions: Buildings
  addBuilding: (building: Omit<Building, 'id' | 'createdAt' | 'ownerId'> & { ownerId?: string }) => Building;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;

  // Actions: Rooms
  addRoom: (room: Omit<Room, 'id'>) => Room;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  updateRoomStatus: (roomId: string, status: Room['status'], reason?: string) => void;
  assignPrimaryTenant: (roomId: string, tenantId: string) => void;
  vacateRoom: (roomId: string) => void;

  // Actions: Tenants
  addTenant: (
    tenant: Omit<Tenant, 'id'>,
    initialCoOccupants?: Array<Omit<CoOccupant, 'id' | 'createdAt' | 'tenantId' | 'roomId'>>
  ) => Tenant;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  vacateTenant: (tenantId: string, refundDeposit?: boolean) => void;
  addTenantDocument: (tenantId: string, document: Omit<Tenant['documents'][0], 'id' | 'uploadDate'>) => void;
  updateDocumentStatus: (tenantId: string, docId: string, status: 'verified' | 'pending' | 'rejected') => void;

  // Actions: Co-Occupants / Room Guests
  addCoOccupant: (data: Omit<CoOccupant, 'id' | 'createdAt'>) => CoOccupant;
  updateCoOccupant: (id: string, updates: Partial<CoOccupant>) => void;
  deleteCoOccupant: (id: string) => void;
  getCoOccupantsForRoom: (roomId: string) => CoOccupant[];
  getCoOccupantsForTenant: (tenantId: string) => CoOccupant[];

  // Actions: Rent & Payments
  recordRentPayment: (paymentData: Omit<RentPayment, 'id' | 'receiptNumber' | 'createdAt'>) => RentPayment;
  deletePayment: (id: string) => void;

  // Actions: Electricity
  logElectricityReading: (recordData: Omit<ElectricityRecord, 'id'>) => ElectricityRecord;
  deleteElectricityRecord: (id: string) => void;

  // Utility & Storage
  resetToSampleData: () => Promise<void>;
  exportDataJson: () => void;
  importDataJson: (jsonData: string) => boolean;
}

const PGContext = createContext<PGContextType | undefined>(undefined);

export const PGProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const currentOwnerId = currentUser?.id || '';

  // UI state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [receiptToView, setReceiptToView] = useState<RentPayment | null>(null);
  const [tenantToView, setTenantToView] = useState<Tenant | null>(null);
  const [coOccupantToViewAadhaar, setCoOccupantToViewAadhaar] = useState<CoOccupant | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [rentModalPreselectedTenantId, setRentModalPreselectedTenantId] = useState<string | undefined>(undefined);

  const openRentModal = (tenantId?: string) => {
    setRentModalPreselectedTenantId(tenantId);
    setIsRentModalOpen(true);
  };

  const closeRentModal = () => {
    setIsRentModalOpen(false);
    setRentModalPreselectedTenantId(undefined);
  };

  // TanStack Queries (Active when logged in and onboarded)
  const isQueryEnabled = isAuthenticated && !!currentUser?.isOnboarded;

  const buildingsQuery = useBuildingsQuery(isQueryEnabled);
  const roomsQuery = useRoomsQuery(undefined, isQueryEnabled);
  const tenantsQuery = useTenantsQuery(undefined, isQueryEnabled);
  const paymentsQuery = usePaymentsQuery(undefined, isQueryEnabled);
  const electricityQuery = useElectricityQuery(undefined, isQueryEnabled);

  const activeBuildingFilter = selectedBuildingId !== 'all' ? selectedBuildingId : undefined;
  const dashboardQuery = useDashboardQuery(activeBuildingFilter, undefined, isQueryEnabled);
  const overdueQuery = useOverdueQuery(activeBuildingFilter, undefined, isQueryEnabled);

  // TanStack Mutations
  const createBuildingMutation = useCreateBuildingMutation();
  const updateBuildingMutation = useUpdateBuildingMutation();
  const deleteBuildingMutation = useDeleteBuildingMutation();

  const createRoomMutation = useCreateRoomMutation();
  const updateRoomMutation = useUpdateRoomMutation();
  const deleteRoomMutation = useDeleteRoomMutation();
  const updateRoomStatusMutation = useUpdateRoomStatusMutation();

  const checkInTenantMutation = useCheckInTenantMutation();
  const updateTenantMutation = useUpdateTenantMutation();
  const vacateTenantMutation = useTenantVacateMutation();

  const createCoOccupantMutation = useCreateCoOccupantMutation();
  const updateCoOccupantMutation = useUpdateCoOccupantMutation();
  const deleteCoOccupantMutation = useDeleteCoOccupantMutation();

  const createPaymentMutation = useCreatePaymentMutation();
  const createElectricityMutation = useCreateElectricityMutation();

  // Raw data from TanStack Query cache (defaults to empty array while loading)
  const buildings = useMemo(() => buildingsQuery.data || [], [buildingsQuery.data]);
  const rooms = useMemo(() => roomsQuery.data || [], [roomsQuery.data]);
  const tenants = useMemo(() => tenantsQuery.data || [], [tenantsQuery.data]);
  const payments = useMemo(() => paymentsQuery.data || [], [paymentsQuery.data]);
  const electricityRecords = useMemo(() => electricityQuery.data || [], [electricityQuery.data]);

  // Derive coOccupants from tenants or local cache
  const [localCoOccupants, setLocalCoOccupants] = useState<CoOccupant[]>([]);

  // Selected Building
  const selectedBuilding = useMemo(() => {
    if (selectedBuildingId === 'all') return undefined;
    return buildings.find((b) => b.id === selectedBuildingId);
  }, [buildings, selectedBuildingId]);

  // Computed Analytics: Use backend dashboard data when available, with client-side fallback
  const stats: DashboardStats = useMemo(() => {
    if (dashboardQuery.data) {
      return dashboardQuery.data;
    }

    const filteredRooms = selectedBuildingId === 'all'
      ? rooms
      : rooms.filter((r) => r.buildingId === selectedBuildingId);

    const totalRooms = filteredRooms.length;
    const occupiedRooms = filteredRooms.filter((r) => r.status === 'occupied').length;
    const vacantRooms = filteredRooms.filter((r) => r.status === 'vacant').length;
    const maintenanceRooms = filteredRooms.filter((r) => r.status === 'maintenance').length;
    const totalAllowedCapacity = filteredRooms.reduce((acc, r) => acc + (r.capacity || 1), 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const filteredTenants = selectedBuildingId === 'all'
      ? tenants.filter((t) => t.status !== 'vacated')
      : tenants.filter((t) => t.buildingId === selectedBuildingId && t.status !== 'vacated');

    const totalResidents = filteredTenants.length;
    const expectedRevenue = filteredTenants.reduce((acc, t) => acc + (t.monthlyRent || 0), 0);

    const filteredPayments = selectedBuildingId === 'all'
      ? payments
      : payments.filter((p) => p.buildingId === selectedBuildingId);

    const collectedRevenue = filteredPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    const electricityCollected = filteredPayments.reduce((acc, p) => acc + (p.electricityAmount || 0), 0);

    return {
      totalBuildings: buildings.length,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      totalResidents,
      totalAllowedCapacity,
      occupancyRate,
      expectedRevenue,
      collectedRevenue,
      totalOverdueAmount: 0,
      overdueTenantsCount: 0,
      electricityCollected,
    };
  }, [dashboardQuery.data, buildings, rooms, tenants, payments, selectedBuildingId]);

  // Overdue List: Use backend overdue data when available
  const overdueList: OverdueSummary[] = useMemo(() => {
    if (overdueQuery.data && Array.isArray(overdueQuery.data)) {
      return overdueQuery.data as OverdueSummary[];
    }
    return [];
  }, [overdueQuery.data]);

  // Actions: Buildings
  const addBuilding = (data: Omit<Building, 'id' | 'createdAt' | 'ownerId'> & { ownerId?: string }): Building => {
    const tempId = `bld-${Date.now()}`;
    const newBuilding: Building = {
      ...data,
      id: tempId,
      ownerId: currentOwnerId,
      code: data.code || data.name.slice(0, 3).toUpperCase(),
      createdAt: new Date().toISOString(),
      roomTypes: data.roomTypes || [],
    };
    createBuildingMutation.mutate(data);
    return newBuilding;
  };

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    updateBuildingMutation.mutate({ id, updates });
  };

  const deleteBuilding = (id: string) => {
    deleteBuildingMutation.mutate(id);
  };

  // Actions: Rooms
  const addRoom = (roomData: Omit<Room, 'id'>): Room => {
    const tempId = `room-${Date.now()}`;
    const newRoom: Room = {
      ...roomData,
      id: tempId,
    };
    createRoomMutation.mutate(roomData);
    return newRoom;
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    updateRoomMutation.mutate({ id, updates });
  };

  const deleteRoom = (id: string) => {
    deleteRoomMutation.mutate(id);
  };

  const updateRoomStatus = (roomId: string, status: Room['status'], reason?: string) => {
    updateRoomStatusMutation.mutate({ id: roomId, status, reason });
  };

  const assignPrimaryTenant = (roomId: string, tenantId: string) => {
    updateRoomMutation.mutate({ id: roomId, updates: { primaryTenantId: tenantId, status: 'occupied' } });
  };

  const vacateRoom = (roomId: string) => {
    updateRoomMutation.mutate({ id: roomId, updates: { primaryTenantId: undefined, status: 'vacant' } });
  };

  // Actions: Tenants
  const addTenant = (
    tenantData: Omit<Tenant, 'id'>,
    initialCoOccupants?: Array<Omit<CoOccupant, 'id' | 'createdAt' | 'tenantId' | 'roomId'>>
  ): Tenant => {
    const tempId = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      ...tenantData,
      id: tempId,
    };

    checkInTenantMutation.mutate({
      buildingId: tenantData.buildingId,
      roomId: tenantData.roomId,
      fullName: tenantData.fullName,
      phone: tenantData.phone,
      email: tenantData.email,
      gender: tenantData.gender,
      occupation: tenantData.occupation,
      workOrCollegeName: tenantData.workOrCollegeName,
      permanentAddress: tenantData.permanentAddress,
      emergencyContactName: tenantData.emergencyContactName,
      emergencyContactRelation: tenantData.emergencyContactRelation,
      emergencyContactPhone: tenantData.emergencyContactPhone,
      checkInDate: tenantData.checkInDate,
      monthlyRent: tenantData.monthlyRent,
      securityDeposit: tenantData.securityDeposit,
      depositStatus: tenantData.depositStatus,
      idProofNumber: tenantData.documents?.[0]?.documentNumber,
      coOccupants: initialCoOccupants,
    });

    return newTenant;
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    updateTenantMutation.mutate({ id, updates });
  };

  const vacateTenant = (tenantId: string, refundDeposit: boolean = true) => {
    vacateTenantMutation.mutate({ id: tenantId, refundDeposit });
  };

  const addTenantDocument = (
    tenantId: string,
    document: Omit<Tenant['documents'][0], 'id' | 'uploadDate'>
  ) => {
    const current = tenants.find((t) => t.id === tenantId);
    if (current) {
      const newDoc: TenantDocument = {
        ...document,
        id: `doc-${Date.now()}`,
        uploadDate: new Date().toISOString().split('T')[0],
      };
      updateTenantMutation.mutate({
        id: tenantId,
        updates: { documents: [...(current.documents || []), newDoc] },
      });
    }
  };

  const updateDocumentStatus = (
    tenantId: string,
    docId: string,
    status: 'verified' | 'pending' | 'rejected'
  ) => {
    const current = tenants.find((t) => t.id === tenantId);
    if (current) {
      const updatedDocs = (current.documents || []).map((d) => (d.id === docId ? { ...d, status } : d));
      updateTenantMutation.mutate({
        id: tenantId,
        updates: { documents: updatedDocs },
      });
    }
  };

  // Actions: Co-Occupants
  const addCoOccupant = (data: Omit<CoOccupant, 'id' | 'createdAt'>): CoOccupant => {
    const tempId = `co-${Date.now()}`;
    const newCo: CoOccupant = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setLocalCoOccupants((prev) => [...prev, newCo]);
    createCoOccupantMutation.mutate(data);
    return newCo;
  };

  const updateCoOccupant = (id: string, updates: Partial<CoOccupant>) => {
    setLocalCoOccupants((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    updateCoOccupantMutation.mutate({ id, updates });
  };

  const deleteCoOccupant = (id: string) => {
    setLocalCoOccupants((prev) => prev.filter((c) => c.id !== id));
    deleteCoOccupantMutation.mutate(id);
  };

  const getCoOccupantsForRoom = (roomId: string): CoOccupant[] => {
    return localCoOccupants.filter((co) => co.roomId === roomId);
  };

  const getCoOccupantsForTenant = (tenantId: string): CoOccupant[] => {
    return localCoOccupants.filter((co) => co.tenantId === tenantId);
  };

  // Actions: Payments
  const recordRentPayment = (
    paymentData: Omit<RentPayment, 'id' | 'receiptNumber' | 'createdAt'>
  ): RentPayment => {
    const yearMonth = paymentData.billingMonth.replace('-', '');
    const receiptNumber = `RCP-${yearMonth}-${String(payments.length + 1).padStart(3, '0')}`;
    const tempId = `pay-${Date.now()}`;
    const newPayment: RentPayment = {
      ...paymentData,
      id: tempId,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    createPaymentMutation.mutate({
      data: {
        tenantId: paymentData.tenantId,
        billingMonth: paymentData.billingMonth,
        rentAmount: paymentData.rentAmount,
        includeElectricity: paymentData.electricityAmount > 0,
        electricityAmount: paymentData.electricityAmount,
        electricityUnits: paymentData.electricityUnits,
        maintenanceCharges: paymentData.maintenanceCharges,
        otherCharges: paymentData.otherCharges,
        discount: paymentData.discount,
        amountPaid: paymentData.amountPaid,
        paymentDate: paymentData.paymentDate,
        paymentMode: paymentData.paymentMode,
        transactionReference: paymentData.transactionReference,
        receivedBy: paymentData.receivedBy,
        notes: paymentData.notes,
      },
    });

    return newPayment;
  };

  const deletePayment = (id: string) => {
    console.log('[PGContext] deletePayment called:', id);
  };

  // Actions: Electricity
  const logElectricityReading = (
    recordData: Omit<ElectricityRecord, 'id'>
  ): ElectricityRecord => {
    const tempId = `elec-${Date.now()}`;
    const newRecord: ElectricityRecord = {
      ...recordData,
      id: tempId,
    };

    createElectricityMutation.mutate({
      data: {
        roomId: recordData.roomId,
        month: recordData.month,
        readingDate: recordData.readingDate,
        previousReading: recordData.previousReading,
        currentReading: recordData.currentReading,
        ratePerUnit: recordData.ratePerUnit,
        notes: recordData.notes,
      },
    });

    return newRecord;
  };

  const deleteElectricityRecord = (id: string) => {
    console.log('[PGContext] deleteElectricityRecord called:', id);
  };

  const resetToSampleData = async () => {
    console.log('[PGContext] resetToSampleData called');
  };

  const exportDataJson = () => {
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        buildings,
        rooms,
        tenants,
        payments,
        electricityRecords,
      },
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `staysync_pg_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJson = (_jsonData: string): boolean => {
    return false;
  };

  return (
    <PGContext.Provider
      value={{
        buildings,
        rooms,
        tenants,
        coOccupants: localCoOccupants,
        payments,
        electricityRecords,
        isDbReady: !buildingsQuery.isLoading,
        dbEngineName: 'Next.js Backend (Chunked Local JSON Database)',
        lastSyncTime: new Date().toLocaleTimeString('en-IN'),
        selectedBuildingId,
        setSelectedBuildingId,
        selectedBuilding,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        receiptToView,
        setReceiptToView,
        tenantToView,
        setTenantToView,
        coOccupantToViewAadhaar,
        setCoOccupantToViewAadhaar,
        isRentModalOpen,
        setIsRentModalOpen,
        rentModalPreselectedTenantId,
        setRentModalPreselectedTenantId,
        openRentModal,
        closeRentModal,
        stats,
        overdueList,
        addBuilding,
        updateBuilding,
        deleteBuilding,
        addRoom,
        updateRoom,
        deleteRoom,
        updateRoomStatus,
        assignPrimaryTenant,
        vacateRoom,
        addTenant,
        updateTenant,
        vacateTenant,
        addTenantDocument,
        updateDocumentStatus,
        addCoOccupant,
        updateCoOccupant,
        deleteCoOccupant,
        getCoOccupantsForRoom,
        getCoOccupantsForTenant,
        recordRentPayment,
        deletePayment,
        logElectricityReading,
        deleteElectricityRecord,
        resetToSampleData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </PGContext.Provider>
  );
};

export const usePG = () => {
  const context = useContext(PGContext);
  if (!context) {
    throw new Error('usePG must be used within a PGProvider');
  }
  return context;
};
