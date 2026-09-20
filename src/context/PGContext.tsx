import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Building, 
  Room, 
  Tenant, 
  CoOccupant,
  RentPayment, 
  ElectricityRecord, 
  OverdueSummary, 
  DashboardStats 
} from '../types';
import { 
  INITIAL_BUILDINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_CO_OCCUPANTS,
  INITIAL_RENT_PAYMENTS, 
  INITIAL_ELECTRICITY_RECORDS 
} from '../data/initialData';
import { getDatabaseAdapter, exportDatabaseBackup, importDatabaseBackup } from '../db';
import { useAuth } from './AuthContext';

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
  addTenant: (tenant: Omit<Tenant, 'id'>, initialCoOccupants?: Array<Omit<CoOccupant, 'id' | 'createdAt' | 'tenantId' | 'roomId'>>) => Tenant;
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
  const db = useMemo(() => getDatabaseAdapter(), []);
  const { currentUser } = useAuth();
  const currentOwnerId = currentUser?.id || '';

  const [isDbReady, setIsDbReady] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Initializing...');

  // 1. Core State (Raw Database Rows)
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [coOccupants, setCoOccupants] = useState<CoOccupant[]>(INITIAL_CO_OCCUPANTS);
  const [payments, setPayments] = useState<RentPayment[]>(INITIAL_RENT_PAYMENTS);
  const [electricityRecords, setElectricityRecords] = useState<ElectricityRecord[]>(INITIAL_ELECTRICITY_RECORDS);

  // UI state
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [receiptToView, setReceiptToView] = useState<RentPayment | null>(null);
  const [tenantToView, setTenantToView] = useState<Tenant | null>(null);
  const [coOccupantToViewAadhaar, setCoOccupantToViewAadhaar] = useState<CoOccupant | null>(null);

  // Initialize IndexedDB on mount and load data
  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      try {
        await db.init();

        const [
          dbBuildings,
          dbRooms,
          dbTenants,
          dbCoOccupants,
          dbPayments,
          dbElectricity
        ] = await Promise.all([
          db.getAll<Building>('buildings'),
          db.getAll<Room>('rooms'),
          db.getAll<Tenant>('tenants'),
          db.getAll<CoOccupant>('coOccupants'),
          db.getAll<RentPayment>('payments'),
          db.getAll<ElectricityRecord>('electricityRecords')
        ]);

        if (!isMounted) return;

        // If IndexedDB is empty, seed it with initial rich mock data
        if (dbBuildings.length === 0 && dbRooms.length === 0) {
          console.log('[IndexedDB] Seeding database with initial PG data...');
          await Promise.all([
            db.bulkPut('buildings', INITIAL_BUILDINGS),
            db.bulkPut('rooms', INITIAL_ROOMS),
            db.bulkPut('tenants', INITIAL_TENANTS),
            db.bulkPut('coOccupants', INITIAL_CO_OCCUPANTS),
            db.bulkPut('payments', INITIAL_RENT_PAYMENTS),
            db.bulkPut('electricityRecords', INITIAL_ELECTRICITY_RECORDS)
          ]);

          setBuildings(INITIAL_BUILDINGS);
          setRooms(INITIAL_ROOMS);
          setTenants(INITIAL_TENANTS);
          setCoOccupants(INITIAL_CO_OCCUPANTS);
          setPayments(INITIAL_RENT_PAYMENTS);
          setElectricityRecords(INITIAL_ELECTRICITY_RECORDS);
          setSelectedBuildingId(INITIAL_BUILDINGS[0]?.id || '');
        } else {
          // Load stored records from IndexedDB and ensure ownerId is populated
          console.log('[IndexedDB] Loaded existing data from browser IndexedDB.');
          const sanitizedBuildings = dbBuildings.map(b => {
            if (!b.ownerId) {
              if (b.id === 'bld-3') return { ...b, ownerId: 'user_owner_02' };
              return { ...b, ownerId: 'user_owner_01' };
            }
            return b;
          });
          setBuildings(sanitizedBuildings);
          setRooms(dbRooms);
          setTenants(dbTenants);
          setCoOccupants(dbCoOccupants);
          setPayments(dbPayments);
          setElectricityRecords(dbElectricity);
        }

        setIsDbReady(true);
        setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('[IndexedDB] Error initializing database:', err);
        setIsDbReady(true);
      }
    }

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, [db]);

  // 2. Strict Owner-Specific Data Isolation
  // Multi-tenant boundary: each PG Owner only accesses their own buildings, rooms, tenants, coOccupants, payments, and electricity records
  const ownerBuildings = useMemo(() => {
    if (!currentOwnerId) return [];
    return buildings.filter(b => b.ownerId === currentOwnerId || (!b.ownerId && currentOwnerId === 'user_owner_01'));
  }, [buildings, currentOwnerId]);

  const ownerBuildingIds = useMemo(() => new Set(ownerBuildings.map(b => b.id)), [ownerBuildings]);

  const ownerRooms = useMemo(() => {
    return rooms.filter(r => ownerBuildingIds.has(r.buildingId));
  }, [rooms, ownerBuildingIds]);

  const ownerRoomIds = useMemo(() => new Set(ownerRooms.map(r => r.id)), [ownerRooms]);

  const ownerTenants = useMemo(() => {
    return tenants.filter(t => ownerBuildingIds.has(t.buildingId));
  }, [tenants, ownerBuildingIds]);

  const ownerCoOccupants = useMemo(() => {
    return coOccupants.filter(co => ownerRoomIds.has(co.roomId));
  }, [coOccupants, ownerRoomIds]);

  const ownerPayments = useMemo(() => {
    return payments.filter(p => ownerBuildingIds.has(p.buildingId));
  }, [payments, ownerBuildingIds]);

  const ownerElectricityRecords = useMemo(() => {
    return electricityRecords.filter(e => ownerRoomIds.has(e.roomId));
  }, [electricityRecords, ownerRoomIds]);

  // Sync selected building whenever owner changes or their properties change
  useEffect(() => {
    if (ownerBuildings.length === 0) {
      setSelectedBuildingId('');
    } else if (selectedBuildingId === 'all') {
      // Retain 'all' buildings view for this owner
    } else if (!ownerBuildings.some(b => b.id === selectedBuildingId)) {
      // Default to the first building of the current owner
      setSelectedBuildingId(ownerBuildings[0].id);
    }
  }, [ownerBuildings, selectedBuildingId, currentOwnerId]);

  // Active Selected Building (scoped to owner)
  const selectedBuilding = useMemo(() => {
    if (!selectedBuildingId || selectedBuildingId === 'all') return undefined;
    return ownerBuildings.find(b => b.id === selectedBuildingId);
  }, [ownerBuildings, selectedBuildingId]);

  // Filtered lists based on selectedBuildingId within owner's portfolio
  const currentBuildings = useMemo(() => {
    if (!selectedBuildingId || selectedBuildingId === 'all') return ownerBuildings;
    return ownerBuildings.filter(b => b.id === selectedBuildingId);
  }, [ownerBuildings, selectedBuildingId]);

  const currentRooms = useMemo(() => {
    if (!selectedBuildingId || selectedBuildingId === 'all') return ownerRooms;
    return ownerRooms.filter(r => r.buildingId === selectedBuildingId);
  }, [ownerRooms, selectedBuildingId]);

  const currentTenants = useMemo(() => {
    if (!selectedBuildingId || selectedBuildingId === 'all') return ownerTenants;
    return ownerTenants.filter(t => t.buildingId === selectedBuildingId);
  }, [ownerTenants, selectedBuildingId]);

  const currentPayments = useMemo(() => {
    if (!selectedBuildingId || selectedBuildingId === 'all') return ownerPayments;
    return ownerPayments.filter(p => p.buildingId === selectedBuildingId);
  }, [ownerPayments, selectedBuildingId]);

  // Automated Overdue Calculation
  const currentMonthStr = '2026-09';
  const currentDateDay = 18; // Simulated Sep 18, 2026

  const overdueList: OverdueSummary[] = useMemo(() => {
    const list: OverdueSummary[] = [];

    currentTenants.forEach(tenant => {
      if (tenant.status === 'vacated') return;

      const building = ownerBuildings.find(b => b.id === tenant.buildingId);
      const room = ownerRooms.find(r => r.id === tenant.roomId);

      if (!building || !room) return;

      const dueDay = building.billingDueDay || 5;
      const dueDateStr = `${currentMonthStr}-${String(dueDay).padStart(2, '0')}`;

      // Check payments made by this tenant for current month
      const tenantPaymentsThisMonth = ownerPayments.filter(
        p => p.tenantId === tenant.id && p.billingMonth === currentMonthStr
      );

      const totalPaidThisMonth = tenantPaymentsThisMonth.reduce((acc, p) => acc + p.amountPaid, 0);

      // Check electricity share for this tenant
      const tenantElecRecords = ownerElectricityRecords.filter(
        e => e.roomId === tenant.roomId && e.month === currentMonthStr && e.billedTenantIds.includes(tenant.id)
      );
      const elecShare = tenantElecRecords.reduce((acc, e) => acc + e.amountPerTenant, 0);

      const expectedRent = tenant.monthlyRent;
      const expectedTotal = expectedRent + elecShare;

      const balanceRemaining = Math.max(0, expectedTotal - totalPaidThisMonth);

      // If today is past due date and balance is > 0
      if (currentDateDay > dueDay && balanceRemaining > 0) {
        const daysOverdue = currentDateDay - dueDay;
        list.push({
          tenant,
          building,
          room,
          billingMonth: currentMonthStr,
          dueDate: dueDateStr,
          daysOverdue,
          overdueRent: Math.max(0, expectedRent - totalPaidThisMonth),
          overdueElectricity: Math.max(0, balanceRemaining - Math.max(0, expectedRent - totalPaidThisMonth)),
          totalOverdue: balanceRemaining,
          notes: tenant.notes
        });
      }
    });

    // Sort by days overdue descending
    return list.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [currentTenants, ownerBuildings, ownerRooms, ownerPayments, ownerElectricityRecords]);

  // Dashboard Stats calculation (based on single rooms with multiple allowed occupants)
  const stats: DashboardStats = useMemo(() => {
    let totalRooms = currentRooms.length;
    let occupiedRooms = 0;
    let vacantRooms = 0;
    let maintenanceRooms = 0;
    let totalAllowedCapacity = 0;

    currentRooms.forEach(room => {
      totalAllowedCapacity += room.capacity;
      if (room.status === 'occupied') occupiedRooms++;
      else if (room.status === 'vacant') vacantRooms++;
      else if (room.status === 'maintenance') maintenanceRooms++;
    });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Total residents: active primary tenants in scope + co-occupants in those rooms
    const activeTenantsInScope = currentTenants.filter(t => t.status !== 'vacated');
    const activeRoomIds = new Set(currentRooms.map(r => r.id));
    const activeCoOccupantsInScope = ownerCoOccupants.filter(co => activeRoomIds.has(co.roomId));
    const totalResidents = activeTenantsInScope.length + activeCoOccupantsInScope.length;

    // Expected Revenue this month: sum of monthlyRent of all active tenants in current scope + electricity
    const expectedRentRevenue = activeTenantsInScope.reduce((acc, t) => acc + t.monthlyRent, 0);
    
    // Electricity billed in current month
    const currentMonthElec = ownerElectricityRecords
      .filter(e => currentRooms.some(r => r.id === e.roomId) && e.month === currentMonthStr)
      .reduce((acc, e) => acc + e.totalAmount, 0);

    const expectedRevenue = expectedRentRevenue + currentMonthElec;

    // Collected revenue this month
    const collectedRevenue = currentPayments
      .filter(p => p.billingMonth === currentMonthStr)
      .reduce((acc, p) => acc + p.amountPaid, 0);

    const totalOverdueAmount = overdueList.reduce((acc, item) => acc + item.totalOverdue, 0);
    const overdueTenantsCount = overdueList.length;

    const electricityCollected = currentPayments
      .filter(p => p.billingMonth === currentMonthStr)
      .reduce((acc, p) => acc + p.electricityAmount, 0);

    return {
      totalBuildings: currentBuildings.length,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      totalResidents,
      totalAllowedCapacity,
      occupancyRate,
      expectedRevenue,
      collectedRevenue,
      totalOverdueAmount,
      overdueTenantsCount,
      electricityCollected
    };
  }, [currentBuildings, currentRooms, currentTenants, ownerCoOccupants, currentPayments, ownerElectricityRecords, overdueList]);

  // Actions: Buildings
  const addBuilding = (buildingData: Omit<Building, 'id' | 'createdAt' | 'ownerId'> & { ownerId?: string }): Building => {
    const newBuilding: Building = {
      ...buildingData,
      id: `bld-${Date.now()}`,
      ownerId: buildingData.ownerId || currentOwnerId || 'user_owner_01',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBuildings(prev => [...prev, newBuilding]);
    db.create('buildings', newBuilding).catch(console.error);
    setSelectedBuildingId(newBuilding.id);
    return newBuilding;
  };

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    db.update('buildings', id, updates).catch(console.error);
  };

  const deleteBuilding = (id: string) => {
    setBuildings(prev => prev.filter(b => b.id !== id));
    setRooms(prev => prev.filter(r => r.buildingId !== id));
    setTenants(prev => prev.filter(t => t.buildingId !== id));
    setPayments(prev => prev.filter(p => p.buildingId !== id));
    db.delete('buildings', id).catch(console.error);
    if (selectedBuildingId === id) {
      const remaining = ownerBuildings.filter(b => b.id !== id);
      setSelectedBuildingId(remaining[0]?.id || (remaining.length > 0 ? 'all' : ''));
    }
  };

  // Actions: Rooms
  const addRoom = (roomData: Omit<Room, 'id'>): Room => {
    const newRoom: Room = {
      ...roomData,
      id: `rm-${Date.now()}`
    };
    setRooms(prev => [...prev, newRoom]);
    db.create('rooms', newRoom).catch(console.error);
    return newRoom;
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    db.update('rooms', id, updates).catch(console.error);
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    db.delete('rooms', id).catch(console.error);
  };

  const updateRoomStatus = (roomId: string, status: Room['status'], reason?: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        status,
        maintenanceReason: reason,
        primaryTenantId: status === 'vacant' || status === 'maintenance' ? undefined : room.primaryTenantId
      };
    }));

    db.update('rooms', roomId, {
      status,
      maintenanceReason: reason,
      primaryTenantId: status === 'vacant' || status === 'maintenance' ? undefined : undefined
    }).catch(console.error);
  };

  const assignPrimaryTenant = (roomId: string, tenantId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        status: 'occupied',
        primaryTenantId: tenantId
      };
    }));
    db.update('rooms', roomId, { status: 'occupied', primaryTenantId: tenantId }).catch(console.error);
  };

  const vacateRoom = (roomId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        status: 'vacant',
        primaryTenantId: undefined
      };
    }));
    db.update('rooms', roomId, { status: 'vacant', primaryTenantId: undefined }).catch(console.error);
  };

  // Actions: Tenants
  const addTenant = (
    tenantData: Omit<Tenant, 'id'>, 
    initialCoOccupants?: Array<Omit<CoOccupant, 'id' | 'createdAt' | 'tenantId' | 'roomId'>>
  ): Tenant => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `t-${Date.now()}`
    };

    setTenants(prev => [...prev, newTenant]);
    db.create('tenants', newTenant).catch(console.error);

    // Assign tenant to the room
    assignPrimaryTenant(newTenant.roomId, newTenant.id);

    // Add any initial co-occupants if provided
    if (initialCoOccupants && initialCoOccupants.length > 0) {
      initialCoOccupants.forEach(co => {
        addCoOccupant({
          ...co,
          roomId: newTenant.roomId,
          tenantId: newTenant.id
        });
      });
    }

    return newTenant;
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    db.update('tenants', id, updates).catch(console.error);
  };

  const vacateTenant = (tenantId: string, refundDeposit: boolean = true) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    // Free the room
    vacateRoom(tenant.roomId);

    // Update tenant status
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return {
        ...t,
        status: 'vacated',
        expectedCheckOutDate: new Date().toISOString().split('T')[0],
        depositStatus: refundDeposit ? 'refunded' : t.depositStatus
      };
    }));

    db.update('tenants', tenantId, {
      status: 'vacated',
      expectedCheckOutDate: new Date().toISOString().split('T')[0],
      depositStatus: refundDeposit ? 'refunded' : tenant.depositStatus
    }).catch(console.error);
  };

  const addTenantDocument = (tenantId: string, document: Omit<Tenant['documents'][0], 'id' | 'uploadDate'>) => {
    const newDoc = {
      ...document,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };

    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      const updatedDocs = [...t.documents, newDoc];
      db.update('tenants', tenantId, { documents: updatedDocs }).catch(console.error);
      return {
        ...t,
        documents: updatedDocs
      };
    }));
  };

  const updateDocumentStatus = (tenantId: string, docId: string, status: 'verified' | 'pending' | 'rejected') => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      const updatedDocs = t.documents.map(d => d.id === docId ? { ...d, status } : d);
      db.update('tenants', tenantId, { documents: updatedDocs }).catch(console.error);
      return {
        ...t,
        documents: updatedDocs
      };
    }));
  };

  // Actions: Co-Occupants / Room Guests
  const addCoOccupant = (data: Omit<CoOccupant, 'id' | 'createdAt'>): CoOccupant => {
    const newCo: CoOccupant = {
      ...data,
      id: `co-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

    setCoOccupants(prev => [...prev, newCo]);
    db.create('coOccupants', newCo).catch(console.error);
    return newCo;
  };

  const updateCoOccupant = (id: string, updates: Partial<CoOccupant>) => {
    setCoOccupants(prev => prev.map(co => co.id === id ? { ...co, ...updates } : co));
    db.update('coOccupants', id, updates).catch(console.error);
  };

  const deleteCoOccupant = (id: string) => {
    setCoOccupants(prev => prev.filter(co => co.id !== id));
    db.delete('coOccupants', id).catch(console.error);
  };

  const getCoOccupantsForRoom = (roomId: string): CoOccupant[] => {
    return ownerCoOccupants.filter(co => co.roomId === roomId);
  };

  const getCoOccupantsForTenant = (tenantId: string): CoOccupant[] => {
    return ownerCoOccupants.filter(co => co.tenantId === tenantId);
  };

  // Actions: Rent & Payments
  const recordRentPayment = (paymentData: Omit<RentPayment, 'id' | 'receiptNumber' | 'createdAt'>): RentPayment => {
    const count = payments.length + 1;
    const yearMonth = paymentData.billingMonth.replace('-', '');
    const receiptNumber = `RCP-${yearMonth}-${String(count).padStart(3, '0')}`;

    const newPayment: RentPayment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);
    db.create('payments', newPayment).catch(console.error);
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    db.delete('payments', id).catch(console.error);
  };

  // Actions: Electricity
  const logElectricityReading = (recordData: Omit<ElectricityRecord, 'id'>): ElectricityRecord => {
    const newRecord: ElectricityRecord = {
      ...recordData,
      id: `elec-${Date.now()}`
    };

    setElectricityRecords(prev => [newRecord, ...prev]);
    db.create('electricityRecords', newRecord).catch(console.error);

    // Also update room's lastMeterReading and lastMeterReadingDate
    updateRoom(recordData.roomId, {
      lastMeterReading: recordData.currentReading,
      lastMeterReadingDate: recordData.readingDate
    });

    return newRecord;
  };

  const deleteElectricityRecord = (id: string) => {
    setElectricityRecords(prev => prev.filter(e => e.id !== id));
    db.delete('electricityRecords', id).catch(console.error);
  };

  // Utilities
  const resetToSampleData = async () => {
    try {
      await Promise.all([
        db.clear('buildings'),
        db.clear('rooms'),
        db.clear('tenants'),
        db.clear('coOccupants'),
        db.clear('payments'),
        db.clear('electricityRecords')
      ]);

      await Promise.all([
        db.bulkPut('buildings', INITIAL_BUILDINGS),
        db.bulkPut('rooms', INITIAL_ROOMS),
        db.bulkPut('tenants', INITIAL_TENANTS),
        db.bulkPut('coOccupants', INITIAL_CO_OCCUPANTS),
        db.bulkPut('payments', INITIAL_RENT_PAYMENTS),
        db.bulkPut('electricityRecords', INITIAL_ELECTRICITY_RECORDS)
      ]);

      setBuildings(INITIAL_BUILDINGS);
      setRooms(INITIAL_ROOMS);
      setTenants(INITIAL_TENANTS);
      setCoOccupants(INITIAL_CO_OCCUPANTS);
      setPayments(INITIAL_RENT_PAYMENTS);
      setElectricityRecords(INITIAL_ELECTRICITY_RECORDS);
      setSelectedBuildingId(INITIAL_BUILDINGS[0]?.id || '');
      setLastSyncTime(new Date().toLocaleTimeString('en-IN'));
    } catch (e) {
      console.error('Error resetting sample data:', e);
    }
  };

  const exportDataJson = async () => {
    try {
      const backup = await exportDatabaseBackup(db);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `staysync_pg_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Error exporting backup:', e);
    }
  };

  const importDataJson = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.data) {
        importDatabaseBackup(parsed, db).then(() => {
          if (parsed.data.buildings) setBuildings(parsed.data.buildings);
          if (parsed.data.rooms) setRooms(parsed.data.rooms);
          if (parsed.data.tenants) setTenants(parsed.data.tenants);
          if (parsed.data.coOccupants) setCoOccupants(parsed.data.coOccupants);
          if (parsed.data.payments) setPayments(parsed.data.payments);
          if (parsed.data.electricityRecords) setElectricityRecords(parsed.data.electricityRecords);
          setLastSyncTime(new Date().toLocaleTimeString('en-IN'));
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <PGContext.Provider value={{
      buildings: ownerBuildings,
      rooms: ownerRooms,
      tenants: ownerTenants,
      coOccupants: ownerCoOccupants,
      payments: ownerPayments,
      electricityRecords: ownerElectricityRecords,
      isDbReady,
      dbEngineName: db.name,
      lastSyncTime,
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
      importDataJson
    }}>
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
