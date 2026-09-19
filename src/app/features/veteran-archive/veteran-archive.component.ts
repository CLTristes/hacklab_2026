import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../../core/services/notes.service';
import { JourneyService } from '../../core/services/journey.service';
import { AuthService } from '../../core/services/auth.service';
import { Course, CurriculumSubject, Note, NoteDetailResponse, NoteKind, NoteVisibility } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

const KIND_LABELS: Record<NoteKind, string> = {
  summary: 'Resumo',
  past_exam: 'Prova antiga',
  solved_exercise_list: 'Lista resolvida',
  material: 'Material',
  tip: 'Dica'
};

const VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  private: 'Só eu',
  offering: 'Turma (oferta)',
  subject: 'Disciplina',
  course: 'Curso',
  institution: 'Instituição'
};

const MOCK_COURSES: Course[] = [
  {
    id: 'mock-bsi',
    code: 'BSI',
    name: 'Bacharelado em Sistemas de Informação',
    degree: 'bachelor',
    degree_label: 'Bacharelado',
    shift: 'night',
    shift_label: 'Noturno',
    campus: { id: 'mock-campus-ct', code: 'CT', name: 'Curitiba' }
  },
  {
    id: 'mock-eng-comp',
    code: 'ENG-COMP',
    name: 'Engenharia de Computação',
    degree: 'bachelor',
    degree_label: 'Bacharelado',
    shift: 'full',
    shift_label: 'Integral',
    campus: { id: 'mock-campus-ct', code: 'CT', name: 'Curitiba' }
  },
  {
    id: 'mock-ads',
    code: 'ADS',
    name: 'Análise e Desenvolvimento de Sistemas',
    degree: 'technologist',
    degree_label: 'Tecnólogo',
    shift: 'night',
    shift_label: 'Noturno',
    campus: { id: 'mock-campus-ct', code: 'CT', name: 'Curitiba' }
  }
];

const MOCK_SUBJECTS: CurriculumSubject[] = [
  { id: 'mock-sub-bd1', code: 'BD1', name: 'Banco de Dados I' },
  { id: 'mock-sub-ed1', code: 'ED1', name: 'Estrutura de Dados I' },
  { id: 'mock-sub-rc1', code: 'RC1', name: 'Redes de Computadores' },
  { id: 'mock-sub-es1', code: 'ES1', name: 'Engenharia de Software' },
  { id: 'mock-sub-calc2', code: 'CALC2', name: 'Cálculo II' }
];

@Component({
  selector: 'app-veteran-archive',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './veteran-archive.component.html'
})
export class VeteranArchiveComponent implements OnInit {
  readonly kindLabels = KIND_LABELS;
  readonly visibilityLabels = VISIBILITY_LABELS;

  readonly noteKinds: { value: NoteKind; label: string }[] = Object.entries(KIND_LABELS).map(([value, label]) => ({
    value: value as NoteKind,
    label
  }));

  readonly publishTargets: { value: NoteVisibility; label: string }[] = [
    { value: 'offering', label: 'Turma (oferta)' },
    { value: 'subject', label: 'Disciplina' },
    { value: 'course', label: 'Curso' },
    { value: 'institution', label: 'Instituição' }
  ];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notes = signal<Note[]>([]);

  readonly courses = signal<Course[]>([]);
  readonly subjects = signal<CurriculumSubject[]>([]);
  readonly subjectsLoading = signal(false);
  readonly filterCourseId = signal('');
  readonly filterSubjectId = signal('');

  readonly showCreateModal = signal(false);
  readonly saving = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createSubjects = signal<CurriculumSubject[]>([]);
  readonly createSubjectsLoading = signal(false);

  readonly viewOpen = signal(false);
  readonly viewingNote = signal<NoteDetailResponse['data'] | null>(null);
  readonly viewLoading = signal(false);
  readonly viewError = signal<string | null>(null);
  readonly voted = signal(false);
  readonly voting = signal(false);
  readonly voteError = signal<string | null>(null);

  readonly publishingNote = signal<Note | null>(null);
  readonly publishError = signal<string | null>(null);
  readonly publishTarget = signal<NoteVisibility>('subject');
  readonly publishCourseId = signal('');
  readonly publishSubjectId = signal('');
  readonly publishSubjects = signal<CurriculumSubject[]>([]);
  readonly publishSubjectsLoading = signal(false);
  readonly publishing = signal(false);

  form = {
    title: '',
    body_md: '',
    kind: 'summary' as NoteKind,
    course_id: '',
    subject_id: ''
  };

  constructor(
    private readonly notesSvc: NotesService,
    private readonly journey: JourneyService,
    private readonly auth: AuthService
  ) {}

  isOwner(note: Note): boolean {
    return note.author.id === this.auth.user()?.id;
  }

  ngOnInit(): void {
    this.load();
    this.journey.courses().subscribe({
      next: (res) => this.courses.set(res.data.length > 0 ? res.data : MOCK_COURSES),
      error: () => this.courses.set(MOCK_COURSES)
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notesSvc.list(this.filterSubjectId() || undefined).subscribe({
      next: (res) => {
        this.notes.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Não foi possível carregar o acervo.');
        this.loading.set(false);
      }
    });
  }

  onFilterCourseChange(courseId: string): void {
    this.filterCourseId.set(courseId);
    this.filterSubjectId.set('');
    this.subjects.set([]);
    if (!courseId) {
      return;
    }
    this.subjectsLoading.set(true);
    this.journey.curriculum(courseId).subscribe({
      next: (res) => {
        const subjects = res.data.periods.flatMap((p) => p.subjects);
        this.subjects.set(subjects.length > 0 ? subjects : MOCK_SUBJECTS);
        this.subjectsLoading.set(false);
      },
      error: () => {
        this.subjects.set(MOCK_SUBJECTS);
        this.subjectsLoading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.load();
  }

  clearFilter(): void {
    this.filterCourseId.set('');
    this.filterSubjectId.set('');
    this.subjects.set([]);
    this.load();
  }

  openCreateModal(): void {
    this.form = { title: '', body_md: '', kind: 'summary', course_id: '', subject_id: '' };
    this.createSubjects.set([]);
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateCourseChange(courseId: string): void {
    this.form.course_id = courseId;
    this.form.subject_id = '';
    this.createSubjects.set([]);
    if (!courseId) {
      return;
    }
    this.createSubjectsLoading.set(true);
    this.journey.curriculum(courseId).subscribe({
      next: (res) => {
        const subjects = res.data.periods.flatMap((p) => p.subjects);
        this.createSubjects.set(subjects.length > 0 ? subjects : MOCK_SUBJECTS);
        this.createSubjectsLoading.set(false);
      },
      error: () => {
        this.createSubjects.set(MOCK_SUBJECTS);
        this.createSubjectsLoading.set(false);
      }
    });
  }

  submitNote(): void {
    if (!this.form.title.trim() || !this.form.body_md.trim()) {
      this.createError.set('Informe título e conteúdo da nota.');
      return;
    }
    this.saving.set(true);
    this.createError.set(null);
    this.notesSvc
      .create({
        title: this.form.title.trim(),
        body_md: this.form.body_md.trim(),
        kind: this.form.kind,
        subject_id: this.form.subject_id || undefined,
        course_id: this.form.course_id || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showCreateModal.set(false);
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.createError.set(err?.error?.message ?? 'Não foi possível criar a nota.');
        }
      });
  }

  readonly mockDocuments: { name: string; kind: string; size: string }[] = [
    { name: 'anexo-p2.pdf', kind: 'PDF', size: '842 KB' },
    { name: 'gabarito-comentado.pdf', kind: 'PDF', size: '213 KB' },
    { name: 'slides-revisao.pptx', kind: 'PPTX', size: '1.4 MB' }
  ];

  openViewModal(note: Note): void {
    this.viewOpen.set(true);
    this.viewingNote.set(null);
    this.viewError.set(null);
    this.viewLoading.set(true);
    this.voted.set(false);
    this.voteError.set(null);
    this.notesSvc.get(note.id).subscribe({
      next: (res) => {
        this.viewingNote.set(res.data);
        this.viewLoading.set(false);
      },
      error: (err) => {
        this.viewError.set(err?.error?.message ?? 'Não foi possível abrir a nota.');
        this.viewLoading.set(false);
      }
    });
  }

  closeViewModal(): void {
    this.viewOpen.set(false);
    this.viewingNote.set(null);
    this.viewError.set(null);
    this.viewLoading.set(false);
    this.voted.set(false);
    this.voteError.set(null);
  }

  toggleVote(): void {
    const note = this.viewingNote();
    if (!note || this.voting()) {
      return;
    }
    this.voting.set(true);
    this.voteError.set(null);
    this.notesSvc.vote(note.id).subscribe({
      next: (res) => {
        this.viewingNote.set({ ...note, upvotes_count: res.data.upvotes_count });
        this.voted.set(res.voted);
        this.voting.set(false);
      },
      error: (err) => {
        this.voteError.set(err?.error?.message ?? 'Não foi possível votar nesta nota.');
        this.voting.set(false);
      }
    });
  }

  openPublishModal(note: Note): void {
    this.publishingNote.set(note);
    this.publishTarget.set('subject');
    this.publishCourseId.set('');
    this.publishSubjectId.set('');
    this.publishSubjects.set([]);
    this.publishError.set(null);
  }

  onPublishCourseChange(courseId: string): void {
    this.publishCourseId.set(courseId);
    this.publishSubjectId.set('');
    this.publishSubjects.set([]);
    if (!courseId) {
      return;
    }
    this.publishSubjectsLoading.set(true);
    this.journey.curriculum(courseId).subscribe({
      next: (res) => {
        const subjects = res.data.periods.flatMap((p) => p.subjects);
        this.publishSubjects.set(subjects.length > 0 ? subjects : MOCK_SUBJECTS);
        this.publishSubjectsLoading.set(false);
      },
      error: () => {
        this.publishSubjects.set(MOCK_SUBJECTS);
        this.publishSubjectsLoading.set(false);
      }
    });
  }

  closePublishModal(): void {
    this.publishingNote.set(null);
  }

  confirmPublish(): void {
    const note = this.publishingNote();
    if (!note) {
      return;
    }
    this.publishing.set(true);
    this.publishError.set(null);
    this.notesSvc
      .changeVisibility(note.id, {
        visibility: this.publishTarget(),
        subject_id: this.publishSubjectId() || undefined
      })
      .subscribe({
        next: () => {
          this.publishing.set(false);
          this.publishingNote.set(null);
          this.load();
        },
        error: (err) => {
          this.publishing.set(false);
          this.publishError.set(err?.error?.message ?? 'Não foi possível publicar a nota.');
        }
      });
  }

  unpublish(note: Note): void {
    this.notesSvc.changeVisibility(note.id, { visibility: 'private' }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.message ?? 'Não foi possível despublicar a nota.')
    });
  }
}
