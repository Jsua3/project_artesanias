import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApprovalStatus,
  ArtisanReviewRequest,
  AuthResponse,
  LoginRequest,
  ProfileUpdateRequest,
  RegisterClienteRequest,
  RegisterRequest,
  UserProfile,
  UserRole
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/api/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<UserProfile | null>(this.loadStoredUser());

  private loadStoredUser(): UserProfile | null {
    const stored = localStorage.getItem('user');
    if (!stored) {
      return null;
    }

    return this.normalizeProfile(JSON.parse(stored) as UserProfile);
  }

  private normalizeRole(role: UserRole): UserRole {
    // OPERATOR y MAESTRO son alias históricos — el rol canónico es ARTESANO
    if (role === 'OPERATOR' || (role as string) === 'MAESTRO') return 'ARTESANO';
    return role;
  }

  private normalizeProfile(profile: UserProfile): UserProfile {
    return {
      ...profile,
      role: this.normalizeRole(profile.role)
    };
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, req).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        const user = this.normalizeProfile({
          id: res.id,
          username: res.username,
          role: res.role,
          approvalStatus: 'APPROVED'
        });
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
        this.loadProfile();
      })
    );
  }

  register(req: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/register`, req);
  }

  registerCliente(req: RegisterClienteRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/register-cliente`, req);
  }

  logout(): void {
    localStorage.clear();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  homeRouteForCurrentUser(): string {
    switch (this.currentUser()?.role) {
      case 'CLIENTE':
        return '/';
      case 'DOMICILIARIO':
        return '/domiciliario/panel';
      case 'ADMIN':
      case 'ARTESANO':
      case 'OPERATOR':
        return '/dashboard';
      default:
        return '/login';
    }
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === this.normalizeRole(role);
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    const role = this.currentUser()?.role;
    return !!role && roles.map(item => this.normalizeRole(item)).includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isArtesano(): boolean {
    return this.hasRole('ARTESANO');
  }

  isCliente(): boolean {
    return this.hasRole('CLIENTE');
  }

  isDomiciliario(): boolean {
    return this.hasRole('DOMICILIARIO');
  }

  canManageProducts(): boolean {
    return this.hasAnyRole('ADMIN', 'ARTESANO');
  }

  canManageCatalog(): boolean {
    return this.hasRole('ADMIN');
  }

  canAccessOperations(): boolean {
    return this.hasAnyRole('ADMIN', 'ARTESANO');
  }

  canAccessReports(): boolean {
    return this.hasAnyRole('ADMIN', 'ARTESANO');
  }

  canManageDeliveries(): boolean {
    return this.hasAnyRole('ADMIN', 'DOMICILIARIO');
  }

  canApproveArtisans(): boolean {
    return this.hasRole('ADMIN');
  }

  getUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API}/users`);
  }

  getPendingArtisanRequests(): Observable<UserProfile[]> {
    return this.getPendingApprovalRequests();
  }

  reviewArtisanRequest(userId: string, decision: ApprovalStatus): Observable<UserProfile> {
    return this.reviewApprovalRequest(userId, decision);
  }

  getPendingApprovalRequests(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API}/approval-requests`);
  }

  reviewApprovalRequest(userId: string, decision: ApprovalStatus): Observable<UserProfile> {
    const payload: ArtisanReviewRequest = {
      decision: decision as 'APPROVED' | 'REJECTED'
    };
    return this.http.patch<UserProfile>(`${this.API}/approval-requests/${userId}`, payload);
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/me`);
  }

  loadProfile(): void {
    this.getMe().subscribe({
      next: (profile) => {
        const merged = this.normalizeProfile({
          ...this.currentUser(),
          ...profile
        } as UserProfile);
        localStorage.setItem('user', JSON.stringify(merged));
        this.currentUser.set(merged);
      },
      error: () => {
        const current = this.currentUser();
        if (current) {
          localStorage.setItem('user', JSON.stringify(current));
        }
      }
    });
  }

  updateProfile(req: ProfileUpdateRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API}/profile`, req).pipe(
      tap(profile => {
        const merged = this.normalizeProfile({ ...this.currentUser(), ...profile } as UserProfile);
        localStorage.setItem('user', JSON.stringify(merged));
        this.currentUser.set(merged);
      })
    );
  }
}
