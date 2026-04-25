import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ComunidadPost,
  CreateEventoRequest,
  CreatePostRequest,
  EventoPropuesta,
  ReviewEventoRequest
} from '../models/comunidad.model';

@Injectable({ providedIn: 'root' })
export class ComunidadService {
  private readonly API = `${environment.apiUrl}/api/comunidad`;
  private http = inject(HttpClient);

  getPosts(): Observable<ComunidadPost[]> {
    return this.http.get<ComunidadPost[]>(`${this.API}/posts`);
  }

  getPostsForModeration(): Observable<ComunidadPost[]> {
    return this.http.get<ComunidadPost[]>(`${this.API}/posts/moderacion`);
  }

  createPost(req: CreatePostRequest): Observable<ComunidadPost> {
    return this.http.post<ComunidadPost>(`${this.API}/posts`, req);
  }

  toggleLike(postId: string): Observable<ComunidadPost> {
    return this.http.post<ComunidadPost>(`${this.API}/posts/${postId}/like`, {});
  }

  reportPost(postId: string): Observable<ComunidadPost> {
    return this.http.post<ComunidadPost>(`${this.API}/posts/${postId}/report`, {});
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/posts/${postId}`);
  }

  getMyEventos(): Observable<EventoPropuesta[]> {
    return this.http.get<EventoPropuesta[]>(`${this.API}/eventos/mis`);
  }

  getPendingEventos(): Observable<EventoPropuesta[]> {
    return this.http.get<EventoPropuesta[]>(`${this.API}/eventos/pending`);
  }

  createEvento(req: CreateEventoRequest): Observable<EventoPropuesta> {
    return this.http.post<EventoPropuesta>(`${this.API}/eventos`, req);
  }

  reviewEvento(id: string, req: ReviewEventoRequest): Observable<EventoPropuesta> {
    return this.http.patch<EventoPropuesta>(`${this.API}/eventos/${id}/review`, req);
  }
}
