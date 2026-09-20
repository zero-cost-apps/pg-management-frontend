import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { api } from './client';
import {
  Building,
  Room,
  Tenant,
  CoOccupant,
  RentPayment,
  ElectricityRecord,
  RoomStatus,
  TenantStatus,
  PaymentStatus,
} from '../types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// ---------------- Buildings ----------------

export function useBuildingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const res = await api.buildings.list();
      return res.buildings;
    },
    enabled,
  });
}

export function useCreateBuildingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Building>) => api.buildings.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBuildingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Building> }) =>
      api.buildings.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteBuildingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.buildings.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------------- Rooms ----------------

export function useRoomsQuery(filters?: { buildingId?: string; status?: RoomStatus; floor?: number; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ['rooms', filters?.buildingId || 'all', filters?.status, filters?.floor, filters?.search],
    queryFn: async () => {
      const res = await api.rooms.list(filters);
      return res.rooms;
    },
    enabled,
  });
}

export function useCreateRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Room>) => api.rooms.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Room> }) =>
      api.rooms.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rooms.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRoomStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: RoomStatus; reason?: string }) =>
      api.rooms.updateStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------------- Tenants ----------------

export function useTenantsQuery(filters?: { buildingId?: string; roomId?: string; status?: TenantStatus; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ['tenants', filters?.buildingId || 'all', filters?.roomId, filters?.status, filters?.search],
    queryFn: async () => {
      const res = await api.tenants.list(filters);
      return res.tenants;
    },
    enabled,
  });
}

export function useCheckInTenantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.tenants.checkIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['coOccupants'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTenantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tenant> }) =>
      api.tenants.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useTenantNoticeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expectedCheckOutDate }: { id: string; expectedCheckOutDate: string }) =>
      api.tenants.notice(id, expectedCheckOutDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useTenantVacateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, refundDeposit }: { id: string; refundDeposit?: boolean }) =>
      api.tenants.vacate(id, refundDeposit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['coOccupants'] });
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['overdue'] });
    },
  });
}

export function useUploadTenantDocMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.tenants.uploadDocument(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// ---------------- Co-Occupants ----------------

export function useCoOccupantsQuery(filters: { roomId?: string; tenantId?: string }, enabled = true) {
  return useQuery({
    queryKey: ['coOccupants', filters.roomId, filters.tenantId],
    queryFn: async () => {
      const res = await api.coOccupants.list(filters);
      return res.coOccupants;
    },
    enabled: enabled && (!!filters.roomId || !!filters.tenantId),
  });
}

export function useCreateCoOccupantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CoOccupant>) => api.coOccupants.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coOccupants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCoOccupantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CoOccupant> }) =>
      api.coOccupants.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coOccupants'] });
    },
  });
}

export function useDeleteCoOccupantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.coOccupants.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coOccupants'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ---------------- Payments ----------------

export function usePaymentsQuery(filters?: { buildingId?: string; tenantId?: string; billingMonth?: string; status?: PaymentStatus }, enabled = true) {
  return useQuery({
    queryKey: ['payments', filters?.buildingId || 'all', filters?.tenantId, filters?.billingMonth, filters?.status],
    queryFn: async () => {
      const res = await api.payments.list(filters);
      return res.payments;
    },
    enabled,
  });
}

export function useCreatePaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: any; idempotencyKey?: string }) =>
      api.payments.create(data, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['overdue'] });
    },
  });
}

// ---------------- Electricity ----------------

export function useElectricityQuery(filters?: { buildingId?: string; roomId?: string; month?: string }, enabled = true) {
  return useQuery({
    queryKey: ['electricity', filters?.buildingId || 'all', filters?.roomId, filters?.month],
    queryFn: async () => {
      const res = await api.electricity.list(filters);
      return res.records;
    },
    enabled,
  });
}

export function useCreateElectricityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, idempotencyKey }: { data: any; idempotencyKey?: string }) =>
      api.electricity.create(data, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['electricity'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['overdue'] });
    },
  });
}

// ---------------- Analytics ----------------

export function useDashboardQuery(buildingId?: string, month?: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', buildingId || 'all', month],
    queryFn: async () => {
      const res = await api.analytics.getDashboard(buildingId, month);
      return res.stats;
    },
    enabled,
  });
}

export function useOverdueQuery(buildingId?: string, month?: string, enabled = true) {
  return useQuery({
    queryKey: ['overdue', buildingId || 'all', month],
    queryFn: async () => {
      const res = await api.analytics.getOverdue(buildingId, month);
      return res.items;
    },
    enabled,
  });
}
