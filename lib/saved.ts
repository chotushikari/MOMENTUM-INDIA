import type { SavedItem, ShortVideo } from "@/lib/types";

export const savedStorageKey = "momentum-saved";
export const savedVideosStorageKey = "momentum-saved-videos";
export const savedIdeasStorageKey = "momentum-saved-ideas";

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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(savedStorageKey, JSON.stringify(ids));
  window.dispatchEvent(new Event("momentum-saved-change"));
}

export function readSavedVideos(): ShortVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(savedVideosStorageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShortVideo[]) : [];
  } catch {
    return [];
  }
}

export function toggleSavedVideo(video: ShortVideo): boolean {
  if (typeof window === "undefined") return false;
  const currentIds = readSavedIds();
  const currentVideos = readSavedVideos();
  const isSaved = currentIds.includes(video.id);

  let nextIds: string[];
  let nextVideos: ShortVideo[];

  if (isSaved) {
    nextIds = currentIds.filter((id) => id !== video.id);
    nextVideos = currentVideos.filter((item) => item.id !== video.id);
  } else {
    nextIds = [...currentIds, video.id];
    nextVideos = [video, ...currentVideos.filter((item) => item.id !== video.id)];
  }

  window.localStorage.setItem(savedStorageKey, JSON.stringify(nextIds));
  window.localStorage.setItem(savedVideosStorageKey, JSON.stringify(nextVideos));
  window.dispatchEvent(new Event("momentum-saved-change"));
  return !isSaved;
}

export function readSavedIdeas(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(savedIdeasStorageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedItem[]) : [];
  } catch {
    return [];
  }
}

export function toggleSavedIdea(idea: SavedItem): boolean {
  if (typeof window === "undefined") return false;
  const currentIdeas = readSavedIdeas();
  const isSaved = currentIdeas.some((item) => item.id === idea.id);

  const nextIdeas = isSaved
    ? currentIdeas.filter((item) => item.id !== idea.id)
    : [idea, ...currentIdeas];

  window.localStorage.setItem(savedIdeasStorageKey, JSON.stringify(nextIdeas));
  window.dispatchEvent(new Event("momentum-saved-change"));
  return !isSaved;
}
