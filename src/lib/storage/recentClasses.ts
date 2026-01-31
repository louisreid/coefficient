export type RecentClass = {
  joinCode: string;
  className: string;
  lastUsedAt: number;
};

const STORAGE_KEY = "gorillamaths.recentClasses";
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const isValidEntry = (entry: RecentClass) =>
  Boolean(entry.joinCode && entry.className && entry.lastUsedAt);

export const readRecentClasses = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentClass[];
    const now = Date.now();
    const cleaned = parsed
      .filter((entry) => isValidEntry(entry))
      .filter((entry) => now - entry.lastUsedAt <= YEAR_MS)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};

export const upsertRecentClass = (entry: RecentClass) => {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const normalized: RecentClass = {
    joinCode: entry.joinCode.trim(),
    className: entry.className.trim(),
    lastUsedAt: entry.lastUsedAt || now,
  };
  const existing = readRecentClasses().filter(
    (item) => item.joinCode !== normalized.joinCode,
  );
  const updated = [normalized, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
