import {
  User,
  Building,
  Room,
  Tenant,
  CoOccupant,
  RentPayment,
  ElectricityRecord,
  DashboardStats,
  OverdueSummary,
  TenantDocument,
  OnboardingData,
  RoomStatus,
  TenantStatus,
  PaymentStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/v1';

export const TOKEN_STORAGE_KEY = 'staysync_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'staysync_refresh_token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  code: string;
  fields?: Record<string, string>;
  status: number;

  constructor(message: string, code: string = 'INTERNAL', status: number = 400, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getStoredAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError('Network connection failed. Please verify that the backend server is running.', 'NETWORK_ERROR', 0);
  }

  // Handle Token Expiry & Automatic Refresh
  if (res.status === 401 && retry) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            setStoredTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
            onRefreshed(refreshData.data.accessToken);
          } else {
            clearStoredTokens();
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        } catch {
          clearStoredTokens();
          window.dispatchEvent(new Event('auth:unauthorized'));
        } finally {
          isRefreshing = false;
        }
      }

      // Retry request once refresh completes
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async () => {
          try {
            const retried = await request<T>(endpoint, options, false);
            resolve(retried);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(`Request failed with status ${res.status}`, 'HTTP_ERROR', res.status);
    }
    return {} as T;
  }

  if (!res.ok || json.success === false) {
    const errObj = json?.error || {};
    throw new ApiError(
      errObj.message || `Request failed (${res.status})`,
      errObj.code || 'UNKNOWN_ERROR',
      res.status,
      errObj.fields
    );
  }

  return json.data as T;
}

// ---------------- API Methods ----------------

export const api = {
  auth: {
    register: (data: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      businessName?: string;
    }) =>
      request<{ user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(data) }
      ),

    login: (emailOrPhone: string, password: string) =>
      request<{ user: User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ emailOrPhone, password }) }
      ),

    refresh: (refreshToken: string) =>
      request<{ accessToken: string; refreshToken: string; expiresIn: number }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    logout: (refreshToken?: string) =>
      request<{ loggedOut: boolean }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshToken || getStoredRefreshToken() }),
      }),

    me: () => request<{ user: User }>('/auth/me'),

    forgotPassword: (emailOrPhone: string) =>
      request<{ sent: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone }),
      }),

    resetPassword: (emailOrPhone: string, otp: string, newPassword: string) =>
      request<{ reset: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, otp, newPassword }),
      }),
  },

  account: {
    updateProfile: (data: Partial<User>) =>
      request<{ user: User }>('/account', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    updateBank: (data: {
      upiId: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    }) =>
      request<{ user: User }>('/account/bank', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  onboarding: {
    complete: (data: OnboardingData) => {
      const payload: any = {
        businessName: data.businessName,
        businessType: data.businessType,
        city: data.city,
        phone: data.phone,
        upiId: data.upiId,
        buildingName: data.buildingName,
        buildingCode: data.buildingCode,
        address: data.address,
        billingDueDay: data.billingDueDay,
        electricityRatePerUnit: data.electricityRatePerUnit,
        totalFloors: data.totalFloors,
        roomsPerFloor: data.roomsPerFloor,
        roomCapacity: data.roomCapacity,
        defaultBaseRent: data.defaultBaseRent,
        amenities: data.amenities,
        intakeMode: data.seedSampleData ? 'sample' : data.addInitialTenant ? 'custom' : 'empty',
      };

      if (data.addInitialTenant && !data.seedSampleData) {
        payload.initialTenant = {
          fullName: data.initialTenantName || 'Aditya Nair',
          phone: data.initialTenantPhone || '9876500111',
          email: data.initialTenantEmail || '',
          monthlyRent: data.initialTenantRent || data.defaultBaseRent,
          securityDeposit: data.initialTenantDeposit ?? data.defaultBaseRent * 2,
        };
      }

      return request<{
        user: User;
        building: Building;
        rooms: Room[];
        tenant: Tenant | null;
      }>('/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  buildings: {
    list: (page = 1, pageSize = 100) =>
      request<{ buildings: Building[] }>(`/buildings?page=${page}&pageSize=${pageSize}`),

    get: (id: string) => request<{ building: Building }>(`/buildings/${id}`),

    create: (data: Partial<Building>) =>
      request<{ building: Building }>('/buildings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Building>) =>
      request<{ building: Building }>(`/buildings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean; id: string }>(`/buildings/${id}`, {
        method: 'DELETE',
      }),
  },

  rooms: {
    list: (filters?: { buildingId?: string; status?: RoomStatus; floor?: number; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.buildingId && filters.buildingId !== 'all') params.set('buildingId', filters.buildingId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.floor !== undefined) params.set('floor', String(filters.floor));
      if (filters?.search) params.set('search', filters.search);
      params.set('pageSize', '100');
      return request<{ rooms: Room[] }>(`/rooms?${params.toString()}`);
    },

    get: (id: string) => request<{ room: Room }>(`/rooms/${id}`),

    create: (data: Partial<Room>) =>
      request<{ room: Room }>('/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Room>) =>
      request<{ room: Room }>(`/rooms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean; id: string }>(`/rooms/${id}`, {
        method: 'DELETE',
      }),

    updateStatus: (id: string, status: RoomStatus, reason?: string) =>
      request<{ room: Room }>(`/rooms/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
  },

  tenants: {
    list: (filters?: { buildingId?: string; roomId?: string; status?: TenantStatus; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.buildingId && filters.buildingId !== 'all') params.set('buildingId', filters.buildingId);
      if (filters?.roomId) params.set('roomId', filters.roomId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      params.set('pageSize', '100');
      return request<{ tenants: Tenant[] }>(`/tenants?${params.toString()}`);
    },

    get: (id: string) => request<{ tenant: Tenant }>(`/tenants/${id}`),

    checkIn: (data: {
      buildingId: string;
      roomId: string;
      fullName: string;
      phone: string;
      email?: string;
      gender?: string;
      occupation?: string;
      workOrCollegeName?: string;
      permanentAddress?: string;
      emergencyContactName?: string;
      emergencyContactRelation?: string;
      emergencyContactPhone?: string;
      checkInDate: string;
      monthlyRent: number;
      securityDeposit: number;
      depositStatus: string;
      idProofNumber?: string;
      coOccupants?: any[];
    }) =>
      request<{ tenant: Tenant; room: Room; coOccupants: CoOccupant[] }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Tenant>) =>
      request<{ tenant: Tenant }>(`/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    notice: (id: string, expectedCheckOutDate: string) =>
      request<{ tenant: Tenant }>(`/tenants/${id}/notice`, {
        method: 'POST',
        body: JSON.stringify({ expectedCheckOutDate }),
      }),

    vacate: (id: string, refundDeposit = true) =>
      request<{ tenant: Tenant; room: Room }>(`/tenants/${id}/vacate`, {
        method: 'POST',
        body: JSON.stringify({ refundDeposit }),
      }),

    getDocuments: (id: string) =>
      request<{ documents: TenantDocument[] }>(`/tenants/${id}/documents`),

    uploadDocument: (id: string, formData: FormData) =>
      request<{ document: TenantDocument }>(`/tenants/${id}/documents`, {
        method: 'POST',
        body: formData,
      }),

    getDues: (id: string, billingMonth: string) =>
      request<{
        tenantId: string;
        billingMonth: string;
        monthlyRent: number;
        electricityShare: number;
        electricityUnits: number;
        electricityRecordId: string | null;
        alreadyPaid: number;
        totalPayable: number;
        balanceDue: number;
        dueDate: string;
        isOverdue: boolean;
        daysOverdue: number;
      }>(`/tenants/${id}/dues?billingMonth=${billingMonth}`),
  },

  coOccupants: {
    list: (filters: { roomId?: string; tenantId?: string }) => {
      const params = new URLSearchParams();
      if (filters.roomId) params.set('roomId', filters.roomId);
      if (filters.tenantId) params.set('tenantId', filters.tenantId);
      return request<{ coOccupants: CoOccupant[] }>(`/co-occupants?${params.toString()}`);
    },

    create: (data: Partial<CoOccupant>) =>
      request<{ coOccupant: CoOccupant }>('/co-occupants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<CoOccupant>) =>
      request<{ coOccupant: CoOccupant }>(`/co-occupants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ deleted: boolean; id: string }>(`/co-occupants/${id}`, {
        method: 'DELETE',
      }),

    uploadAadhaar: (id: string, formData: FormData) =>
      request<{ coOccupant: CoOccupant }>(`/co-occupants/${id}/aadhaar`, {
        method: 'POST',
        body: formData,
      }),
  },

  payments: {
    list: (filters?: { buildingId?: string; tenantId?: string; billingMonth?: string; status?: PaymentStatus }) => {
      const params = new URLSearchParams();
      if (filters?.buildingId && filters.buildingId !== 'all') params.set('buildingId', filters.buildingId);
      if (filters?.tenantId) params.set('tenantId', filters.tenantId);
      if (filters?.billingMonth) params.set('billingMonth', filters.billingMonth);
      if (filters?.status) params.set('status', filters.status);
      params.set('pageSize', '100');
      return request<{ payments: RentPayment[] }>(`/payments?${params.toString()}`);
    },

    get: (id: string) => request<{ payment: RentPayment }>(`/payments/${id}`),

    create: (data: any, idempotencyKey?: string) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      return request<{ payment: RentPayment }>('/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
    },
  },

  electricity: {
    list: (filters?: { buildingId?: string; roomId?: string; month?: string }) => {
      const params = new URLSearchParams();
      if (filters?.buildingId && filters.buildingId !== 'all') params.set('buildingId', filters.buildingId);
      if (filters?.roomId) params.set('roomId', filters.roomId);
      if (filters?.month) params.set('month', filters.month);
      params.set('pageSize', '100');
      return request<{ records: ElectricityRecord[] }>(`/electricity?${params.toString()}`);
    },

    create: (data: any, idempotencyKey?: string) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      return request<{ record: ElectricityRecord; room: Room }>('/electricity', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
    },
  },

  analytics: {
    getDashboard: (buildingId?: string, month?: string) => {
      const params = new URLSearchParams();
      if (buildingId && buildingId !== 'all') params.set('buildingId', buildingId);
      if (month) params.set('month', month);
      return request<{ month: string; buildingId: string | null; stats: DashboardStats }>(
        `/dashboard?${params.toString()}`
      );
    },

    getOverdue: (buildingId?: string, month?: string) => {
      const params = new URLSearchParams();
      if (buildingId && buildingId !== 'all') params.set('buildingId', buildingId);
      if (month) params.set('month', month);
      return request<{ month: string; asOf: string; items: OverdueSummary[] }>(
        `/overdue?${params.toString()}`
      );
    },
  },
};
