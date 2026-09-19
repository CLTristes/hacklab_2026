import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly error = signal<string | null>(null);
  readonly resent = signal(false);

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyEmail(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/progress'),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Código inválido.');
        this.loading.set(false);
      }
    });
  }

  resend(): void {
    this.resending.set(true);
    this.resent.set(false);
    this.auth.resendVerification().subscribe({
      next: () => {
        this.resending.set(false);
        this.resent.set(true);
      },
      error: () => this.resending.set(false)
    });
  }

  skip(): void {
    this.router.navigateByUrl('/progress');
  }
}
