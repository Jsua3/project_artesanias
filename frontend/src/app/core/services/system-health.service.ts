import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemHealth } from '../models/system-health.model';

@Injectable({ providedIn: 'root' })
export class SystemHealthService {
  private readonly API = `${environment.apiUrl}/api/admin/system-health`;
  private http = inject(HttpClient);

  snapshot(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(this.API);
  }
}
