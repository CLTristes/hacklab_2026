import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subscription, catchError, expand, of, switchMap, takeWhile, timer } from 'rxjs';
import { AcademicDocumentsService } from '../../core/services/academic-documents.service';
import { DocumentKind, ExtractionLine } from '../../core/models/api.models';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './document-upload.component.html'
})
export class DocumentUploadComponent {
  kind: DocumentKind = 'transcript';
  file: File | null = null;

  readonly uploading = signal(false);
  readonly polling = signal(false);
  readonly confirming = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusLabel = signal<string | null>(null);
  readonly lines = signal<ExtractionLine[]>([]);
  readonly documentId = signal<string | null>(null);
  readonly confirmedImported = signal<number | null>(null);
  readonly confirmedPending = signal<{ code: string; reason: string }[]>([]);

  private pollSub?: Subscription;

  constructor(
    private readonly docs: AcademicDocumentsService,
    private readonly router: Router
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.file) {
      this.error.set('Selecione um arquivo (PDF, PNG ou JPG, até 20 MB).');
      return;
    }
    this.error.set(null);
    this.uploading.set(true);
    this.docs.upload(this.kind, this.file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.documentId.set(res.data.id);
        this.statusLabel.set(res.data.status_label);
        this.pollStatus(res.data.id);
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message ?? 'Falha ao enviar o documento.');
      }
    });
  }

  private pollStatus(id: string): void {
    this.polling.set(true);
    this.pollSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.docs.status(id)),
        takeWhile((res) => res.data.is_pending, true),
        catchError((err) => {
          this.error.set(err?.error?.message ?? 'Falha ao consultar status.');
          return EMPTY;
        })
      )
      .subscribe((res) => {
        this.statusLabel.set(res.data.status_label);
        if (!res.data.is_pending) {
          this.polling.set(false);
          this.lines.set(res.data.extraction?.lines ?? []);
        }
      });
  }

  confirm(): void {
    const id = this.documentId();
    if (!id || this.polling() || this.lines().length === 0 || this.confirmedImported() !== null) {
      return;
    }
    this.confirming.set(true);
    this.docs.confirm(id, { lines: this.lines() }).subscribe({
      next: (res) => {
        this.confirming.set(false);
        this.confirmedImported.set(res.imported);
        this.confirmedPending.set(res.pending);
      },
      error: (err) => {
        this.confirming.set(false);
        this.error.set(err?.error?.message ?? 'Falha ao confirmar.');
      }
    });
  }

  goToProgress(): void {
    this.router.navigateByUrl('/progress');
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
