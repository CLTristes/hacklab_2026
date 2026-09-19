import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgendaService } from '../../core/services/agenda.service';
import { AuthService } from '../../core/services/auth.service';
import { JourneyService } from '../../core/services/journey.service';
import { AgendaItem, ProgressResponse, TaskKind } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

const COORDINATION_ROLES = ['coordinator', 'institution_admin'];

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: AgendaItem[];
}

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function currentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, ModalComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly agendaSvc = inject(AgendaService);
  private readonly journey = inject(JourneyService);
  private readonly auth = inject(AuthService);

  readonly canSeeCoordination = computed(() => {
    const role = this.auth.user()?.role;
    return !!role && COORDINATION_ROLES.includes(role);
  });

  readonly weekdayLabels = WEEKDAY_LABELS;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<AgendaItem[]>([]);

  readonly progressLoading = signal(true);
  readonly progressError = signal<string | null>(null);
  readonly progress = signal<ProgressResponse['data'] | null>(null);

  private readonly today = new Date();
  readonly cursor = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));

  readonly selectedDate = signal<Date>(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate()));

  readonly showTaskModal = signal(false);
  readonly savingTask = signal(false);
  readonly taskError = signal<string | null>(null);

  readonly taskKinds: { value: TaskKind; label: string }[] = [
    { value: 'personal', label: 'Pessoal' },
    { value: 'assignment', label: 'Trabalho' },
    { value: 'exam', label: 'Prova' },
    { value: 'reading', label: 'Leitura' }
  ];

  taskForm = {
    title: '',
    description_md: '',
    kind: 'personal' as TaskKind,
    time: currentTimeStr()
  };

  readonly monthLabel = computed(() => {
    const c = this.cursor();
    return `${MONTH_LABELS[c.getMonth()]} ${c.getFullYear()}`;
  });

  readonly weeks = computed<CalendarDay[][]>(() => {
    const c = this.cursor();
    const year = c.getFullYear();
    const month = c.getMonth();

    const byDate = new Map<string, AgendaItem[]>();
    for (const item of this.items()) {
      const d = new Date(item.due_at);
      const key = dateKey(d);
      const bucket = byDate.get(key) ?? [];
      bucket.push(item);
      byDate.set(key, bucket);
    }

    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // segunda = 0
    const start = new Date(year, month, 1 - firstWeekday);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      days.push({
        date,
        inMonth: date.getMonth() === month,
        isToday: dateKey(date) === dateKey(this.today),
        items: byDate.get(dateKey(date)) ?? []
      });
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  readonly upcoming = computed(() =>
    this.items()
      .filter((i) => new Date(i.due_at).getTime() >= this.today.setHours(0, 0, 0, 0))
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
      .slice(0, 8)
  );

  ngOnInit(): void {
    this.agendaSvc.agenda().subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar sua agenda.');
        this.loading.set(false);
      }
    });

    this.journey.progress().subscribe({
      next: (res) => {
        this.progress.set(res.data);
        this.progressLoading.set(false);
      },
      error: (err) => {
        this.progressError.set(err?.error?.message ?? 'Não foi possível carregar sua progressão.');
        this.progressLoading.set(false);
      }
    });
  }

  pct(overall: { required_hours: number; completed_hours: number }): number {
    if (!overall.required_hours) {
      return 0;
    }
    return Math.min(100, Math.round((overall.completed_hours / overall.required_hours) * 100));
  }

  prevMonth(): void {
    const c = this.cursor();
    this.cursor.set(new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const c = this.cursor();
    this.cursor.set(new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  goToday(): void {
    this.cursor.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
  }

  openTaskModal(): void {
    this.taskForm = {
      title: '',
      description_md: '',
      kind: 'personal',
      time: currentTimeStr()
    };
    this.taskError.set(null);
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
  }

  submitTask(): void {
    if (!this.taskForm.title.trim()) {
      this.taskError.set('Informe um título para a tarefa.');
      return;
    }
    const d = this.selectedDate();
    const [hours, minutes] = this.taskForm.time.split(':').map(Number);
    const dueAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours || 0, minutes || 0);

    this.savingTask.set(true);
    this.taskError.set(null);

    this.agendaSvc
      .createTask({
        title: this.taskForm.title.trim(),
        description_md: this.taskForm.description_md.trim() || undefined,
        kind: this.taskForm.kind,
        due_at: dueAt.toISOString(),
        visibility: 'private'
      })
      .subscribe({
        next: () => {
          this.savingTask.set(false);
          this.showTaskModal.set(false);
          this.ngOnInit();
        },
        error: (err) => {
          this.savingTask.set(false);
          this.taskError.set(err?.error?.message ?? 'Não foi possível cadastrar a tarefa.');
        }
      });
  }
}
