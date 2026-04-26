export type UserRole = 'ADMIN' | 'OPERATOR' | 'CLIENTE' | 'ARTESANO' | 'DOMICILIARIO';
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';
export type CourierMode = 'INDEPENDIENTE' | 'EMPRESA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
  displayName?: string;
  courierMode?: CourierMode | null;
  courierCompany?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: UserRole;
  id: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  courierMode?: CourierMode | null;
  courierCompany?: string | null;
  displayName?: string;
  avatarUrl?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  bio?: string | null;
  locality?: string | null;
  craftType?: string | null;
  address?: string | null;
  profileCompletion?: number;
  profileComplete?: boolean;
  createdAt?: string;
  approvedAt?: string;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  locality?: string;
  craftType?: string;
  address?: string;
}

export interface RegisterClienteRequest {
  displayName: string;
  username: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ArtisanReviewRequest {
  decision: 'APPROVED' | 'REJECTED';
}
