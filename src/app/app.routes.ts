import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'patterns', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'confirm',
        loadComponent: () =>
          import('./features/auth/pages/confirm/confirm.component').then((m) => m.ConfirmComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/pages/categories/categories.component').then(
            (m) => m.CategoriesComponent,
          ),
      },
      {
        path: 'patterns',
        loadComponent: () =>
          import('./features/patterns/pages/patterns-list/patterns-list.component').then(
            (m) => m.PatternsListComponent,
          ),
      },
      {
        path: 'patterns/upload',
        loadComponent: () =>
          import('./features/patterns/pages/pattern-upload/pattern-upload.component').then(
            (m) => m.PatternUploadComponent,
          ),
      },
      {
        path: 'patterns/:id',
        loadComponent: () =>
          import('./features/patterns/pages/pattern-detail/pattern-detail.component').then(
            (m) => m.PatternDetailComponent,
          ),
      },
      {
        path: 'patterns/:id/edit',
        loadComponent: () =>
          import('./features/patterns/pages/pattern-edit/pattern-edit.component').then(
            (m) => m.PatternEditComponent,
          ),
      },
    ],
  },
];
