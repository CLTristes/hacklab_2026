import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { coordinationGuard } from './core/guards/coordination.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signup/signup.component').then((m) => m.SignupComponent)
  },
  {
    path: 'select-institution',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/select-institution/select-institution.component').then(
        (m) => m.SelectInstitutionComponent
      )
  },
  {
    path: 'verify-email',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent)
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documents/document-upload.component').then((m) => m.DocumentUploadComponent)
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () => import('./features/progress/progress.component').then((m) => m.ProgressComponent)
  },
  {
    path: 'next-term',
    canActivate: [authGuard],
    loadComponent: () => import('./features/next-term/next-term.component').then((m) => m.NextTermComponent)
  },
  {
    path: 'veteran-archive',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/veteran-archive/veteran-archive.component').then((m) => m.VeteranArchiveComponent)
  },
  {
    path: 'complementary-hours',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/complementary-hours/complementary-hours.component').then(
        (m) => m.ComplementaryHoursComponent
      )
  },
  {
    path: 'coordination',
    canActivate: [authGuard, coordinationGuard],
    loadComponent: () =>
      import('./features/coordination/coordination.component').then((m) => m.CoordinationComponent)
  },
  { path: '**', redirectTo: 'login' }
];
