import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileStatus } from '../models/profile-status.model';
import { UserProfile } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly API = `${environment.apiUrl}/api/auth`;
  private http = inject(HttpClient);

  getProfileStatus(): Observable<ProfileStatus> {
    return this.http.get<ProfileStatus>(`${this.API}/me/profile-status`);
  }

  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API}/profile`, payload);
  }
}
