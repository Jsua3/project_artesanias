import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // ADMIN siempre pasa
  if (user.role === 'ADMIN') return true;

  // Si el perfil está completo, permite
  if (user.profileComplete === true) return true;

  // Solo aplica bloqueo a ARTESANO y DOMICILIARIO
  if (user.role === 'ARTESANO' || user.role === 'DOMICILIARIO') {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
