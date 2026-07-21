import { supabase } from "./client";
import type {
  Profile, School, AcademicYear, Subject, Class, TeacherClass, Student,
  AcademicCalendarEntry, EffectiveDay, EffectiveWeek, LearningObjective,
  Prota, Promes, Kktp, TeachingModule, Assessment, GeneratedDocument,
  AuditLog, SchoolAsset
} from "./types";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================
// Auth & User
// ============================================

export async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email: string, password: string, fullName: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function resetPassword(email: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.resetPasswordForEmail(email);
}

export async function updateProfile(updates: Partial<Profile>) {
  const user = await getUser();
  if (!user) return { data: null, error: new Error('No user found') };
  return await supabase!.from("profiles").update(updates).eq("id", user.id).select().single();
}

// ============================================
// Audit Logs
// ============================================

export async function createAuditLog(log: Omit<AuditLog, "id" | "created_at">) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("audit_logs").insert(log).select().single();
}

// ============================================
// Generated Documents
// ============================================

export async function getGeneratedDocuments(teacherId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("generated_documents").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
}

export async function createGeneratedDocument(doc: Omit<GeneratedDocument, "id" | "created_at">) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("generated_documents").insert(doc).select().single();
}

// ============================================
// Bank Tema / Topik / TP (Kurikulum Berbasis Cinta)
// ============================================

export async function getCurriculumBank(subjectName: string, phase: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase
    .from("curriculum_themes")
    .select("id,subject_name,phase,name,sequence,curriculum_topics(id,theme_id,name,sequence,curriculum_objectives(id,topic_id,code,description,sequence))")
    .eq("subject_name", subjectName)
    .eq("phase", phase)
    .order("sequence");
}

// ============================================
// School Assets (logo & tanda tangan)
// ============================================

export async function getUserMembership(): Promise<{ schoolId: string; role: string } | null> {
  if (!supabase) return null;
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("school_memberships")
    .select("school_id, role")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { schoolId: (data as { school_id: string }).school_id, role: (data as { role: string }).role };
}

export async function getUserSchoolId(): Promise<string | null> {
  const membership = await getUserMembership();
  return membership?.schoolId ?? null;
}

export async function getSchoolAssets(schoolId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("school_assets").select("*").eq("school_id", schoolId);
}

export async function upsertSchoolAsset(asset: Omit<SchoolAsset, "id" | "created_at" | "updated_at">) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("school_assets").upsert(asset, { onConflict: "school_id,asset_type" }).select().single();
}

export async function deleteSchoolAsset(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.from("school_assets").delete().eq("id", id);
}

export async function uploadSchoolAssetFile(schoolId: string, assetType: string, file: File) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const ext = file.name.split(".").pop() || "png";
  const path = `${schoolId}/${assetType}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("school-assets").upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { data: null, error };
  const { data } = supabase.storage.from("school-assets").getPublicUrl(path);
  return { data: { path, publicUrl: data.publicUrl }, error: null };
}

export function getSchoolAssetPublicUrl(path: string): string {
  if (!supabase) return "";
  return supabase.storage.from("school-assets").getPublicUrl(path).data.publicUrl;
}

export async function removeSchoolAssetFile(path: string) {
  if (!supabase) return { error: new Error('Supabase client not initialized') };
  return await supabase.storage.from("school-assets").remove([path]);
}

// ============================================
// Langganan / Freemium (uji coba 7 hari atau 5 dokumen)
// ============================================

export type UserSubscription = {
  user_id: string;
  plan: "free" | "pro";
  trial_started_at: string;
  documents_created: number;
};

export async function getSubscription() {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const user = await getUser();
  if (!user) return { data: null, error: new Error('Belum masuk') };
  return await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).maybeSingle();
}

export async function incrementDocumentCount() {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.rpc("increment_document_count");
}

// ============================================
// Realtime Subscriptions
// ============================================

export function subscribeToTable<T extends { [key: string]: any }>(
  table: string, 
  filter: string, 
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  if (!supabase) return { unsubscribe: () => {} };

  const channel = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: table, filter: filter },
      (payload: RealtimePostgresChangesPayload<T>) => callback(payload as RealtimePostgresChangesPayload<T>)
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase?.removeChannel(channel);
    },
  };
}

export async function subscribeToProfile(callback: (profile: Profile | null) => void) {
  const user = await getUser();
  if (!user) return { unsubscribe: () => {} };

  return subscribeToTable<Profile>(
    "profiles", 
    `id=eq.${user.id}`, 
    (payload) => {
      if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
        callback(payload.new as Profile);
      } else if (payload.eventType === "DELETE") {
        callback(null);
      }
    }
  );
}