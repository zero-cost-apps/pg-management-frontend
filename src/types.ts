export type RoomTypeKey = 'single' | 'double' | 'triple' | 'four' | 'deluxe_studio';

export interface RoomTypeConfig {
  id: string;
  name: string;
  capacity: number;
  baseRent: number;
  description?: string;
}

export interface Building {
  id: string;
  ownerId: string; // PG Owner ID who owns this building
  name: string;
  code: string;
  address: string;
  city: string;
  totalFloors: number;
  electricityRatePerUnit: number; // e.g. 10.5
  billingDueDay: number; // e.g. 5th of month
  electricityBillingCycle: 'monthly' | 'bi-monthly';
  managerName: string;
  managerPhone: string;
  upiId?: string;
  amenities: string[];
  roomTypes: RoomTypeConfig[];
  rulesNotes?: string;
  createdAt: string;
}

export type RoomStatus = 'vacant' | 'occupied' | 'maintenance';

export interface Room {
  id: string;
  buildingId: string;
  roomNumber: string; // e.g. "101", "204"
  floor: number;
  roomTypeId: string;
  capacity: number; // Max number of people allowed in the room (e.g. 1, 2, 3, 4)
  baseRent: number; // monthly rent for the room
  status: RoomStatus;
  primaryTenantId?: string; // ID of current primary tenant if occupied
  maintenanceReason?: string;
  hasAttachedBathroom: boolean;
  hasAirConditioner: boolean;
  hasBalcony: boolean;
  meterNumber?: string;
  lastMeterReading?: number;
  lastMeterReadingDate?: string;
}

export type RelationshipType = 
  | 'Spouse' 
  | 'Brother' 
  | 'Sister' 
  | 'Friend' 
  | 'Colleague' 
  | 'Parent' 
  | 'Child' 
  | 'Relative' 
  | 'Roommate' 
  | 'Other';

export interface CoOccupant {
  id: string;
  roomId: string;
  tenantId: string; // Primary tenant this person lives with
  fullName: string;
  relationship: RelationshipType | string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  age?: number;
  occupation?: string;
  checkInDate: string;
  aadharNumber?: string;
  aadharDocName?: string; // e.g. "aadhar_card_rohan.pdf"
  aadharDocUrl?: string; // base64 or sample data URL
  notes?: string;
  createdAt: string;
}

export type DocType = 'aadhaar' | 'pan' | 'passport' | 'student_id' | 'employment_letter' | 'police_verification';
export type DocVerificationStatus = 'verified' | 'pending' | 'rejected';

export interface TenantDocument {
  id: string;
  type: DocType;
  title: string;
  documentNumber?: string;
  fileUrl?: string;
  fileName?: string;
  uploadDate: string;
  status: DocVerificationStatus;
  notes?: string;
}

export type TenantStatus = 'active' | 'notice_period' | 'vacated';

export interface Tenant {
  id: string;
  buildingId: string;
  roomId: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  occupation: string;
  workOrCollegeName?: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  
  // Lease & Billing
  checkInDate: string;
  expectedCheckOutDate?: string;
  noticeGivenDate?: string;
  status: TenantStatus;
  monthlyRent: number;
  securityDeposit: number;
  depositStatus: 'paid' | 'partial' | 'pending' | 'refunded';
  depositPaidAmount: number;

  documents: TenantDocument[];
  notes?: string;
}

export type PaymentMode = 'upi' | 'cash' | 'bank_transfer' | 'cheque' | 'card';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface RentPayment {
  id: string;
  receiptNumber: string;
  tenantId: string;
  tenantName: string;
  buildingId: string;
  buildingName: string;
  roomId: string;
  roomNumber: string;
  
  billingMonth: string; // "2026-09"
  billingPeriodStart: string;
  billingPeriodEnd: string;
  
  // Breakdown
  rentAmount: number;
  electricityAmount: number;
  electricityUnits?: number;
  maintenanceCharges: number;
  otherCharges: number;
  discount: number;
  
  totalPayable: number;
  amountPaid: number;
  balanceDue: number;
  
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  status: PaymentStatus;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ElectricityRecord {
  id: string;
  buildingId: string;
  roomId: string;
  roomNumber: string;
  month: string; // "2026-09"
  readingDate: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  splitCount: number; // number of occupants sharing
  amountPerTenant: number;
  status: 'logged' | 'billed' | 'collected';
  meterPhotoUrl?: string;
  notes?: string;
  billedTenantIds: string[];
}

export interface OverdueSummary {
  tenant: Tenant;
  building: Building;
  room: Room;
  billingMonth: string;
  dueDate: string;
  daysOverdue: number;
  overdueRent: number;
  overdueElectricity: number;
  totalOverdue: number;
  lastContactedDate?: string;
  notes?: string;
}

export interface DashboardStats {
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalResidents: number; // primary tenants + co-occupants
  totalAllowedCapacity: number;
  occupancyRate: number; // percentage of rooms occupied
  expectedRevenue: number;
  collectedRevenue: number;
  totalOverdueAmount: number;
  overdueTenantsCount: number;
  electricityCollected: number;
}

export type UserRole = 'owner';

export type SaasPlanTier = 'starter' | 'growth' | 'enterprise';

export interface SaasSubscription {
  planTier: SaasPlanTier;
  planName: string;
  status: 'active' | 'trial' | 'past_due';
  renewalDate: string;
  monthlyPrice: number;
  maxRooms: number;
  maxBuildings: number;
  features: string[];
}

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  upiId?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  businessName?: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  createdAt: string;
  subscription?: SaasSubscription;
  gstNumber?: string;
  businessAddress?: string;
  bankDetails?: BankDetails;
}

export interface OnboardingData {
  // Step 1: Business Profile
  businessName: string;
  businessType: 'mens_pg' | 'womens_pg' | 'coliving' | 'hostel';
  city: string;
  phone: string;
  upiId: string;
  
  // Step 2: Property & Floor / Rooms Setup
  buildingName: string;
  buildingCode: string;
  address: string;
  billingDueDay: number;
  electricityRatePerUnit: number;
  totalFloors: number;
  roomsPerFloor: number;
  roomCapacity: number;
  defaultBaseRent: number;
  amenities: string[];

  // Step 3: First Tenant / Resident Intake (Optional)
  addInitialTenant: boolean;
  initialTenantName?: string;
  initialTenantPhone?: string;
  initialTenantEmail?: string;
  initialTenantRent?: number;
  initialTenantDeposit?: number;
  initialTenantRoom?: string;
  seedSampleData?: boolean;
}
