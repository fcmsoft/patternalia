import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 bg-indigo-600 text-white px-4 py-2 rounded focus:outline-none"
    >
      Skip to main content
    </a>

    <div class="min-h-screen flex flex-col bg-gray-50">
      <header class="bg-white border-b border-gray-200 shadow-sm">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div class="flex items-center justify-between h-16">
            <!-- Logo + desktop nav -->
            <div class="flex items-center gap-8">
              <a
                routerLink="/patterns"
                class="text-xl font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label="Patternalia home"
              >
                🧶 Patternalia
              </a>
              <div class="hidden sm:flex gap-1" role="list">
                <a
                  routerLink="/patterns"
                  routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                  [routerLinkActiveOptions]="{ exact: false }"
                  class="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  role="listitem"
                >
                  Patterns
                </a>
                <a
                  routerLink="/categories"
                  routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                  class="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  role="listitem"
                >
                  Categories
                </a>
              </div>
            </div>

            <!-- Right side -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500 hidden sm:block" aria-label="Signed in as">
                {{ auth.currentUser()?.username }}
              </span>
              <button
                pButton
                type="button"
                label="Sign out"
                severity="secondary"
                size="small"
                (click)="logout()"
              ></button>
              <!-- Mobile menu toggle -->
              <button
                type="button"
                class="sm:hidden p-2 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                [attr.aria-expanded]="mobileMenuOpen()"
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
                (click)="mobileMenuOpen.update((v) => !v)"
              >
                <span aria-hidden="true">{{ mobileMenuOpen() ? '✕' : '☰' }}</span>
              </button>
            </div>
          </div>

          <!-- Mobile nav -->
          @if (mobileMenuOpen()) {
            <div id="mobile-menu" class="sm:hidden pb-3 space-y-1">
              <a
                routerLink="/patterns"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: false }"
                class="block text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                (click)="mobileMenuOpen.set(false)"
              >
                Patterns
              </a>
              <a
                routerLink="/categories"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                class="block text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                (click)="mobileMenuOpen.set(false)"
              >
                Categories
              </a>
            </div>
          }
        </nav>
      </header>

      <main id="main-content" class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly mobileMenuOpen = signal(false);

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
