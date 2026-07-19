export interface SchoolStatus {
  id: string;
  name: string;
  npsn_nsm: string | null;
  address: string | null;
  headmaster_name: string | null;
  logo_url: string | null;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  semester_1_start: string | null;
  semester_1_end: string | null;
  semester_2_start: string | null;
  semester_2_end: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  phase: string | null;
  homeroom_teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  weekly_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  full_name: string;
  nis_nisn: string | null;
  gender: "L" | "P" | null;
  birth_place: string | null;
  birth_date: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicCalendarEntry {
  id: string;
  school_id: string;
  academic_year_id: string;
  date: string;
  type: "school_day" | "holiday" | "event";
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffectiveDay {
  id: string;
  school_id: string;
  academic_year_id: string;
  month: string;
  effective_days: number;
  created_at: string;
  updated_at: string;
}

export interface EffectiveWeek {
  id: string;
  school_id: string;
  academic_year_id: string;
  week_number: number;
  semester: 1 | 2;
  start_date: string | null;
  end_date: string | null;
  effective_days: number;
  estimated_hours: number;
  created_at: string;
  updated_at: string;
}

export interface LearningObjective {
  id: string;
  school_id: string;
  academic_year_id: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  code: string;
  description: string;
  semester: 1 | 2;
  hours: number;
  created_at: string;
  updated_at: string;
}

export interface Prota {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  meta: Record<string, unknown>;
  objectives: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface Promes {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  prota_id: string;
  meta: Record<string, unknown>;
  allocations: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface Kktp {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  promes_id: string;
  meta: Record<string, unknown>;
  criteria: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface TeachingModule {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  kktp_id: string;
  meta: Record<string, unknown>;
  modules: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  kktp_id: string;
  meta: Record<string, unknown>;
  assessments: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  id: string;
  school_id: string;
  teacher_id: string;
  source_type: string;
  source_id: string;
  version: number;
  label: string | null;
  data: Record<string, unknown>;
  file_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  school_id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SchoolAsset {
  id: string;
  school_id: string;
  asset_type: "logo" | "signature" | "template" | "export";
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  school_id: string;
  name: string;
  type: string;
  content: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  nip_nuptk: string | null;
  phone: string | null;
  education: string | null;
  position: string | null;
  signature_url: string | null;
  role: "admin" | "teacher" | "headmaster" | "super_admin";
  school_id: string | null;
  created_at: string;
  updated_at: string;
}
