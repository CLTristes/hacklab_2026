import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { JourneyService } from '../../../core/services/journey.service';
import { redirectAfterAuth } from '../../../core/utils/post-auth-redirect';

interface PendingLogin {
  email: string;
  password: string;
}

@Component({
  selector: 'app-select-institution',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './select-institution.component.html'
})
export class SelectInstitutionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly journey = inject(JourneyService);
  private readonly router = inject(Router);

  private readonly pending = this.router.getCurrentNavigation()?.extras.state as PendingLogin | undefined;

  readonly form = this.fb.nonNullable.group({
    entity_id: ['', Validators.required]
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (!this.pending?.email || !this.pending?.password) {
      this.router.navigateByUrl('/login');
    }
  }

  submit(): void {
    if (this.form.invalid || !this.pending) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { entity_id } = this.form.getRawValue();
    this.auth.login({ ...this.pending, entity_id }).subscribe({
      next: () => redirectAfterAuth(this.journey, this.router),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível entrar.');
        this.loading.set(false);
      }
    });
  }
}
