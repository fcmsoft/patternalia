import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-confirm',
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, MessageModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm.component.html',
})
export class ConfirmComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      [Validators.required, Validators.email],
    ],
    code: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const { email, code } = this.form.getRawValue();
      await this.auth.confirmRegistration({ username: email!, confirmationCode: code! });
      this.successMessage.set('Account confirmed! Redirecting to sign in…');
      setTimeout(() => this.router.navigate(['/auth/login']), 1500);
    } catch (err: unknown) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Confirmation failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
