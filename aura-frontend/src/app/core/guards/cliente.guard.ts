// core/guards/cliente.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { IndexDBService } from '../services/index-db.service';

export const clienteGuard = async () => {
  const indexDB = inject(IndexDBService);
  const router = inject(Router);
  const auth = await indexDB.loadDataAuthDB();

  if (auth?.rol === 'PLATFORM_ADMIN') {
    router.navigate(['/platform/dashboard']);
    return false;
  }
  return true;
};
