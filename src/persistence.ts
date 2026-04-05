import { SAVE_KEY, createDefaultAppState, rebuildCrewMember, type AppState, type CrewMember } from "./gameData";

export function normalizeAppState(input: unknown): AppState {
  const base = createDefaultAppState();
  const raw = (typeof input === "object" && input !== null ? input : {}) as Partial<AppState>;
  const merged = { ...base, ...raw } as AppState;
  merged.crew = (raw.crew || base.crew).map((member, index) => rebuildCrewMember({ ...(base.crew[index] as CrewMember), ...(member as CrewMember) }, {}));
  merged.ship = { ...base.ship, ...(raw.ship || {}) } as AppState["ship"];
  merged.missionState = { ...base.missionState, ...(raw.missionState || {}) } as AppState["missionState"];
  merged.onboarding = { ...base.onboarding, ...(raw.onboarding || {}) } as AppState["onboarding"];
  return merged;
}

export function loadPersistedAppState(): AppState {
  if (typeof window === "undefined") return createDefaultAppState();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultAppState();
    return normalizeAppState(JSON.parse(raw));
  } catch {
    return createDefaultAppState();
  }
}

export function persistAppState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearPersistedAppState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}

export function downloadAppState(state: AppState, filename = "dead-zone-ops-save.json"): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function importAppStateFromFile(file: File): Promise<AppState> {
  const raw = await file.text();
  return normalizeAppState(JSON.parse(raw));
}
