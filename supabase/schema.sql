-- GuruKBC v1: multi-school foundation for Supabase PostgreSQL.
-- Apply with `supabase db reset` locally or through a migration in production.

create extension if not exists "pgcrypto";

create type public.school_role as enum ('owner', 'admin', 'teacher', 'principal');
create type public.document_status as enum ('draft', 'generated', 'archived');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null, npsn text, nsm text, address text, email text,
  principal_name text, logo_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (npsn), unique (nsm)
);

create table public.school_memberships (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.school_role not null default 'teacher',
  joined_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nip_nuptk text, education text, position text, signature_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  name text not null, start_date date not null, end_date date not null, is_active boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date > start_date), unique (school_id, name)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  name text not null, code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (school_id, name)
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null, grade_level text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (academic_year_id, name)
);

create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null, weekly_hours smallint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (weekly_hours >= 0), unique (teacher_id, classroom_id, subject_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  full_name text not null, nisn text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (school_id, nisn)
);

create table public.academic_calendar_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  title text not null, event_type text not null default 'holiday', start_date date not null, end_date date not null,
  is_effective_day boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date >= start_date)
);

create table public.effective_days (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade, semester smallint not null,
  month_date date not null, effective_days smallint not null, calculated_at timestamptz not null default now(), check (semester in (1,2)), check (effective_days >= 0), unique (academic_year_id, semester, month_date)
);

create table public.effective_weeks (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade, semester smallint not null,
  week_number smallint not null, start_date date not null, end_date date not null, effective_hours smallint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (semester in (1,2)), unique (academic_year_id, semester, week_number)
);

create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  assignment_id uuid not null references public.teaching_assignments(id) on delete cascade, code text, description text not null, sequence smallint not null default 1, lesson_hours smallint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (assignment_id, sequence)
);

-- Each document entity owns current structured content. Immutable outputs live in document_versions.
create table public.learning_documents (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  assignment_id uuid not null references public.teaching_assignments(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  document_type text not null check (document_type in ('prota','promes','kktp','module','assessment')),
  title text not null, content jsonb not null default '{}'::jsonb, status public.document_status not null default 'draft',
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (assignment_id, academic_year_id, document_type)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.learning_documents(id) on delete cascade,
  version_number integer not null, content jsonb not null, pdf_path text, docx_path text, generated_by uuid not null references auth.users(id), generated_at timestamptz not null default now(), unique (document_id, version_number)
);

create table public.document_templates (
  id uuid primary key default gen_random_uuid(), school_id uuid references public.schools(id) on delete cascade,
  document_type text not null, name text not null, content jsonb not null default '{}'::jsonb, is_default boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key, school_id uuid references public.schools(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null, entity_type text not null, entity_id uuid, action text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index on public.school_memberships(user_id); create index on public.teacher_profiles(school_id); create index on public.academic_calendar_events(academic_year_id, start_date); create index on public.learning_documents(school_id, document_type); create index on public.audit_logs(school_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create or replace function public.create_school_owner() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.school_memberships (school_id, user_id, role) values (new.id, new.created_by, 'owner'); return new; end; $$;
create or replace function public.is_school_member(target_school_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.school_memberships where school_id = target_school_id and user_id = auth.uid()); $$;
create or replace function public.can_manage_school(target_school_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.school_memberships where school_id = target_school_id and user_id = auth.uid() and role in ('owner','admin','principal')); $$;

create trigger user_profiles_updated before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger schools_create_owner after insert on public.schools for each row execute function public.create_school_owner();
create trigger schools_updated before update on public.schools for each row execute function public.set_updated_at();
create trigger teacher_profiles_updated before update on public.teacher_profiles for each row execute function public.set_updated_at();
create trigger academic_years_updated before update on public.academic_years for each row execute function public.set_updated_at();
create trigger subjects_updated before update on public.subjects for each row execute function public.set_updated_at();
create trigger classrooms_updated before update on public.classrooms for each row execute function public.set_updated_at();
create trigger assignments_updated before update on public.teaching_assignments for each row execute function public.set_updated_at();
create trigger students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger calendar_updated before update on public.academic_calendar_events for each row execute function public.set_updated_at();
create trigger weeks_updated before update on public.effective_weeks for each row execute function public.set_updated_at();
create trigger objectives_updated before update on public.learning_objectives for each row execute function public.set_updated_at();
create trigger documents_updated before update on public.learning_documents for each row execute function public.set_updated_at();
create trigger templates_updated before update on public.document_templates for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security; alter table public.schools enable row level security; alter table public.school_memberships enable row level security;
alter table public.teacher_profiles enable row level security; alter table public.academic_years enable row level security; alter table public.subjects enable row level security; alter table public.classrooms enable row level security; alter table public.teaching_assignments enable row level security; alter table public.students enable row level security; alter table public.academic_calendar_events enable row level security; alter table public.effective_days enable row level security; alter table public.effective_weeks enable row level security; alter table public.learning_objectives enable row level security; alter table public.learning_documents enable row level security; alter table public.document_versions enable row level security; alter table public.document_templates enable row level security; alter table public.audit_logs enable row level security;

create policy "users manage own profile" on public.user_profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "members view schools" on public.schools for select using (public.is_school_member(id));
create policy "users create schools" on public.schools for insert with check (created_by = auth.uid());
create policy "managers update schools" on public.schools for update using (public.can_manage_school(id));
create policy "members view memberships" on public.school_memberships for select using (public.is_school_member(school_id));
create policy "managers manage memberships" on public.school_memberships for all using (public.can_manage_school(school_id)) with check (public.can_manage_school(school_id));

-- Standard tenant isolation. Teachers may edit their own profile; managers can manage school data.
create policy "members view teacher profiles" on public.teacher_profiles for select using (public.is_school_member(school_id));
create policy "teachers edit own profile" on public.teacher_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_school_member(school_id));
create policy "members access academic years" on public.academic_years for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access subjects" on public.subjects for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access classrooms" on public.classrooms for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access assignments" on public.teaching_assignments for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access students" on public.students for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access calendar" on public.academic_calendar_events for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access effective days" on public.effective_days for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access effective weeks" on public.effective_weeks for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access objectives" on public.learning_objectives for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access documents" on public.learning_documents for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));
create policy "members access versions" on public.document_versions for all using (exists (select 1 from public.learning_documents d where d.id = document_id and public.is_school_member(d.school_id))) with check (exists (select 1 from public.learning_documents d where d.id = document_id and public.is_school_member(d.school_id)));
create policy "members access templates" on public.document_templates for all using (school_id is null or public.is_school_member(school_id)) with check (school_id is null or public.can_manage_school(school_id));
create policy "members view audit logs" on public.audit_logs for select using (public.is_school_member(school_id));
