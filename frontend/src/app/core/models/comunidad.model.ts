export type PostEstado = 'ACTIVO' | 'ELIMINADO' | 'REPORTADO';
export type EventoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface ComunidadPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  estado: PostEstado;
  likedByMe?: boolean;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
}

export interface ComunidadComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface EventoPropuesta {
  id: string;
  artesanoId: string;
  artesanoNombre?: string;
  organizacion: string;
  nombre: string;
  localidad: string;
  direccionExacta?: string;
  fechaInicio: string;
  fechaFin: string;
  hora: string;
  descripcion?: string;
  estado: EventoEstado;
  createdAt: string;
}

export interface CreateEventoRequest {
  artesanoNombre?: string;
  organizacion: string;
  nombre: string;
  localidad: string;
  direccionExacta?: string;
  fechaInicio: string;
  fechaFin: string;
  hora: string;
  descripcion?: string;
}

export interface ReviewEventoRequest {
  decision: 'APROBADO' | 'RECHAZADO';
  comentario?: string;
}
