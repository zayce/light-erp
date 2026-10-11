const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const jwt = require("jsonwebtoken");
const { createStore } = require("./db");
const auth = require("./auth");

const PORT = process.env.PORT || 5000;
const DATA_FILE =
  process.env.DATA_FILE || path.join(__dirname, "data", "hesabla.json");
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const store = createStore(DATA_FILE);
const app = express();

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: "10mb" }));

const normEmail = (v) => String(v || "").trim().toLowerCase();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const text = (v) => String(v ?? "").trim();

// ---------- middleware ----------
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Giriş tələb olunur" });

  try {
    const payload = jwt.verify(token, auth.getSecret(store));
    const user = store.db.users.find((u) => u.id === payload.sub);
    if (!user || (user.tokenVersion || 0) !== payload.tv) {
      return res.status(401).json({ error: "Sessiya etibarsızdır" });
    }
    if (user.active === false) {
      return res.status(401).json({ error: "Hesab deaktiv edilib" });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Sessiya etibarsızdır" });
  }
};

const requireAdmin = (req, res, next) =>
  req.user.role === "admin"
    ? next()
    : res.status(403).json({ error: "Bu əməliyyat yalnız admin üçündür" });

const respondSession = (res, status, user) =>
  res.status(status).json({
    token: auth.signToken(store, user),
    user: auth.publicUser(user),
  });

// ---------- health & auth ----------
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/auth/status", (req, res) =>
  res.json({ hasUsers: store.db.users.length > 0 }),
);

// Open only while there are no users: the first account becomes the admin.
app.post("/auth/register", async (req, res) => {
  if (store.db.users.length > 0) {
    return res
      .status(403)
      .json({ error: "Qeydiyyat bağlıdır. Yeni istifadəçini admin yaradır" });
  }

  const { firstName, lastName, password } = req.body || {};
  const email = normEmail(req.body?.email);

  if (!text(firstName) || !text(lastName)) {
    return res.status(400).json({ error: "Ad və soyad boş ola bilməz" });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: "E-poçt formatı düzgün deyil" });
  }
  if (String(password || "").length < 6) {
    return res.status(400).json({ error: "Şifrə ən az 6 simvol olmalıdır" });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName: text(firstName),
    lastName: text(lastName),
    email,
    phone: "",
    role: "admin",
    passwordHash: await auth.hashPassword(String(password)),
    tokenVersion: 0,
    notifications: auth.defaultNotifications(),
    createdAt: Date.now(),
  };
  store.db.users.push(user);
  store.save();
  respondSession(res, 201, user);
});

app.post("/auth/login", async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const key = `${req.ip}|${email}`;

  if (auth.isLimited(key)) {
    return res
      .status(429)
      .json({ error: "Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın" });
  }

  const user = store.db.users.find((u) => u.email === email);
  const ok = user && (await auth.verifyPassword(password, user.passwordHash));

  if (!ok) {
    auth.registerFail(key);
    return res.status(401).json({ error: "E-poçt və ya şifrə yanlışdır" });
  }

  auth.clearFails(key);
  if (user.active === false) {
    return res.status(403).json({ error: "Hesab deaktiv edilib. Adminlə əlaqə saxlayın" });
  }

  user.lastLoginAt = Date.now();
  store.save();
  respondSession(res, 200, user);
});

app.get("/auth/me", requireAuth, (req, res) =>
  res.json({ user: auth.publicUser(req.user) }),
);

app.put("/auth/profile", requireAuth, (req, res) => {
  const { firstName, lastName, phone } = req.body || {};
  const email = normEmail(req.body?.email);

  if (!text(firstName)) return res.status(400).json({ error: "Ad boş ola bilməz" });
  if (!text(lastName)) return res.status(400).json({ error: "Soyad boş ola bilməz" });
  if (!isEmail(email)) {
    return res.status(400).json({ error: "E-poçt formatı düzgün deyil" });
  }
  if (store.db.users.some((u) => u.id !== req.user.id && u.email === email)) {
    return res.status(409).json({ error: "Bu e-poçt artıq istifadə olunur" });
  }

  Object.assign(req.user, {
    firstName: text(firstName),
    lastName: text(lastName),
    phone: text(phone),
    email,
  });
  store.save();
  res.json({ user: auth.publicUser(req.user) });
});

app.put("/auth/notifications", requireAuth, (req, res) => {
  const body = req.body || {};
  const keys = ["emailNotifications", "lowStockAlerts", "reportNotifications"];

  if (!keys.every((k) => typeof body[k] === "boolean")) {
    return res.status(400).json({ error: "Bildiriş parametrləri yanlışdır" });
  }

  req.user.notifications = Object.fromEntries(keys.map((k) => [k, body[k]]));
  store.save();
  res.json({ user: auth.publicUser(req.user) });
});

app.put("/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!(await auth.verifyPassword(String(currentPassword || ""), req.user.passwordHash))) {
    return res.status(400).json({ error: "Cari şifrə yanlışdır" });
  }
  if (String(newPassword || "").length < 6) {
    return res.status(400).json({ error: "Yeni şifrə ən az 6 simvol olmalıdır" });
  }

  req.user.passwordHash = await auth.hashPassword(String(newPassword));
  // invalidates every token issued before, on every device
  req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
  store.save();
  respondSession(res, 200, req.user);
});

// ---------- users (admin) ----------
// Roles decide which sections of the app a user sees (the data itself is one shared
// workspace, see README). admin also manages users.
const ROLES = ["admin", "staff", "warehouse", "accountant"];

const AUDIT_LIMIT = 1000;
const fullName = (u) => `${u.firstName || ""} ${u.lastName || ""}`.trim();

// Appends to the audit trail; the caller saves the store right after.
const logAudit = (actor, action, target, meta = {}) => {
  const audit = store.db.audit;
  audit.push({
    id: crypto.randomUUID(),
    at: Date.now(),
    actorId: actor.id,
    actorName: fullName(actor),
    action,
    targetId: target.id,
    targetName: fullName(target),
    meta,
  });
  if (audit.length > AUDIT_LIMIT) audit.splice(0, audit.length - AUDIT_LIMIT);
};

// Newest first. ?limit=1..200 (default 50) and ?offset=N for paging.
app.get("/users/activity", requireAuth, requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const newestFirst = [...store.db.audit].reverse();
  res.json({
    total: newestFirst.length,
    items: newestFirst.slice(offset, offset + limit),
  });
});

app.get("/users", requireAuth, requireAdmin, (req, res) =>
  res.json(store.db.users.map(auth.publicUser)),
);

app.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const { firstName, lastName, password, role } = req.body || {};
  const email = normEmail(req.body?.email);

  if (!text(firstName) || !text(lastName)) {
    return res.status(400).json({ error: "Ad və soyad boş ola bilməz" });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: "E-poçt formatı düzgün deyil" });
  }
  if (String(password || "").length < 6) {
    return res.status(400).json({ error: "Şifrə ən az 6 simvol olmalıdır" });
  }
  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ error: "Rol yanlışdır" });
  }
  if (store.db.users.some((u) => u.email === email)) {
    return res.status(409).json({ error: "Bu e-poçt artıq istifadə olunur" });
  }

  const user = {
    id: crypto.randomUUID(),
    firstName: text(firstName),
    lastName: text(lastName),
    email,
    phone: "",
    role: role === undefined ? "staff" : role,
    active: true,
    passwordHash: await auth.hashPassword(String(password)),
    tokenVersion: 0,
    notifications: auth.defaultNotifications(),
    createdAt: Date.now(),
  };
  store.db.users.push(user);
  logAudit(req.user, "user.create", user, { role: user.role });
  store.save();
  res.status(201).json(auth.publicUser(user));
});

// Admin edits a colleague: name, e-mail, phone, role, active. Partial updates are fine.
// An admin cannot change their own role or disable themselves, so the workspace always
// keeps at least one active admin (the caller is always one).
app.put("/users/:id", requireAuth, requireAdmin, (req, res) => {
  const target = store.db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "İstifadəçi tapılmadı" });

  const body = req.body || {};
  const has = (k) => body[k] !== undefined;
  const isSelf = target.id === req.user.id;

  if (has("firstName") && !text(body.firstName)) {
    return res.status(400).json({ error: "Ad boş ola bilməz" });
  }
  if (has("lastName") && !text(body.lastName)) {
    return res.status(400).json({ error: "Soyad boş ola bilməz" });
  }

  let email = target.email;
  if (has("email")) {
    email = normEmail(body.email);
    if (!isEmail(email)) {
      return res.status(400).json({ error: "E-poçt formatı düzgün deyil" });
    }
    if (store.db.users.some((u) => u.id !== target.id && u.email === email)) {
      return res.status(409).json({ error: "Bu e-poçt artıq istifadə olunur" });
    }
  }

  if (has("role") && !ROLES.includes(body.role)) {
    return res.status(400).json({ error: "Rol yanlışdır" });
  }
  if (has("active") && typeof body.active !== "boolean") {
    return res.status(400).json({ error: "Status yanlışdır" });
  }

  const nextRole = has("role") ? body.role : target.role;
  const nextActive = has("active") ? body.active : target.active !== false;

  if (isSelf && nextRole !== target.role) {
    return res.status(400).json({ error: "Öz rolunuzu dəyişə bilməzsiniz" });
  }
  if (isSelf && !nextActive) {
    return res.status(400).json({ error: "Özünüzü deaktiv edə bilməzsiniz" });
  }

  const before = { ...target };
  if (has("firstName")) target.firstName = text(body.firstName);
  if (has("lastName")) target.lastName = text(body.lastName);
  if (has("phone")) target.phone = text(body.phone);
  target.email = email;
  target.role = nextRole;

  const fields = ["firstName", "lastName", "email", "phone"].filter(
    (k) => before[k] !== target[k],
  );
  if (fields.length || before.role !== target.role) {
    const meta = { fields };
    if (before.role !== target.role) meta.role = { from: before.role, to: target.role };
    logAudit(req.user, "user.update", target, meta);
  }
  if ((before.active !== false) !== nextActive) {
    logAudit(req.user, nextActive ? "user.enable" : "user.disable", target);
  }

  // disabling ends every open session; re-enabling does not bring old tokens back
  if (target.active !== false && !nextActive) {
    target.tokenVersion = (target.tokenVersion || 0) + 1;
  }
  target.active = nextActive;

  store.save();
  res.json(auth.publicUser(target));
});

// Admin sets a new password for a colleague (there is no e-mail reset). The colleague's
// existing sessions are revoked so they must sign in again with the new password.
app.put("/users/:id/password", requireAuth, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res
      .status(400)
      .json({ error: "Öz şifrənizi Parametrlər bölməsindən dəyişin" });
  }
  const target = store.db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "İstifadəçi tapılmadı" });

  const newPassword = String(req.body?.newPassword || "");
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Yeni şifrə ən az 6 simvol olmalıdır" });
  }

  target.passwordHash = await auth.hashPassword(newPassword);
  target.tokenVersion = (target.tokenVersion || 0) + 1;
  logAudit(req.user, "user.password", target);
  store.save();
  res.status(204).end();
});

app.delete("/users/:id", requireAuth, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Özünüzü silə bilməzsiniz" });
  }
  const index = store.db.users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "İstifadəçi tapılmadı" });

  const removed = store.db.users[index];
  logAudit(req.user, "user.delete", removed, { email: removed.email, role: removed.role });
  store.db.users.splice(index, 1);
  store.save();
  res.status(204).end();
});

// ---------- shared workspace data ----------
const ARRAY_KEYS = ["report", "cashflow", "anbar", "categories", "users", "purchases"];

const validateData = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return '"data" obyekt olmalıdır';
  }
  for (const key of ARRAY_KEYS) {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      return `"${key}" massiv olmalıdır`;
    }
  }
  if (
    data.settings !== undefined &&
    (typeof data.settings !== "object" || Array.isArray(data.settings) || !data.settings)
  ) {
    return '"settings" obyekt olmalıdır';
  }
  return null;
};

app.get("/data", requireAuth, (req, res) => {
  const { version, updatedAt, data } = store.db.workspace;
  res.json({ version, updatedAt, data });
});

// Optimistic concurrency: the client sends the version it last saw.
// If someone else saved in between, answer 409 with the current data.
app.put("/data", requireAuth, (req, res) => {
  const { baseVersion, data } = req.body || {};
  const workspace = store.db.workspace;

  const problem = validateData(data);
  if (problem) return res.status(400).json({ error: problem });

  if (Number(baseVersion) !== workspace.version) {
    return res.status(409).json({
      error: "Məlumat başqa cihazda dəyişdirilib",
      version: workspace.version,
      updatedAt: workspace.updatedAt,
      data: workspace.data,
    });
  }

  workspace.data = data;
  workspace.version += 1;
  workspace.updatedAt = Date.now();
  store.save();
  res.json({ version: workspace.version, updatedAt: workspace.updatedAt });
});

// ---------- errors ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON formatı yanlışdır" });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: "Sorğu çox böyükdür" });
  }
  console.error(err);
  res.status(500).json({ error: "Daxili server xətası" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (data: ${DATA_FILE})`);
  });
}

module.exports = app;
