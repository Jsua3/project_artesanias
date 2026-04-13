export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
