import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IndexDBService } from '../services/index-db.service';

/**
 * Uso en routes:
 *   canActivate: [rolGuard(['ADMIN', 'SUPER_ADMIN'])]
 */
export const rolGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return async () => {
    const indexDB = inject(IndexDBService);
    const router = inject(Router);

    const auth = await indexDB.loadDataAuthDB();
    if (!auth) {
      router.navigate(['/login']);
      return false;
    }

    if (rolesPermitidos.includes(auth.rol)) {
      return true;
    }

    // El rol no tiene acceso — redirigir al POS (vista permitida para todos)
    router.navigate(['/pos']);
    return false;
  };
};
