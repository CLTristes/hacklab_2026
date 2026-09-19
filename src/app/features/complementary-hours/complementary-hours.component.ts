import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplementaryActivitiesService } from '../../core/services/complementary-activities.service';
import { ComplementaryActivity, ComplementaryCategorySummary } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-complementary-hours',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './complementary-hours.component.html'
})
export class ComplementaryHoursComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activities = signal<ComplementaryActivity[]>([]);
  readonly summary = signal<ComplementaryCategorySummary[]>([]);

  readonly showDeclareModal = signal(false);
  readonly saving = signal(false);
  readonly declareError = signal<string | null>(null);
  readonly lastResult = signal<{ capped: boolean; hours_not_counted: number } | null>(null);

  file: File | null = null;

  form = {
    category_id: '',
    title: '',
    hours_claimed: 0,
    issued_at: ''
  };

  // TODO: trocar por endpoint dedicado de categorias quando existir; hoje deriva do resumo carregado.
  readonly categories = () =>
    this.summary()
      .map((s) => s.category)
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  constructor(private readonly svc: ComplementaryActivitiesService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.list().subscribe({
      next: (res) => {
        this.activities.set(res.data);
        this.summary.set(res.summary ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar suas atividades complementares.');
        this.loading.set(false);
      }
    });
  }

  totalDeclared(): number {
    return this.summary().reduce((sum, s) => sum + (s.declared_hours ?? 0), 0);
  }

  totalCounted(): number {
    return this.summary().reduce((sum, s) => sum + (s.counted_hours ?? 0), 0);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  openDeclareModal(): void {
    this.form = { category_id: '', title: '', hours_claimed: 0, issued_at: '' };
    this.file = null;
    this.declareError.set(null);
    this.lastResult.set(null);
    this.showDeclareModal.set(true);
  }

  closeDeclareModal(): void {
    this.showDeclareModal.set(false);
  }

  submitActivity(): void {
    if (!this.form.category_id.trim() || !this.form.title.trim() || !this.form.hours_claimed) {
      this.declareError.set('Informe categoria, título e horas.');
      return;
    }
    this.saving.set(true);
    this.declareError.set(null);
    this.svc
      .declare({
        category_id: this.form.category_id.trim(),
        title: this.form.title.trim(),
        hours_claimed: this.form.hours_claimed,
        issued_at: this.form.issued_at || undefined,
        certificate: this.file
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.lastResult.set({ capped: res.capped, hours_not_counted: res.hours_not_counted });
          this.showDeclareModal.set(false);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.declareError.set(err?.error?.message ?? 'Não foi possível declarar a atividade.');
        }
      });
  }
}
