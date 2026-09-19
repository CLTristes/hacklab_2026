import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JourneyService } from '../../core/services/journey.service';
import { ProgressResponse } from '../../core/models/api.models';

const KEY_TRANSLATIONS: Record<string, string> = {
  overall: 'Geral',
  required_hours: 'Horas exigidas',
  completed_hours: 'Horas cumpridas',
  pending_hours: 'Horas pendentes',
  remaining_hours: 'Horas restantes',
  pending: 'Pendentes',
  pending_subjects: 'Disciplinas pendentes',
  mandatory: 'Obrigatórias',
  elective: 'Optativas',
  standalone_extension: 'Extensão avulsa',
  extension: 'Extensão',
  extension_hours: 'Horas de extensão',
  counts_in_total: 'Conta no total',
  workload: 'Carga horária',
  total_hours: 'Carga horária total',
  forecast: 'Previsão',
  graduation_forecast: 'Previsão de formatura',
  estimated_graduation: 'Previsão de formatura',
  estimated_terms_remaining: 'Períodos restantes estimados',
  pace: 'Ritmo',
  current_pace: 'Ritmo atual',
  subject: 'Disciplina',
  subjects: 'Disciplinas',
  subject_code: 'Código',
  subject_name: 'Nome',
  code: 'Código',
  name: 'Nome',
  title: 'Título',
  status: 'Status',
  type: 'Tipo',
  category: 'Categoria',
  hours: 'Horas',
  period: 'Período',
  reason: 'Motivo',
  kind: 'Tipo',
  label: 'Categoria',
  completed: 'Concluídas',
  counted: 'Contabilizadas',
  required: 'Exigidas',
  in_progress: 'Em andamento',
  remaining: 'Restantes',
  surplus: 'Excedente',
  percentage: 'Percentual',
  terms_attended: 'Períodos cursados',
  avg_hours_per_term: 'Média de horas por período',
  average_hours_per_term: 'Média de horas por período',
  remaining_terms: 'Períodos restantes',
  terms_until_deadline: 'Períodos até o prazo',
  at_risk: 'Em risco',
  failures: 'Reprovações',
  deadline: 'Prazo',
  risk: 'Risco',
  tracks: 'Categorias de carga horária',
  track: 'Categoria',
  registration: 'Matrícula',
  number: 'Número',
  status_label: 'Situação',
  course: 'Curso',
  curriculum: 'Currículo',
  entry_term: 'Período de ingresso',
  id: 'ID'
};

const VALUE_TRANSLATIONS: Record<string, string> = {
  mandatory: 'Obrigatória',
  elective: 'Optativa',
  standalone_extension: 'Extensão avulsa',
  extension: 'Extensão',
  completed: 'Concluída',
  pending: 'Pendente',
  blocked: 'Bloqueada',
  approved: 'Aprovada',
  reproved: 'Reprovada',
  failed: 'Reprovada',
  in_progress: 'Em andamento',
  active: 'Ativa',
  inactive: 'Inativa',
  true: 'Sim',
  false: 'Não'
};

const ELECTIVE_MARKERS = ['elective', 'eletiva', 'optativa', 'optativo'];

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './progress.component.html'
})
export class ProgressComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly progress = signal<ProgressResponse['data'] | null>(null);

  constructor(private readonly journey: JourneyService) {}

  ngOnInit(): void {
    this.journey.progress().subscribe({
      next: (res) => {
        this.progress.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar sua progressão.');
        this.loading.set(false);
      }
    });
  }

  pct(overall: { required_hours: number; completed_hours: number }): number {
    if (!overall.required_hours) {
      return 0;
    }
    return Math.min(100, Math.round((overall.completed_hours / overall.required_hours) * 100));
  }

  readonly fichaSections = computed(() => {
    const p = this.progress();
    if (!p) {
      return [];
    }
    const sections = Object.entries(p)
      .filter(([key]) => key !== 'overall')
      .map(([key, value]) => ({
        key,
        label: this.formatLabel(key),
        kind: this.kindOf(value),
        value: key.toLowerCase().includes('pending') ? this.excludeElectives(value) : value
      }));
    return this.mergeExtensionIntoTracks(sections);
  });

  private mergeExtensionIntoTracks(
    sections: { key: string; label: string; kind: 'array' | 'object' | 'primitive'; value: unknown }[]
  ) {
    const tracks = sections.find((s) => s.key === 'tracks' && s.kind === 'array');
    const extension = sections.find((s) => s.key === 'extension' && s.kind === 'object');
    if (!tracks || !extension) {
      return sections;
    }
    const extensionCard = { label: 'Extensão', ...(extension.value as Record<string, unknown>) };
    return sections
      .filter((s) => s.key !== 'extension')
      .map((s) => (s.key === 'tracks' ? { ...s, value: [...(s.value as unknown[]), extensionCard] } : s));
  }

  private excludeElectives(value: unknown): unknown {
    if (!Array.isArray(value)) {
      return value;
    }
    return value.filter((item) => !this.isElective(item));
  }

  private isElective(item: unknown): boolean {
    if (item === null || typeof item !== 'object') {
      return ELECTIVE_MARKERS.includes(String(item).toLowerCase());
    }
    return Object.values(item as Record<string, unknown>).some((v) =>
      ELECTIVE_MARKERS.includes(String(v).toLowerCase())
    );
  }

  formatLabel(key: string): string {
    const known = KEY_TRANSLATIONS[key.toLowerCase()];
    if (known) {
      return known;
    }
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  translateValue(value: unknown): unknown {
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    const key = String(value).toLowerCase();
    return VALUE_TRANSLATIONS[key] ?? value;
  }

  kindOf(value: unknown): 'array' | 'object' | 'primitive' {
    if (Array.isArray(value)) {
      return 'array';
    }
    if (value !== null && typeof value === 'object') {
      return 'object';
    }
    return 'primitive';
  }

  entriesOf(value: unknown): [string, unknown][] {
    if (value === null || typeof value !== 'object') {
      return [];
    }
    return Object.entries(value as Record<string, unknown>);
  }

  visibleEntries(value: unknown, extraExclude: string[] = []): [string, unknown][] {
    const entries = this.entriesOf(value);
    const hasLabel = !!(value as Record<string, unknown> | null)?.['label'];
    return entries.filter(([key]) => {
      if (hasLabel && key === 'kind') {
        return false;
      }
      return !extraExclude.includes(key);
    });
  }

  itemLabel(item: unknown): string {
    if (item === null || typeof item !== 'object') {
      return String(item);
    }
    const o = item as Record<string, unknown>;
    return String(o['name'] ?? o['title'] ?? o['code'] ?? o['label'] ?? '');
  }

  statusClass(item: unknown): string {
    const status = String((item as Record<string, unknown> | null)?.['status'] ?? '').toLowerCase();
    if (['ok', 'completed', 'concluido', 'concluído', 'approved', 'aprovado'].includes(status)) {
      return 'status--ok';
    }
    if (['blocked', 'bloqueado', 'reproved', 'reprovado'].includes(status)) {
      return 'status--blocked';
    }
    if (status) {
      return 'status--pending';
    }
    return '';
  }

  isPlainValue(v: unknown): boolean {
    return v === null || typeof v !== 'object';
  }

  asArray(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
  }

  itemStatus(item: unknown): string {
    const raw = (item as Record<string, unknown> | null)?.['status'];
    return raw === undefined ? '' : String(this.translateValue(raw));
  }

  private readonly showAllKeys = signal<Set<string>>(new Set());
  private readonly expandedItems = signal<Set<string>>(new Set());

  isObjectArray(value: unknown): boolean {
    const arr = this.asArray(value);
    return arr.length > 0 && arr.every((item) => !this.isPlainValue(item));
  }

  visibleListItems(key: string, value: unknown): unknown[] {
    const arr = this.asArray(value);
    return this.isShowAll(key) ? arr : arr.slice(0, 4);
  }

  isShowAll(key: string): boolean {
    return this.showAllKeys().has(key);
  }

  toggleShowAll(key: string): void {
    const next = new Set(this.showAllKeys());
    next.has(key) ? next.delete(key) : next.add(key);
    this.showAllKeys.set(next);
  }

  isItemExpanded(key: string, index: number): boolean {
    return this.expandedItems().has(`${key}:${index}`);
  }

  toggleItem(key: string, index: number): void {
    const id = `${key}:${index}`;
    const next = new Set(this.expandedItems());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedItems.set(next);
  }
}
