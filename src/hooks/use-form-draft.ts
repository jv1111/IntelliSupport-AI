"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type FormDraftDeserializer<T extends object> = (
  value: unknown,
  initialValues: T,
) => T;

interface UseFormDraftOptions<T extends object> {
  formId: string;
  entityId?: string | null;
  initialValues: T;
  deserialize?: FormDraftDeserializer<T>;
}

const draftSubscriptions = new Map<string, Set<() => void>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function subscribeToDraft(key: string, listener: () => void) {
  const listeners = draftSubscriptions.get(key) ?? new Set();

  listeners.add(listener);
  draftSubscriptions.set(key, listeners);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      draftSubscriptions.delete(key);
    }
  };
}

function notifyDraftChange(key: string) {
  draftSubscriptions.get(key)?.forEach((listener) => listener());
}

function getDraftSnapshot(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function getServerDraftSnapshot(): null {
  return null;
}

export function getFormDraftStorageKey(
  formId: string,
  entityId?: string | null,
): string {
  return `${formId}-form-draft:${entityId ?? "new"}`;
}

export function saveFormDraft<T extends object>(
  formId: string,
  values: T,
  entityId?: string | null,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const key = getFormDraftStorageKey(formId, entityId);

  try {
    window.sessionStorage.setItem(key, JSON.stringify(values));
    notifyDraftChange(key);
    return true;
  } catch {
    return false;
  }
}

export function clearFormDraft(
  formId: string,
  entityId?: string | null,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const key = getFormDraftStorageKey(formId, entityId);

  try {
    window.sessionStorage.removeItem(key);
    notifyDraftChange(key);
    return true;
  } catch {
    return false;
  }
}

export function useFormDraft<T extends object>({
  formId,
  entityId,
  initialValues,
  deserialize,
}: UseFormDraftOptions<T>) {
  const storageKey = useMemo(
    () => getFormDraftStorageKey(formId, entityId),
    [formId, entityId],
  );

  const subscribe = useCallback(
    (listener: () => void) => subscribeToDraft(storageKey, listener),
    [storageKey],
  );

  const getSnapshot = useCallback(
    () => getDraftSnapshot(storageKey),
    [storageKey],
  );

  const storedDraft = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerDraftSnapshot,
  );

  const values = useMemo(() => {
    if (!storedDraft) {
      return initialValues;
    }

    try {
      const parsed: unknown = JSON.parse(storedDraft);

      if (deserialize) {
        return deserialize(parsed, initialValues);
      }

      if (!isRecord(parsed)) {
        return initialValues;
      }

      return { ...initialValues, ...parsed } as T;
    } catch {
      return initialValues;
    }
  }, [deserialize, initialValues, storedDraft]);

  const saveDraft = useCallback(
    (nextValues: T) => saveFormDraft(formId, nextValues, entityId),
    [entityId, formId],
  );

  const clearDraft = useCallback(
    () => clearFormDraft(formId, entityId),
    [entityId, formId],
  );

  return {
    values,
    saveDraft,
    clearDraft,
  };
}
