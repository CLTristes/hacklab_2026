// Modelos derivados do OpenAPI da CampusOS API (/docs/api)

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  role_label?: string;
  registration_number?: string;
  entity_id?: string;
  enabled_modules?: string[];
  email_verified?: boolean;
}

export interface AuthResponse {
  data: AuthUser;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  entity_id?: string;
  device?: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  device?: string;
}

export interface VerifyEmailPayload {
  code: string;
}

export type DocumentKind = 'transcript' | 'enrollment_request';

export interface AcademicDocumentUploadResponse {
  data: {
    id: string;
    status: string;
    status_label: string;
    is_pending: boolean;
  };
}

export interface ExtractionLine {
  code: string;
  year: number;
  period: number;
  status: string;
  grade?: number;
  attendance?: number;
}

export interface AcademicDocumentStatus {
  data: {
    id: string;
    status: string;
    status_label: string;
    is_pending: boolean;
    extraction?: {
      lines: ExtractionLine[];
    };
  };
}

export interface ConfirmDocumentPayload {
  registration_id?: string;
  lines: ExtractionLine[];
}

export interface ConfirmDocumentResponse {
  data: { id: string; status: string };
  imported: number;
  pending: { code: string; reason: string }[];
}

export type SubjectNature = 'mandatory' | 'elective';

export interface PendingSubject {
  id: string;
  code: string;
  name: string;
  term: number;
  hours: number;
  weekly_hours: number;
  extension_hours: number;
  nature: SubjectNature;
  nature_label: string;
  in_progress: boolean;
}

export interface ProgressResponse {
  data: {
    overall?: { required_hours: number; completed_hours: number };
    pending_subjects?: PendingSubject[];
    [key: string]: unknown;
  };
}

export interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface CurriculumPeriod {
  period: number;
  subjects: CurriculumSubject[];
  [key: string]: unknown;
}

export interface CurriculumResponse {
  data: {
    workload: {
      mandatory: number;
      elective: number;
      standalone_extension: number;
      total_hours: number;
      extension_hours?: number;
      extension_counts_in_total: boolean;
    };
    periods: CurriculumPeriod[];
    [key: string]: unknown;
  };
}

export interface Course {
  id: string;
  code: string;
  name: string;
  degree: string;
  degree_label: string;
  shift: string;
  shift_label: string;
  campus: { id: string; code: string; name: string };
}

export interface CoursesResponse {
  data: Course[];
}

export interface CurrentTermSubject {
  enrollment_id: string;
  subject: { id: string; code: string; name: string };
  status: string;
  status_label: string;
  offering: {
    id: string;
    class_code: string;
    professor_name: string;
    schedule: string | null;
  };
}

export interface CurrentTermResponse {
  data: {
    term: {
      id: string;
      year: number;
      period: number;
      label: string;
      status: string;
      status_label: string;
    } | null;
    subjects: CurrentTermSubject[];
  };
}

export interface NextTermSubject {
  code: string;
  name: string;
}

export interface BlockedSubject extends NextTermSubject {
  blocked_by: {
    type: string;
    subject: NextTermSubject;
    reason: string;
  }[];
}

export interface NextTermResponse {
  data: {
    current_period: number;
    eligible: NextTermSubject[];
    blocked: BlockedSubject[];
  };
}

export interface SimulatePayload {
  fail: string[];
}

export interface SimulateResponse {
  data: {
    failed: string[];
    current_period: number;
    affected_subjects: {
      subject: NextTermSubject;
      real_earliest_period: number;
      simulated_earliest_period: number;
      delay_terms: number;
    }[];
    estimated_graduation_delay_terms: number;
  };
}

export interface AgendaItem {
  id: string;
  title: string;
  due_at: string;
  visibility: string;
  adopted: boolean;
}

export interface AgendaResponse {
  data: AgendaItem[];
}

export type TaskKind = 'exam' | 'assignment' | 'reading' | 'personal';
export type TaskVisibility = 'private' | 'offering' | 'subject' | 'course' | 'institution';

export interface CreateTaskPayload {
  title: string;
  description_md?: string;
  kind: TaskKind;
  due_at?: string;
  visibility?: TaskVisibility;
  subject_id?: string;
  offering_id?: string;
}

export interface TaskResponse {
  data: {
    id: string;
    title: string;
    visibility: TaskVisibility;
    [key: string]: unknown;
  };
}

export type NoteKind = 'summary' | 'past_exam' | 'solved_exercise_list' | 'material' | 'tip';
export type NoteVisibility = 'private' | 'offering' | 'subject' | 'course' | 'institution';

export interface Note {
  id: string;
  title: string;
  kind: NoteKind;
  visibility: NoteVisibility;
  upvotes_count: number;
  author: { id: string; name: string };
  term?: { year: number; period: number };
}

export interface NoteVoteResponse {
  data: { id: string; upvotes_count: number };
  voted: boolean;
}

export interface NotesResponse {
  data: Note[];
}

export interface NoteDetailResponse {
  data: Note & { body_md: string };
}

export interface CreateNotePayload {
  title: string;
  body_md: string;
  kind: NoteKind;
  subject_id?: string;
  offering_id?: string;
  course_id?: string;
  term_id?: string;
}

export interface CreateNoteResponse {
  data: { id: string; title: string; visibility: NoteVisibility };
}

export interface ChangeNoteVisibilityPayload {
  visibility: NoteVisibility;
  subject_id?: string;
}

export interface ChangeNoteVisibilityResponse {
  data: { id: string; visibility: NoteVisibility };
}

export interface ComplementaryActivity {
  id: string;
  title: string;
  hours_claimed: number;
  hours_counted?: number;
  issued_at?: string;
  category?: { id: string; name: string };
  [key: string]: unknown;
}

export interface ComplementaryCategorySummary {
  category: { id: string; name: string };
  declared_hours: number;
  counted_hours: number;
  hours_not_counted: number;
  [key: string]: unknown;
}

export interface ComplementaryActivitiesResponse {
  data: ComplementaryActivity[];
  summary: ComplementaryCategorySummary[];
}

export interface CreateComplementaryActivityResponse {
  data: { id: string; hours_claimed: number };
  capped: boolean;
  hours_not_counted: number;
}

export interface Bottleneck {
  subject_code: string;
  subject_name: string;
  total_attempts: number;
  failed_grade: number;
  failed_absence: number;
  failed_both: number;
  failure_rate: number;
}

export interface BottlenecksResponse {
  data: Bottleneck[];
}

export interface Cohort {
  entry_term: string;
  active_registrations: number;
  avg_delay_terms: number;
}

export interface CohortsResponse {
  data: Cohort[];
}

export interface AtRiskResponse {
  data: { count: number; within_terms: number };
}

export interface Demand {
  subject_code: string;
  subject_name: string;
  demand: number;
}

export interface DemandResponse {
  data: Demand[];
}
