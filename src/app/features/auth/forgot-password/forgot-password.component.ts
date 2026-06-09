import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly codeSent = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly resetForm = this.fb.group({
    code: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  private email = '';

  async sendCode(): Promise<void> {
    if (this.requestForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      this.email = this.requestForm.getRawValue().email!;
      await this.auth.forgotPassword({ username: this.email });
      this.codeSent.set(true);
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Failed to send reset code.');
    } finally {
      this.loading.set(false);
    }
  }

  async resetPassword(): Promise<void> {
    if (this.resetForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const { code, newPassword } = this.resetForm.getRawValue();
      await this.auth.confirmForgotPassword({
        username: this.email,
        confirmationCode: code!,
        newPassword: newPassword!,
      });
      this.successMessage.set('Password reset! Redirecting to sign in…');
      setTimeout(() => this.router.navigate(['/auth/login']), 1500);
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
