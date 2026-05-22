import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/auth/auth.service';

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
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-sm">
        <h1 class="text-3xl font-bold text-center text-indigo-600 mb-2">🧶 Patternalia</h1>

        @if (!codeSent()) {
          <p class="text-center text-gray-500 mb-8 text-sm">Reset your password</p>
          <form
            [formGroup]="requestForm"
            (ngSubmit)="sendCode()"
            class="bg-white shadow rounded-xl p-8 space-y-5"
            novalidate
          >
            @if (errorMessage()) {
              <p-message severity="error" [text]="errorMessage()!" />
            }
            <div class="flex flex-col gap-1">
              <label for="email" class="text-sm font-medium text-gray-700">Email</label>
              <input
                pInputText
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="w-full"
                aria-required="true"
              />
            </div>
            <button
              pButton
              type="submit"
              label="Send reset code"
              [loading]="loading()"
              [disabled]="requestForm.invalid"
              class="w-full"
            ></button>
            <p class="text-center text-sm">
              <a
                routerLink="/auth/login"
                class="text-indigo-600 hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                >Back to sign in</a
              >
            </p>
          </form>
        } @else {
          <p class="text-center text-gray-500 mb-8 text-sm">Enter the code sent to your email</p>
          <form
            [formGroup]="resetForm"
            (ngSubmit)="resetPassword()"
            class="bg-white shadow rounded-xl p-8 space-y-5"
            novalidate
          >
            @if (errorMessage()) {
              <p-message severity="error" [text]="errorMessage()!" />
            }
            @if (successMessage()) {
              <p-message severity="success" [text]="successMessage()!" />
            }
            <div class="flex flex-col gap-1">
              <label for="code" class="text-sm font-medium text-gray-700">Reset code</label>
              <input
                pInputText
                id="code"
                type="text"
                formControlName="code"
                autocomplete="one-time-code"
                class="w-full"
                aria-required="true"
                inputmode="numeric"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="newPassword" class="text-sm font-medium text-gray-700"
                >New password</label
              >
              <p-password
                inputId="newPassword"
                formControlName="newPassword"
                [toggleMask]="true"
                autocomplete="new-password"
                styleClass="w-full"
                inputStyleClass="w-full"
                aria-required="true"
              />
            </div>
            <button
              pButton
              type="submit"
              label="Reset password"
              [loading]="loading()"
              [disabled]="resetForm.invalid"
              class="w-full"
            ></button>
          </form>
        }
      </div>
    </div>
  `,
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
