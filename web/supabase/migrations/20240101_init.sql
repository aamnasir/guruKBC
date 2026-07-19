-- ============================================
-- GuruKBC Database Schema
-- Sprint 10: Full Supabase Integration
-- ============================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================
-- 1. Profiles (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  nip_nuptk text,
  phone text,
  education text,
  position text,
  signature_url text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster', 'super_admin')),
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can manage all profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 2. Schools
-- ============================================
create table public.schools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  npsn_nsm text,
  address text,
  headmaster_name text,
  logo_url text,
  assets jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.schools enable row level security;

create policy "Authenticated users can view schools" on public.schools for select using (auth.role() = 'authenticated');
create policy "Admins can manage schools" on public.schools for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 3. Academic Years
-- ============================================
create table public.academic_years (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  semester_1_start date,
  semester_1_end date,
  semester_2_start date,
  semester_2_end date,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.academic_years enable row level security;

create policy "Users can view academic years of their school" on public.academic_years for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = academic_years.school_id)
);
create policy "Admins can manage academic years" on public.academic_years for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 4. Subjects
-- ============================================
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subjects enable row level security;

create policy "Users can view subjects of their school" on public.subjects for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = subjects.school_id)
);
create policy "Admins can manage subjects" on public.subjects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 5. Classes
-- ============================================
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  name text not null,
  phase text,
  homeroom_teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.classes enable row level security;

create policy "Users can view classes of their school" on public.classes for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = classes.school_id)
);
create policy "Admins can manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 6. Teacher Classes (assignment)
-- ============================================
create table public.teacher_classes (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  weekly_hours int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(teacher_id, class_id, subject_id, academic_year_id)
);

alter table public.teacher_classes enable row level security;

create policy "Teachers can view own assignments" on public.teacher_classes for select using (auth.uid() = teacher_id);
create policy "Admins can manage teacher classes" on public.teacher_classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 7. Students
-- ============================================
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  full_name text not null,
  nis_nisn text,
  gender text check (gender in ('L', 'P')),
  birth_place text,
  birth_date date,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.students enable row level security;

create policy "Users can view students of their school" on public.students for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = students.school_id)
);
create policy "Admins can manage students" on public.students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 8. Academic Calendar
-- ============================================
create table public.academic_calendar (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  date date not null,
  type text not null check (type in ('school_day', 'holiday', 'event')),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.academic_calendar enable row level security;

create policy "Users can view calendar of their school" on public.academic_calendar for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = academic_calendar.school_id)
);
create policy "Admins can manage calendar" on public.academic_calendar for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 9. Effective Days
-- ============================================
create table public.effective_days (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  month date not null,
  effective_days int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(school_id, academic_year_id, month)
);

alter table public.effective_days enable row level security;

create policy "Users can view effective days of their school" on public.effective_days for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = effective_days.school_id)
);
create policy "Admins can manage effective days" on public.effective_days for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 10. Effective Weeks
-- ============================================
create table public.effective_weeks (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  week_number int not null,
  semester int not null check (semester in (1, 2)),
  start_date date,
  end_date date,
  effective_days int default 0,
  estimated_hours int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(school_id, academic_year_id, week_number, semester)
);

alter table public.effective_weeks enable row level security;

create policy "Users can view effective weeks of their school" on public.effective_weeks for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = effective_weeks.school_id)
);
create policy "Admins can manage effective weeks" on public.effective_weeks for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 11. Learning Objectives (TP)
-- ============================================
create table public.learning_objectives (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  code text not null,
  description text not null,
  semester int not null check (semester in (1, 2)),
  hours int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.learning_objectives enable row level security;

create policy "Teachers can view own objectives" on public.learning_objectives for select using (auth.uid() = teacher_id);
create policy "Teachers can manage own objectives" on public.learning_objectives for all using (auth.uid() = teacher_id);
create policy "Admins can view all objectives" on public.learning_objectives for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 12. PROTA
-- ============================================
create table public.prota (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  objectives jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prota enable row level security;

create policy "Teachers can manage own prota" on public.prota for all using (auth.uid() = teacher_id);
create policy "Admins can view all prota" on public.prota for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 13. PROMES
-- ============================================
create table public.promes (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  prota_id uuid references public.prota(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  allocations jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.promes enable row level security;

create policy "Teachers can manage own promes" on public.promes for all using (auth.uid() = teacher_id);
create policy "Admins can view all promes" on public.promes for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 14. KKTP
-- ============================================
create table public.kktp (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  promes_id uuid references public.promes(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  criteria jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kktp enable row level security;

create policy "Teachers can manage own kktp" on public.kktp for all using (auth.uid() = teacher_id);
create policy "Admins can view all kktp" on public.kktp for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 15. Teaching Modules
-- ============================================
create table public.teaching_modules (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  kktp_id uuid references public.kktp(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  modules jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teaching_modules enable row level security;

create policy "Teachers can manage own modules" on public.teaching_modules for all using (auth.uid() = teacher_id);
create policy "Admins can view all modules" on public.teaching_modules for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 16. Assessments
-- ============================================
create table public.assessments (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  kktp_id uuid references public.kktp(id) on delete cascade,
  meta jsonb default '{}'::jsonb,
  assessments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.assessments enable row level security;

create policy "Teachers can manage own assessments" on public.assessments for all using (auth.uid() = teacher_id);
create policy "Admins can view all assessments" on public.assessments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 17. Generated Documents (Archive)
-- ============================================
create table public.generated_documents (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  source_type text not null,
  -- Some planning documents are persisted locally before they receive a database UUID.
  -- Keep the source reference flexible so every generated document can be archived.
  source_id text not null,
  version int not null default 1,
  label text,
  data jsonb not null,
  file_url text,
  created_at timestamptz default now()
);

alter table public.generated_documents enable row level security;

create policy "Teachers can view own documents" on public.generated_documents for select using (auth.uid() = teacher_id);
create policy "Teachers can create documents" on public.generated_documents for insert with check (auth.uid() = teacher_id);
create policy "Admins can view all documents" on public.generated_documents for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 18. Audit Log
-- ============================================
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs of their school" on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin') and school_id = audit_logs.school_id)
);
create policy "System can insert audit logs" on public.audit_logs for insert with check (true);

-- ============================================
-- 19. School Assets (Storage metadata)
-- ============================================
create table public.school_assets (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo', 'signature', 'template', 'export')),
  file_name text not null,
  file_path text not null,
  file_size int,
  mime_type text,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.school_assets enable row level security;

create policy "Users can view assets of their school" on public.school_assets for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = school_assets.school_id)
);
create policy "Admins can manage assets" on public.school_assets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- 20. Document Templates
-- ============================================
create table public.document_templates (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  type text not null,
  content jsonb default '{}'::jsonb,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.document_templates enable row level security;

create policy "Users can view templates of their school" on public.document_templates for select using (
  exists (select 1 from public.profiles where id = auth.uid() and school_id = document_templates.school_id)
);
create policy "Admins can manage templates" on public.document_templates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- ============================================
-- Functions
-- ============================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for updated_at
create trigger set_updated_at before update on
  public.profiles,
  public.schools,
  public.academic_years,
  public.subjects,
  public.classes,
  public.teacher_classes,
  public.students,
  public.academic_calendar,
  public.effective_days,
  public.effective_weeks,
  public.learning_objectives,
  public.prota,
  public.promes,
  public.kktp,
  public.teaching_modules,
  public.assessments,
  public.generated_documents,
  public.school_assets,
  public.document_templates
  for each row execute function public.handle_updated_at();

-- Trigger for new user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Storage Buckets
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('school-assets', 'school-assets', false, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']),
  ('exports', 'exports', false, 10485760, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
  on conflict (id) do nothing;

-- Storage policies
create policy "Users can view assets of their school" on storage.objects for select using (
  bucket_id = 'school-assets' and
  exists (select 1 from public.profiles where id = auth.uid() and school_id = (storage.folders(name))[1]::uuid)
);

create policy "Admins can upload school assets" on storage.objects for insert with check (
  bucket_id = 'school-assets' and
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "Admins can update school assets" on storage.objects for update using (
  bucket_id = 'school-assets' and
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "Admins can delete school assets" on storage.objects for delete using (
  bucket_id = 'school-assets' and
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "Users can view exports" on storage.objects for select using (
  bucket_id = 'exports' and auth.uid()::text = (storage.folders(name))[1]
);

create policy "Users can upload exports" on storage.objects for insert with check (
  bucket_id = 'exports' and auth.uid()::text = (storage.folders(name))[1]
);

-- ============================================
-- Seed Data (optional)
-- ============================================

-- Create a default school for testing
-- insert into public.schools (name, npsn_nsm, address, headmaster_name)
-- values ('Madrasah Test', '123456789', 'Alamat test', 'Kepala Madrasah Test');
