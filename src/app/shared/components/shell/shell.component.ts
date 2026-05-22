import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
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
