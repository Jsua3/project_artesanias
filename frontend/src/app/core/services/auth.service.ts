import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterClienteRequest,
  UserProfile,
  ProfileUpdateRequest
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/api/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<UserProfile | null>(this.loadStoredUser());

  private loadStoredUser(): UserProfile | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, req).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        const user: UserProfile = { id: '', username: res.username, role: res.role };
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
        // Fetch full profile (with avatar, displayName)
        this.loadProfile();
      })
    );
  }

  register(req: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/register`, req);
  }

  /** Registro público de clientes finales (rol CLIENTE siempre). */
  registerCliente(req: RegisterClienteRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/register-cliente`, req);
  }

  isCliente(): boolean {
    return this.currentUser()?.role === 'CLIENTE';
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

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  getUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API}/users`);
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/me`);
  }

  /** Load full profile from /me and update local state */
  loadProfile(): void {
    this.getMe().subscribe({
      next: (profile) => {
        const current = this.currentUser();
        const merged: UserProfile = {
          ...current,
          ...profile
        };
        localStorage.setItem('user', JSON.stringify(merged));
        this.currentUser.set(merged);
      }
    });
  }

  /** Update profile (display name, avatar) */
  updateProfile(req: ProfileUpdateRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API}/profile`, req).pipe(
      tap(profile => {
        const merged: UserProfile = { ...this.currentUser(), ...profile };
        localStorage.setItem('user', JSON.stringify(merged));
        this.currentUser.set(merged);
      })
    );
  }
}
