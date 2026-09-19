import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CoordinationService } from '../../core/services/coordination.service';
import { Bottleneck, Cohort, Demand } from '../../core/models/api.models';

@Component({
  selector: 'app-coordination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coordination.component.html'
})
export class CoordinationComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly bottlenecks = signal<Bottleneck[]>([]);
  readonly cohorts = signal<Cohort[]>([]);
  readonly atRiskCount = signal<number | null>(null);
  readonly atRiskWithinTerms = signal<number | null>(null);
  readonly demand = signal<Demand[]>([]);

  constructor(private readonly svc: CoordinationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      bottlenecks: this.svc.bottlenecks(),
      cohorts: this.svc.cohorts(),
      atRisk: this.svc.atRisk(),
      demand: this.svc.demand()
    }).subscribe({
      next: ({ bottlenecks, cohorts, atRisk, demand }) => {
        this.bottlenecks.set(bottlenecks.data);
        this.cohorts.set(cohorts.data);
        this.atRiskCount.set(atRisk.data.count);
        this.atRiskWithinTerms.set(atRisk.data.within_terms);
        this.demand.set(demand.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar o painel da coordenação.');
        this.loading.set(false);
      }
    });
  }
}
