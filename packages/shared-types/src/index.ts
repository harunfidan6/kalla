export enum Role {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  SHIFT_LEAD = 'shift_lead',
  ADMIN = 'admin',
}

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  RECEIVED = 'received',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  PICKUP = 'pickup',
  TAKEAWAY = 'takeaway',
}

export enum PaymentStatus {
  PAID_ONLINE = 'paid_online',
  PAY_AT_COUNTER = 'pay_at_counter',
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ShiftChangeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TrainingProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

export interface BranchDto {
  id: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export interface UserDto {
  id: string;
  email: string;
  phone: string;
  role: Role;
  fullName: string;
  branchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
