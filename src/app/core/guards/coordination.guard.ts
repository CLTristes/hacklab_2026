import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const COORDINATION_ROLES = ['coordinator', 'institution_admin'];

export const coordinationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user && COORDINATION_ROLES.includes(user.role)) {
    return true;
  }
  return router.createUrlTree(['/home']);
};
