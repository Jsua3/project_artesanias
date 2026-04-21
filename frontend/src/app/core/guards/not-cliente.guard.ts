import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Evita que usuarios con rol CLIENTE entren al backoffice (/admin/*).
 * Si es CLIENTE, lo redirige a la tienda pública.
 */
export const notClienteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCliente()) return router.createUrlTree(['/']);
  return true;
};
