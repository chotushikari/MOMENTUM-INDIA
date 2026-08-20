export const savedStorageKey = "momentum-saved";

export function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(savedStorageKey) ?? "[]");
    return Array.isArray(value) && value.every((item): item is string => typeof item === "string") ? value : [];
  } catch {
    return [];
  }
}

export function savedSnapshot(): string {
  return JSON.stringify(readSavedIds());
}

export function savedServerSnapshot(): string {
  return "[]";
}

export function subscribeToSaved(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onChange);
  window.addEventListener("momentum-saved-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("momentum-saved-change", onChange);
  };
}

export function writeSavedIds(ids: string[]): void {
  window.localStorage.setItem(savedStorageKey, JSON.stringify(ids));
  window.dispatchEvent(new Event("momentum-saved-change"));
}
