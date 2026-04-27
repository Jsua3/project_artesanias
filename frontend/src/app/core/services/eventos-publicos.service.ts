import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventoPublico {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  ubicacion: string;
  imagenUrl: string | null;
  artesanoNombre: string;
}

@Injectable({ providedIn: 'root' })
export class EventosPublicosService {
  private readonly API = `${environment.apiUrl}/api/public`;
  private http = inject(HttpClient);

  listAprobados(): Observable<EventoPublico[]> {
    return this.http.get<EventoPublico[]>(`${this.API}/eventos`);
  }
}
