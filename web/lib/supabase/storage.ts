import { supabase } from "./client";
import { createAuditLog } from "./queries";

const BATCH_DEBOUNCE = 1000;

type Listener = (key: string, value: unknown) => void;

class SupabaseStorage {
  private cache = new Map<string, unknown>();
  private batch = new Map<string, unknown>();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();
  private cleanup = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key && e.newValue) this.cache.set(e.key, JSON.parse(e.newValue));
      });
    }
  }

  getItem<T>(key: string): T {
    if (this.cleanup) return {} as T;
    if (this.cache.has(key)) return this.cache.get(key) as T;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) { const parsed = JSON.parse(raw) as T; this.cache.set(key, parsed); return parsed; }
    } catch { /* ignore */ }
    return {} as T;
  }

  setItem(key: string, value: unknown): void {
    if (this.cleanup) return;
    this.cache.set(key, value);
    window.localStorage.setItem(key, JSON.stringify(value));
    this.batch.set(key, value);
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.batchTimer = setTimeout(() => this.flush(), BATCH_DEBOUNCE);
    this.listeners.forEach((fn) => fn(key, value));
  }

  removeItem(key: string): void {
    if (this.cleanup) return;
    this.cache.delete(key);
    window.localStorage.removeItem(key);
    this.batch.delete(key);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async flush() {
    if (this.cleanup || !supabase) return;
    try {
      const userData = await supabase.auth.getUser();
      const userId = userData.data.user?.id;
      if (!userId) return;
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", userId).maybeSingle();
      const schoolId = (profile as { school_id?: string } | null)?.school_id ?? "";
      for (const [key, value] of this.batch) {
        const table = this.keyToTable(key);
        if (!table) continue;
        // Only process if value is a non-null object (not array)
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
          try {
            await supabase.from(table).upsert({ ...value, school_id: schoolId, teacher_id: userId, updated_at: new Date().toISOString() });
            await createAuditLog({
              school_id: schoolId,
              user_id: userId,
              action: "update",
              table_name: table,
              record_id: (value as Record<string, unknown>).id as string ?? key,
              new_data: value as Record<string, unknown>,
              old_data: null,
              ip_address: null,
              user_agent: null
            });
          } catch { /* silent */ }
        }
      }
    } catch { /* silent */ }
    this.batch.clear();
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
    };
    return map[key] ?? null;
  }

  cleanupStorage(): void {
    this.cleanup = true;
    this.batch.clear();
    if (this.batchTimer) clearTimeout(this.batchTimer);
  }
}

export const storage = new SupabaseStorage();