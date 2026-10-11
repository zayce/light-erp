const fs = require("fs");
const path = require("path");

const emptyDb = () => ({
  users: [],
  // One shared workspace: every user of the company sees the same warehouse.
  workspace: { version: 0, updatedAt: null, data: null },
  // Who did what to user accounts (newest last, capped by the server).
  audit: [],
  meta: {},
});

const isNewShape = (x) =>
  x && typeof x === "object" && !Array.isArray(x) && Array.isArray(x.users);

// Tiny JSON-file store. Writes are atomic (temp file + rename) so a crash in the
// middle of a save cannot leave a half-written database.
const createStore = (file, options = {}) => {
  let db = emptyDb();

  const backupDir =
    options.backupDir || process.env.BACKUP_DIR || path.join(path.dirname(file), "backups");
  const keep = Number(options.keep ?? process.env.BACKUP_KEEP ?? 14);
  const prefix = `${path.basename(file, ".json")}-`;
  let lastBackupDay = null;

  // Once a day, before the first write of that day, copy the current file to the
  // backups folder, so the copy is the state as it was before the day's changes.
  // Only the newest `keep` copies are kept.
  const backupIfNeeded = () => {
    const day = new Date().toISOString().slice(0, 10);
    if (lastBackupDay === day || keep <= 0 || !fs.existsSync(file)) return;

    try {
      fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(file, path.join(backupDir, `${prefix}${day}.json`));
      lastBackupDay = day;

      fs.readdirSync(backupDir)
        .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
        .sort()
        .reverse()
        .slice(keep)
        .forEach((name) => fs.unlinkSync(path.join(backupDir, name)));
    } catch (err) {
      console.warn("Ehtiyat nüsxə yaradılmadı:", err.message);
    }
  };

  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (isNewShape(parsed)) {
        const base = emptyDb();
        db = {
          ...base,
          ...parsed,
          workspace: { ...base.workspace, ...(parsed.workspace || {}) },
          meta: parsed.meta || {},
          audit: Array.isArray(parsed.audit) ? parsed.audit : [],
        };
      } else {
        // Old versions kept only a products array here. Keep a copy, start fresh.
        fs.copyFileSync(file, `${file}.legacy`);
      }
    }
  } catch (err) {
    console.error("Verilənlər bazası oxunmadı:", err.message);
    try {
      fs.copyFileSync(file, `${file}.corrupt-${Date.now()}`);
    } catch {
      // nothing else to do
    }
  }

  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    backupIfNeeded();
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, file);
  };

  return {
    get db() {
      return db;
    },
    save,
  };
};

module.exports = { createStore };
