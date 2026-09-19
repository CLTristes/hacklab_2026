import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JourneyService } from '../../core/services/journey.service';
import { CurrentTermSubject, NextTermResponse, NextTermSubject, SimulateResponse } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-next-term',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './next-term.component.html'
})
export class NextTermComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly nextTerm = signal<NextTermResponse['data'] | null>(null);

  readonly enrolled = signal<CurrentTermSubject[]>([]);

  readonly expandedEnrolled = signal<Set<string>>(new Set());
  readonly selectedCodes = signal<Set<string>>(new Set());
  readonly simulating = signal(false);
  readonly simulation = signal<SimulateResponse['data'] | null>(null);

  readonly showSimulateModal = signal(false);
  readonly showAllPeriods = signal(false);

  private readonly mandatoryTerms = signal<Map<string, number> | null>(null);

  readonly mandatoryEligible = computed<NextTermSubject[]>(() => {
    const eligible = this.nextTerm()?.eligible ?? [];
    const mandatory = this.mandatoryTerms();
    return mandatory ? eligible.filter((s) => mandatory.has(s.code)) : eligible;
  });

  readonly mandatoryEligibleByPeriod = computed<{ period: number; subjects: NextTermSubject[] }[]>(() => {
    const mandatory = this.mandatoryTerms();
    if (!mandatory) {
      return [];
    }
    const groups = new Map<number, NextTermSubject[]>();
    for (const subject of this.mandatoryEligible()) {
      const period = mandatory.get(subject.code)!;
      const group = groups.get(period);
      group ? group.push(subject) : groups.set(period, [subject]);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([period, subjects]) => ({ period, subjects }));
  });

  readonly visiblePeriods = computed<{ period: number; subjects: NextTermSubject[] }[]>(() => {
    const groups = this.mandatoryEligibleByPeriod();
    return this.showAllPeriods() ? groups : groups.slice(0, 1);
  });

  constructor(private readonly journey: JourneyService) {}

  ngOnInit(): void {
    this.journey.nextTerm().subscribe({
      next: (res) => {
        this.nextTerm.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar as disciplinas.');
        this.loading.set(false);
      }
    });

    this.journey.currentTerm().subscribe({
      next: (res) => this.enrolled.set(res.data.subjects),
      error: (err) => this.error.set(err?.error?.message ?? 'Não foi possível carregar disciplinas matriculadas.')
    });

    this.journey.progress().subscribe({
      next: (res) => {
        const pending = res.data.pending_subjects ?? [];
        const terms = new Map(pending.filter((s) => s.nature === 'mandatory').map((s) => [s.code, s.term]));
        this.mandatoryTerms.set(terms);
      }
    });
  }

  toggleEnrolled(code: string): void {
    const next = new Set(this.expandedEnrolled());
    next.has(code) ? next.delete(code) : next.add(code);
    this.expandedEnrolled.set(next);
  }

  toggleShowAllPeriods(): void {
    this.showAllPeriods.update((v) => !v);
  }

  openSimulateModal(): void {
    this.showSimulateModal.set(true);
  }

  closeSimulateModal(): void {
    this.showSimulateModal.set(false);
  }

  toggle(code: string, checked: boolean): void {
    const next = new Set(this.selectedCodes());
    checked ? next.add(code) : next.delete(code);
    this.selectedCodes.set(next);
  }

  simulate(): void {
    const fail = Array.from(this.selectedCodes());
    if (fail.length === 0) {
      return;
    }
    this.simulating.set(true);
    this.simulation.set(null);
    this.journey.simulate({ fail }).subscribe({
      next: (res) => {
        this.simulation.set(res.data);
        this.simulating.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível simular.');
        this.simulating.set(false);
      }
    });
  }
}
