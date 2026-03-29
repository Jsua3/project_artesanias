import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/auth.model';

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
      })
    );
  }

  register(req: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/register`, req);
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
}
