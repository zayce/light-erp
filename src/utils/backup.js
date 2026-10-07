import { normalizeState } from "../AppContext";

export const BACKUP_VERSION = 1;

export const buildBackup = (state) => ({
  app: "hesabla",
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  data: state,
});

const ARRAYS = ["report", "cashflow", "anbar", "categories", "users", "purchases"];

// Returns normalized state or throws an Error with a message safe to show to the user.
export const parseBackup = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Fayl düzgün JSON deyil");
  }

  const data = parsed && parsed.app === "hesabla" ? parsed.data : parsed;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Fayl Hesabla ehtiyat nüsxəsi deyil");
  }
  if (parsed.version && parsed.version > BACKUP_VERSION) {
    throw new Error("Fayl daha yeni versiyadandır, tətbiqi yeniləyin");
  }

  for (const key of ARRAYS) {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new Error(`"${key}" sahəsi yanlışdır`);
    }
  }
  if (!ARRAYS.some((key) => Array.isArray(data[key]))) {
    throw new Error("Faylda məlumat tapılmadı");
  }

  return normalizeState(data);
};
