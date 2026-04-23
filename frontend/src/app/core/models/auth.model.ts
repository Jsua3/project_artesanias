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
  courierMode?: CourierMode | null;
  courierCompany?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: UserRole;
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
  createdAt?: string;
  approvedAt?: string;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ArtisanReviewRequest {
  decision: 'APPROVED' | 'REJECTED';
}
