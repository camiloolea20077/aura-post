// core/guards/platform.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { IndexDBService } from '../services/index-db.service';

export const platformGuard = async () => {
  const indexDB = inject(IndexDBService);
  const router = inject(Router);
  const auth = await indexDB.loadDataAuthDB();

  if (!auth?.token) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.rol !== 'PLATFORM_ADMIN') {
    router.navigate(['/dashboard']); // cliente intenta entrar a /platform → fuera
    return false;
  }

  return true;
};
