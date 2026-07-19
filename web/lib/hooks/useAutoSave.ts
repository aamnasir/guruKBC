import { useCallback, useEffect, useRef, useState } from "react";

type AutoSaveState<T> = {
  data: T;
  saving: boolean;
  saved: boolean;
  error: string | null;
  lastSaved: Date | null;
};

export function useAutoSave<T>(
  key: string,
  initialData: T,
  saveFn: (data: T) => Promise<void>,
  delay = 2000
): AutoSaveState<T> & { update: (updater: T | ((prev: T) => T)) => void } {
  const [data, setData] = useState<T>(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setData((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      setSaved(false);
      setError(null);
      return next;
    });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        await saveFn(data);
        setSaved(true);
        setLastSaved(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan");
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, delay, saveFn]);

  return { data, saving, saved, error, lastSaved, update };
}