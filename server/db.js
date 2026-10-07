const fs = require("fs");
const path = require("path");

const emptyDb = () => ({
  users: [],
  // One shared workspace: every user of the company sees the same warehouse.
  workspace: { version: 0, updatedAt: null, data: null },
  meta: {},
});

const isNewShape = (x) =>
  x && typeof x === "object" && !Array.isArray(x) && Array.isArray(x.users);

// Tiny JSON-file store. Writes are atomic (temp file + rename) so a crash in the
// middle of a save cannot leave a half-written database.
const createStore = (file) => {
  let db = emptyDb();

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
