import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfirmDesignRequest,
  CustomDesignResponse,
  DesignNotificationResponse,
  DesignSpec,
  DesignTurnRequest,
  DesignTurnResponse,
  PreviewResponse,
  UpdateDesignStatusRequest
} from '../models/ai-design.model';

@Injectable({ providedIn: 'root' })
export class AiDesignService {
  private readonly API = environment.apiUrl;
  private readonly http = inject(HttpClient);

  sendMessage(payload: DesignTurnRequest): Observable<DesignTurnResponse> {
    return this.http.post<DesignTurnResponse>(`${this.API}/api/ai/design/message`, payload);
  }

  generatePreview(spec: DesignSpec): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${this.API}/api/ai/design/preview`, { spec });
  }

  confirmDesign(payload: ConfirmDesignRequest): Observable<CustomDesignResponse> {
    return this.http.post<CustomDesignResponse>(`${this.API}/api/ai/design/confirm`, payload);
  }

  getMyDesigns(): Observable<CustomDesignResponse[]> {
    return this.http.get<CustomDesignResponse[]>(`${this.API}/api/ai/design/mine`);
  }

  getDesign(id: string): Observable<CustomDesignResponse> {
    return this.http.get<CustomDesignResponse>(`${this.API}/api/ai/design/${id}`);
  }

  getNotifications(): Observable<DesignNotificationResponse[]> {
    return this.http.get<DesignNotificationResponse[]>(`${this.API}/api/ai/design/notifications`);
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.http.get<number>(`${this.API}/api/ai/design/notifications/unread-count`);
  }

  markNotificationRead(id: string): Observable<DesignNotificationResponse> {
    return this.http.patch<DesignNotificationResponse>(`${this.API}/api/ai/design/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.patch<void>(`${this.API}/api/ai/design/notifications/read-all`, {});
  }

  getReviewQueue(): Observable<CustomDesignResponse[]> {
    return this.http.get<CustomDesignResponse[]>(`${this.API}/api/ai/design/review`);
  }

  updateStatus(id: string, payload: UpdateDesignStatusRequest): Observable<CustomDesignResponse> {
    return this.http.patch<CustomDesignResponse>(`${this.API}/api/ai/design/${id}/status`, payload);
  }
}
