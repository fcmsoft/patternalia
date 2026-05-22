import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
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
        <p class="text-center text-gray-500 mb-8 text-sm">Sign in to your pattern library</p>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
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
              [class]="
                'w-full' +
                (form.controls.email.invalid && form.controls.email.touched
                  ? ' ng-invalid ng-dirty'
                  : '')
              "
              aria-required="true"
              [attr.aria-describedby]="
                form.controls.email.invalid && form.controls.email.touched ? 'email-error' : null
              "
            />
            @if (form.controls.email.invalid && form.controls.email.touched) {
              <small id="email-error" class="text-red-600">A valid email is required.</small>
            }
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="text-sm font-medium text-gray-700">Password</label>
            <p-password
              inputId="password"
              formControlName="password"
              [feedback]="false"
              [toggleMask]="true"
              autocomplete="current-password"
              styleClass="w-full"
              inputStyleClass="w-full"
              aria-required="true"
            />
            @if (form.controls.password.invalid && form.controls.password.touched) {
              <small class="text-red-600">Password is required.</small>
            }
          </div>

          <button
            pButton
            type="submit"
            label="Sign in"
            [loading]="loading()"
            [disabled]="form.invalid"
            class="w-full"
          ></button>

          <div class="flex justify-between text-sm text-gray-500">
            <a
              routerLink="/auth/forgot-password"
              class="hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            >
              Forgot password?
            </a>
            <a
              routerLink="/auth/register"
              class="hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            >
              Create account
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login({ username: email!, password: password! });
      this.router.navigate(['/patterns']);
    } catch (err: unknown) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Sign in failed. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
