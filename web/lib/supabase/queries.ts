import { supabase } from "./client";
import type {
  Profile, School, AcademicYear, Subject, Class, TeacherClass, Student,
  AcademicCalendarEntry, EffectiveDay, EffectiveWeek, LearningObjective,
  Prota, Promes, Kktp, TeachingModule, Assessment, GeneratedDocument,
  AuditLog, SchoolAsset, DocumentTemplate
} from "./types";

// ============================================
// Auth
// ============================================

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase!.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase!.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase!.auth.getUser();
  return user;
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase!.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase!.auth.updateUser({ password: newPassword });
  return { data, error };
}

export async function updateProfile(updates: Partial<Profile>) {
  const { data, error } = await supabase!.from("profiles").update(updates).eq("id", (await getUser())?.id).select().single();
  return { data, error };
}

// ============================================
// Schools
// ============================================

export async function getSchools() {
  const { data, error } = await supabase!.from("schools").select("*").order("name");
  return { data, error };
}

export async function getSchool(id: string) {
  const { data, error } = await supabase!.from("schools").select("*").eq("id", id).single();
  return { data, error };
}

export async function createSchool(school: Omit<School, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("schools").insert(school).select().single();
  return { data, error };
}

export async function updateSchool(id: string, updates: Partial<School>) {
  const { data, error } = await supabase!.from("schools").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteSchool(id: string) {
  const { error } = await supabase!.from("schools").delete().eq("id", id);
  return { error };
}

// ============================================
// Academic Years
// ============================================

export async function getAcademicYears(schoolId: string) {
  const { data, error } = await supabase!.from("academic_years").select("*").eq("school_id", schoolId).order("start_date", { ascending: false });
  return { data, error };
}

export async function getActiveAcademicYear(schoolId: string) {
  const { data, error } = await supabase!.from("academic_years").select("*").eq("school_id", schoolId).eq("is_active", true).single();
  return { data, error };
}

export async function createAcademicYear(year: Omit<AcademicYear, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("academic_years").insert(year).select().single();
  return { data, error };
}

export async function updateAcademicYear(id: string, updates: Partial<AcademicYear>) {
  const { data, error } = await supabase!.from("academic_years").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteAcademicYear(id: string) {
  const { error } = await supabase!.from("academic_years").delete().eq("id", id);
  return { error };
}

// ============================================
// Subjects
// ============================================

export async function getSubjects(schoolId: string) {
  const { data, error } = await supabase!.from("subjects").select("*").eq("school_id", schoolId).order("name");
  return { data, error };
}

export async function createSubject(subject: Omit<Subject, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("subjects").insert(subject).select().single();
  return { data, error };
}

export async function updateSubject(id: string, updates: Partial<Subject>) {
  const { data, error } = await supabase!.from("subjects").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteSubject(id: string) {
  const { error } = await supabase!.from("subjects").delete().eq("id", id);
  return { error };
}

// ============================================
// Classes
// ============================================

export async function getClasses(schoolId: string, academicYearId?: string) {
  let query = supabase!.from("classes").select("*").eq("school_id", schoolId);
  if (academicYearId) query = query.eq("academic_year_id", academicYearId);
  const { data, error } = query.order("name");
  return { data, error };
}

export async function createSubjectClass(klass: Omit<Class, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("classes").insert(klass).select().single();
  return { data, error };
}

export async function updateSubjectClass(id: string, updates: Partial<Class>) {
  const { data, error } = await supabase!.from("classes").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteSubjectClass(id: string) {
  const { error } = await supabase!.from("classes").delete().eq("id", id);
  return { error };
}

// ============================================
// Teacher Classes
// ============================================

export async function getTeacherClasses(teacherId: string) {
  const { data, error } = await supabase!.from("teacher_classes").select("*, class:classes(*), subject:subjects(*)").eq("teacher_id", teacherId);
  return { data, error };
}

export async function createTeacherClass(assignment: Omit<TeacherClass, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("teacher_classes").insert(assignment).select().single();
  return { data, error };
}

export async function updateTeacherClass(id: string, updates: Partial<TeacherClass>) {
  const { data, error } = await supabase!.from("teacher_classes").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteTeacherClass(id: string) {
  const { error } = await supabase!.from("teacher_classes").delete().eq("id", id);
  return { error };
}

// ============================================
// Students
// ============================================

export async function getStudents(schoolId: string, classId?: string) {
  let query = supabase!.from("students").select("*").eq("school_id", schoolId);
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = query.order("full_name");
  return { data, error };
}

export async function createStudent(student: Omit<Student, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("students").insert(student).select().single();
  return { data, error };
}

export async function updateStudent(id: string, updates: Partial<Student>) {
  const { data, error } = await supabase!.from("students").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteStudent(id: string) {
  const { error } = await supabase!.from("students").delete().eq("id", id);
  return { error };
}

// ============================================
// Academic Calendar
// ============================================

export async function getAcademicCalendar(schoolId: string, academicYearId: string) {
  const { data, error } = await supabase!.from("academic_calendar").select("*").eq("school_id", schoolId).eq("academic_year_id", academicYearId).order("date");
  return { data, error };
}

export async function createCalendarEntry(entry: Omit<AcademicCalendarEntry, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("academic_calendar").insert(entry).select().single();
  return { data, error };
}

export async function updateCalendarEntry(id: string, updates: Partial<AcademicCalendarEntry>) {
  const { data, error } = await supabase!.from("academic_calendar").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteCalendarEntry(id: string) {
  const { error } = await supabase!.from("academic_calendar").delete().eq("id", id);
  return { error };
}

// ============================================
// Effective Days
// ============================================

export async function getEffectiveDays(schoolId: string, academicYearId: string) {
  const { data, error } = await supabase!.from("effective_days").select("*").eq("school_id", schoolId).eq("academic_year_id", academicYearId).order("month");
  return { data, error };
}

export async function upsertEffectiveDay(day: Omit<EffectiveDay, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("effective_days").upsert(day, { onConflict: "school_id,academic_year_id,month" }).select().single();
  return { data, error };
}

// ============================================
// Effective Weeks
// ============================================

export async function getEffectiveWeeks(schoolId: string, academicYearId: string) {
  const { data, error } = await supabase!.from("effective_weeks").select("*").eq("school_id", schoolId).eq("academic_year_id", academicYearId).order("week_number");
  return { data, error };
}

export async function upsertEffectiveWeek(week: Omit<EffectiveWeek, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("effective_weeks").upsert(week, { onConflict: "school_id,academic_year_id,week_number,semester" }).select().single();
  return { data, error };
}

// ============================================
// Learning Objectives
// ============================================

export async function getLearningObjectives(teacherId: string) {
  const { data, error } = await supabase!.from("learning_objectives").select("*").eq("teacher_id", teacherId).order("semester");
  return { data, error };
}

export async function createLearningObjective(objective: Omit<LearningObjective, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("learning_objectives").insert(objective).select().single();
  return { data, error };
}

export async function updateLearningObjective(id: string, updates: Partial<LearningObjective>) {
  const { data, error } = await supabase!.from("learning_objectives").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteLearningObjective(id: string) {
  const { error } = await supabase!.from("learning_objectives").delete().eq("id", id);
  return { error };
}

// ============================================
// PROTA
// ============================================

export async function getProta(teacherId: string) {
  const { data, error } = await supabase!.from("prota").select("*").eq("teacher_id", teacherId).single();
  return { data, error };
}

export async function upsertProta(prota: Omit<Prota, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("prota").upsert(prota).select().single();
  return { data, error };
}

// ============================================
// PROMES
// ============================================

export async function getPromes(teacherId: string) {
  const { data, error } = await supabase!.from("promes").select("*").eq("teacher_id", teacherId).single();
  return { data, error };
}

export async function upsertPromes(promes: Omit<Promes, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("promes").upsert(promes).select().single();
  return { data, error };
}

// ============================================
// KKTP
// ============================================

export async function getKktp(teacherId: string) {
  const { data, error } = await supabase!.from("kktp").select("*").eq("teacher_id", teacherId).single();
  return { data, error };
}

export async function upsertKktp(kktp: Omit<Kktp, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("kktp").upsert(kktp).select().single();
  return { data, error };
}

// ============================================
// Teaching Modules
// ============================================

export async function getTeachingModules(teacherId: string) {
  const { data, error } = await supabase!.from("teaching_modules").select("*").eq("teacher_id", teacherId).single();
  return { data, error };
}

export async function upsertTeachingModule(module: Omit<TeachingModule, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("teaching_modules").upsert(module).select().single();
  return { data, error };
}

// ============================================
// Assessments
// ============================================

export async function getAssessments(teacherId: string) {
  const { data, error } = await supabase!.from("assessments").select("*").eq("teacher_id", teacherId).single();
  return { data, error };
}

export async function upsertAssessment(assessment: Omit<Assessment, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("assessments").upsert(assessment).select().single();
  return { data, error };
}

// ============================================
// Generated Documents
// ============================================

export async function getGeneratedDocuments(teacherId: string) {
  const { data, error } = await supabase!.from("generated_documents").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
  return { data, error };
}

export async function createGeneratedDocument(doc: Omit<GeneratedDocument, "id" | "created_at">) {
  const { data, error } = await supabase!.from("generated_documents").insert(doc).select().single();
  return { data, error };
}

export async function deleteGeneratedDocument(id: string) {
  const { error } = await supabase!.from("generated_documents").delete().eq("id", id);
  return { error };
}

// ============================================
// Audit Logs
// ============================================

export async function createAuditLog(log: Omit<AuditLog, "id" | "created_at">) {
  const { data, error } = await supabase!.from("audit_logs").insert(log).select().single();
  return { data, error };
}

export async function getAuditLogs(schoolId: string, limit = 100) {
  const { data, error } = await supabase!.from("audit_logs").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(limit);
  return { data, error };
}

// ============================================
// School Assets (Storage)
// ============================================

export async function uploadSchoolAsset(bucket: string, path: string, file: File) {
  const { data, error } = await supabase!.storage.from(bucket).upload(path, file, { upsert: true });
  return { data, error };
}

export async function getSchoolAssetUrl(bucket: string, path: string) {
  const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteSchoolAsset(bucket: string, path: string) {
  const { error } = await supabase!.storage.from(bucket).remove([path]);
  return { error };
}

export async function createSchoolAsset(asset: Omit<SchoolAsset, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase!.from("school_assets").insert(asset).select().single();
  return { data, error };
}

export async function getSchoolAssets(schoolId: string, assetType?: string) {
  let query = supabase!.from("school_assets").select("*").eq("school_id", schoolId);
  if (assetType) query = query.eq("asset_type", assetType);
  const { data, error } = query.order("created_at", { ascending: false });
  return { data, error };
}

// ============================================
// Realtime Subscriptions
// ============================================

export function subscribeToTable<T>(
  table: string,
  callback: (payload: { eventType: string; new: T; old: T | null }) => void,
  filter?: string
) {
  if (!supabase) return { unsubscribe: () => {} };
  const channel = supabase
    .channel(`public:${table}`)
    .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, callback)
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
}

export async function subscribeToProfile(callback: (profile: Profile | null) => void) {
  const userId = (await getUser())?.id;
  return subscribeToTable<Profile>("profiles", (payload) => {
    if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") callback(payload.new as Profile);
    else if (payload.eventType === "DELETE") callback(null);
  }, `id=eq.${userId}`);
}
