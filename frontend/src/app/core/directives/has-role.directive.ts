import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural que muestra u oculta un elemento según el rol del usuario.
 *
 * Uso:
 *   <div *appHasRole="['ADMIN', 'ARTESANO']">Solo admins y artesanos</div>
 *   <div *appHasRole="'ADMIN'">Solo admin</div>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  private vcr = inject(ViewContainerRef);
  private tmpl = inject(TemplateRef<unknown>);
  private auth = inject(AuthService);

  private _roles = signal<UserRole[]>([]);
  private hasView = false;
  private cleanup: (() => void) | null = null;

  @Input({ required: true })
  set appHasRole(roles: UserRole | UserRole[]) {
    this._roles.set(Array.isArray(roles) ? roles : [roles]);
  }

  constructor() {
    const effectRef = effect(() => {
      const allowed = this.auth.hasAnyRole(...this._roles());
      if (allowed && !this.hasView) {
        this.vcr.createEmbeddedView(this.tmpl);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.vcr.clear();
        this.hasView = false;
      }
    });

    this.cleanup = () => effectRef.destroy();
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }
}
