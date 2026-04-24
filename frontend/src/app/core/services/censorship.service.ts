import { Injectable } from '@angular/core';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Filtro de contenido para la Comunidad Artesana.
 * Bloquea publicaciones antes de enviarlas al backend usando Regex.
 * Para contenido visual se asume un sistema de reportes asíncrono.
 */
@Injectable({ providedIn: 'root' })
export class CensorshipService {
  private readonly MAX_CHARS = 2000;
  private readonly MIN_CHARS = 3;

  /** Patrones de palabras/frases prohibidas en español. */
  private readonly BANNED: RegExp[] = [
    // Groserías comunes en Colombia/LatAm
    /\b(puta|putas|puto|putos|hijueputa|hp|gonorrea|gonorreoso|malparido|malparida)\b/i,
    /\b(mierda|cagar|cagada|cagado|culo|culero|culera|maric[oó]n|marica|maricas)\b/i,
    /\b(verga|pene|vagina|co[ñn]o|joder|coger|follare?|pendejo|pendeja)\b/i,
    /\b(idiota|estúpido|estupido|imbécil|imbecil|retrasado|retrasada|subnormal)\b/i,
    /\b(hdp|ptm|ctm|ojalá\s+te\s+mueras?)\b/i,
    // Incitación al odio
    /\b(matar|asesinar|eliminar|amenaza[rs]?)\s+(a\s+)?(el|la|los|las)\s+\w+/i,
    // Spam / links de phishing simplificados
    /\b(click\s+here|haz\s+clic|gana\s+dinero\s+fácil|trabaja\s+desde\s+casa)\b/i,
  ];

  /** Palabras que se censuran visualmente pero no bloquean (muestra *). */
  private readonly SOFT_FILTER: RegExp[] = [
    /\b(maldita?|caramba|demonios|diablos)\b/gi,
  ];

  /**
   * Valida un texto antes de enviar al backend.
   * Retorna { valid: true } si pasa todos los filtros.
   */
  validate(text: string): ValidationResult {
    const trimmed = text?.trim() ?? '';

    if (trimmed.length < this.MIN_CHARS) {
      return { valid: false, reason: 'La publicación debe tener al menos 3 caracteres.' };
    }

    if (trimmed.length > this.MAX_CHARS) {
      return { valid: false, reason: `Máximo ${this.MAX_CHARS.toLocaleString()} caracteres permitidos.` };
    }

    if (this.BANNED.some(r => r.test(trimmed))) {
      return {
        valid: false,
        reason: 'Tu publicación contiene palabras no permitidas. Cuida el lenguaje de nuestra comunidad.'
      };
    }

    return { valid: true };
  }

  /** Aplica filtro suave (reemplaza con asteriscos) sin bloquear. */
  softFilter(text: string): string {
    let result = text;
    this.SOFT_FILTER.forEach(r => {
      result = result.replace(r, m => '*'.repeat(m.length));
    });
    return result;
  }

  /** Indica si el texto supera el límite. Útil para mostrar advertencia en tiempo real. */
  isOverLimit(text: string): boolean {
    return (text?.length ?? 0) > this.MAX_CHARS;
  }

  remainingChars(text: string): number {
    return this.MAX_CHARS - (text?.length ?? 0);
  }

  /** Indica si hay contenido prohibido (para feedback en tiempo real sin bloquear aún). */
  hasBannedContent(text: string): boolean {
    return this.BANNED.some(r => r.test(text?.trim() ?? ''));
  }
}
