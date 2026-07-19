import { supabase } from "./client";
import { createAuditLog } from "./queries";
import type { Profile } from "./types";

// ============================================
// Data Service - bridges localStorage API to Supabase
// ============================================

type Listener = (data: unknown) => void;

class DataService {
  private cache = new Map<string, unknown>();
  private listeners = new Map<string, Set<Listener>>();

  private getCached<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  private setCached<T>(key: string, value: T) {
    this.cache.set(key, value);
    this.notify(key, value);
  }

  private notify(key: string, value: unknown) {
    const listeners = this.listeners.get(key);
    if (listeners) listeners.forEach((fn) => fn(value));
  }

  subscribe(key: string, listener: Listener) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  // Generic get/set
  async get<T>(key: string): Promise<T> {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    // Map localStorage keys to Supabase tables
    const table = this.keyToTable(key);
    if (!table || !supabase) return {} as T;
    const { data } = await supabase.from(table).select("*").limit(1).maybeSingle();
    this.setCached(key, data ?? {});
    return (data ?? {}) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.setCached(key, value);
    const table = this.keyToTable(key);
    if (!table || !supabase) return;
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const schoolId = this.getSchoolId(userId);
    const payload = { ...value, school_id: schoolId, teacher_id: userId, updated_at: new Date().toISOString() };
    await supabase.from(table).upsert(payload);
    await createAuditLog({
      school_id: schoolId,
      user_id: userId,
      action: "update",
      table_name: table,
      record_id: (value as Record<string, unknown>).id as string ?? "",
      new_data: payload,
    });
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    // No-op for Supabase tables, use delete methods instead
  }

  private keyToTable(key: string): string | null {
    const map: Record<string, string> = {
      "gurukbc-prota": "prota",
      "gurukbc-promes": "promes",
      "gurukbc-kktp": "kktp",
      "gurukbc-teaching-modules": "teaching_modules",
      "gurukbc-assessments": "assessments",
      "gurukbc-effective-weeks": "effective_weeks",
      "gurukbc-effective-days": "effective_days",
      "gurukbc-academic-calendar": "academic_calendar",
      "gurukbc-school": "schools",
      "gurukbc-profile": "profiles",
    };
    return map[key] ?? null;
  }

  private async getSchoolId(userId: string): Promise<string> {
    const { data } = await supabase!.from("profiles").select("school_id").eq("id", userId).single();
    return (data as Profile)?.school_id ?? "";
  }
}

export const dataService = new DataService();
