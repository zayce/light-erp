const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

// must be set before server.js is required
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hesabla-"));
process.env.DATA_FILE = path.join(dir, "hesabla.json");
process.env.JWT_SECRET = "test-secret";

const app = require("./server");

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

const call = async (method, url, body, token) => {
  const res = await fetch(base + url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  return { status: res.status, body: raw ? JSON.parse(raw) : null };
};

const admin = {
  firstName: "Ali",
  lastName: "Əliyev",
  email: "Admin@Test.az",
  password: "secret1",
};

let adminToken;
let staffToken;
let staffId;

test("starts with no users and open registration", async () => {
  assert.deepEqual((await call("GET", "/auth/status")).body, { hasUsers: false });
});

test("register validates input", async () => {
  assert.equal((await call("POST", "/auth/register", { ...admin, email: "bad" })).status, 400);
  assert.equal((await call("POST", "/auth/register", { ...admin, password: "123" })).status, 400);
  assert.equal((await call("POST", "/auth/register", { ...admin, firstName: " " })).status, 400);
});

test("first user becomes admin; registration then closes", async () => {
  const res = await call("POST", "/auth/register", admin);
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "admin");
  assert.equal(res.body.user.email, "admin@test.az");
  assert.equal(res.body.user.passwordHash, undefined);
  adminToken = res.body.token;

  assert.equal((await call("POST", "/auth/register", admin)).status, 403);
  assert.deepEqual((await call("GET", "/auth/status")).body, { hasUsers: true });
});

test("password is stored hashed, never in clear text", () => {
  const raw = fs.readFileSync(process.env.DATA_FILE, "utf8");
  assert.ok(!raw.includes("secret1"));
  assert.ok(raw.includes("passwordHash"));
});

test("protected routes reject missing and bad tokens", async () => {
  assert.equal((await call("GET", "/data")).status, 401);
  assert.equal((await call("GET", "/auth/me", undefined, "garbage")).status, 401);
});

test("login works with any e-mail case and rejects wrong passwords", async () => {
  const ok = await call("POST", "/auth/login", { email: "ADMIN@test.az", password: "secret1" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await call("POST", "/auth/login", { email: "admin@test.az", password: "wrong" });
  assert.equal(bad.status, 401);
  // same message for unknown user: no account enumeration
  const unknown = await call("POST", "/auth/login", { email: "nobody@test.az", password: "x" });
  assert.equal(unknown.body.error, bad.body.error);
});

test("login is throttled after repeated failures", async () => {
  let last;
  for (let i = 0; i < 12; i += 1) {
    last = await call("POST", "/auth/login", { email: "victim@test.az", password: "nope" });
  }
  assert.equal(last.status, 429);
});

test("profile update validates and prevents duplicate e-mail", async () => {
  const ok = await call(
    "PUT",
    "/auth/profile",
    { firstName: "Əli", lastName: "Vəliyev", email: "admin@test.az", phone: "+994 50 000 00 00" },
    adminToken,
  );
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.phone, "+994 50 000 00 00");
  assert.equal(
    (await call("PUT", "/auth/profile", { firstName: "", lastName: "x", email: "a@b.az" }, adminToken)).status,
    400,
  );
});

test("admin creates staff; staff cannot manage users", async () => {
  const created = await call(
    "POST",
    "/users",
    { firstName: "Sara", lastName: "Staff", email: "sara@test.az", password: "staff123", role: "staff" },
    adminToken,
  );
  assert.equal(created.status, 201);
  staffId = created.body.id;

  assert.equal(
    (await call("POST", "/users", { ...created.body, password: "staff123" }, adminToken)).status,
    409,
  );

  const login = await call("POST", "/auth/login", { email: "sara@test.az", password: "staff123" });
  staffToken = login.body.token;

  assert.equal((await call("GET", "/users", undefined, staffToken)).status, 403);
  assert.equal((await call("POST", "/users", {}, staffToken)).status, 403);
  assert.equal((await call("GET", "/users", undefined, adminToken)).body.length, 2);
});

test("notifications are validated and saved per user", async () => {
  assert.equal((await call("PUT", "/auth/notifications", { emailNotifications: "yes" }, staffToken)).status, 400);
  const ok = await call(
    "PUT",
    "/auth/notifications",
    { emailNotifications: false, lowStockAlerts: true, reportNotifications: true },
    staffToken,
  );
  assert.equal(ok.body.user.notifications.reportNotifications, true);

  const adminMe = await call("GET", "/auth/me", undefined, adminToken);
  assert.equal(adminMe.body.user.notifications.reportNotifications, false);
});

test("workspace data: empty at first, saved with versioning", async () => {
  const first = await call("GET", "/data", undefined, adminToken);
  assert.equal(first.body.version, 0);
  assert.equal(first.body.data, null);

  const saved = await call(
    "PUT",
    "/data",
    { baseVersion: 0, data: { anbar: [{ sku: "A-1" }], report: [], cashflow: [], purchases: [] } },
    adminToken,
  );
  assert.equal(saved.status, 200);
  assert.equal(saved.body.version, 1);

  // another user sees the same shared data
  const seen = await call("GET", "/data", undefined, staffToken);
  assert.equal(seen.body.data.anbar[0].sku, "A-1");
});

test("stale writes get 409 with the current data instead of overwriting", async () => {
  const stale = await call(
    "PUT",
    "/data",
    { baseVersion: 0, data: { anbar: [], report: [], cashflow: [] } },
    staffToken,
  );
  assert.equal(stale.status, 409);
  assert.equal(stale.body.version, 1);
  assert.equal(stale.body.data.anbar[0].sku, "A-1");
});

test("data validation rejects wrong shapes", async () => {
  const v = (await call("GET", "/data", undefined, adminToken)).body.version;
  assert.equal((await call("PUT", "/data", { baseVersion: v, data: "x" }, adminToken)).status, 400);
  assert.equal((await call("PUT", "/data", { baseVersion: v, data: { anbar: {} } }, adminToken)).status, 400);
  assert.equal((await call("PUT", "/data", { baseVersion: v, data: { settings: [] } }, adminToken)).status, 400);
});

test("data survives a server restart (persisted to disk)", () => {
  const onDisk = JSON.parse(fs.readFileSync(process.env.DATA_FILE, "utf8"));
  assert.equal(onDisk.workspace.version, 1);
  assert.equal(onDisk.users.length, 2);
});

test("changing the password revokes old tokens and issues a new one", async () => {
  assert.equal(
    (await call("PUT", "/auth/password", { currentPassword: "wrong", newPassword: "newpass1" }, staffToken)).status,
    400,
  );
  assert.equal(
    (await call("PUT", "/auth/password", { currentPassword: "staff123", newPassword: "123" }, staffToken)).status,
    400,
  );

  const changed = await call(
    "PUT",
    "/auth/password",
    { currentPassword: "staff123", newPassword: "newpass1" },
    staffToken,
  );
  assert.equal(changed.status, 200);

  assert.equal((await call("GET", "/auth/me", undefined, staffToken)).status, 401); // old token dead
  assert.equal((await call("GET", "/auth/me", undefined, changed.body.token)).status, 200);
  assert.equal(
    (await call("POST", "/auth/login", { email: "sara@test.az", password: "newpass1" })).status,
    200,
  );
});

test("admin can delete staff but not themselves; deleted user loses access", async () => {
  const me = await call("GET", "/auth/me", undefined, adminToken);
  assert.equal((await call("DELETE", `/users/${me.body.user.id}`, undefined, adminToken)).status, 400);
  assert.equal((await call("DELETE", "/users/nope", undefined, adminToken)).status, 404);

  const login = await call("POST", "/auth/login", { email: "sara@test.az", password: "newpass1" });
  assert.equal((await call("DELETE", `/users/${staffId}`, undefined, adminToken)).status, 204);
  assert.equal((await call("GET", "/data", undefined, login.body.token)).status, 401);
});

test("malformed JSON returns a JSON 400, not an HTML error page", async () => {
  const res = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json",
  });
  assert.equal(res.status, 400);
  assert.match(res.headers.get("content-type"), /json/);
});

test("admin can reset a colleague's password; the old session is revoked", async () => {
  const created = await call(
    "POST",
    "/users",
    { firstName: "Nigar", lastName: "Staff", email: "nigar@test.az", password: "oldpass1", role: "staff" },
    adminToken,
  );
  const oldLogin = await call("POST", "/auth/login", { email: "nigar@test.az", password: "oldpass1" });

  assert.equal((await call("PUT", `/users/${created.body.id}/password`, { newPassword: "123" }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${created.body.id}/password`, { newPassword: "brandnew1" }, oldLogin.body.token)).status, 403);
  assert.equal((await call("PUT", `/users/${created.body.id}/password`, { newPassword: "brandnew1" }, adminToken)).status, 204);

  assert.equal((await call("GET", "/auth/me", undefined, oldLogin.body.token)).status, 401);
  assert.equal((await call("POST", "/auth/login", { email: "nigar@test.az", password: "oldpass1" })).status, 401);
  assert.equal((await call("POST", "/auth/login", { email: "nigar@test.az", password: "brandnew1" })).status, 200);

  const me = await call("GET", "/auth/me", undefined, adminToken);
  assert.equal((await call("PUT", `/users/${me.body.user.id}/password`, { newPassword: "whatever1" }, adminToken)).status, 400);
  assert.equal((await call("PUT", "/users/nope/password", { newPassword: "whatever1" }, adminToken)).status, 404);
});

test("a daily backup of the data file is written and old ones are pruned", () => {
  const { createStore } = require("./db");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hesabla-bk-"));
  const file = path.join(tmp, "hesabla.json");
  const backups = path.join(tmp, "backups");

  const store = createStore(file, { keep: 2 });
  store.db.users.push({ id: "1", email: "a@b.az" });
  store.save(); // file did not exist yet: nothing to back up
  assert.equal(fs.existsSync(backups), false);

  fs.mkdirSync(backups);
  ["hesabla-2020-01-01.json", "hesabla-2020-01-02.json", "hesabla-2020-01-03.json"].forEach((n) =>
    fs.writeFileSync(path.join(backups, n), "{}"),
  );

  store.db.users.push({ id: "2", email: "c@d.az" });
  store.save(); // first save of the day with an existing file -> backup + prune

  const today = new Date().toISOString().slice(0, 10);
  const files = fs.readdirSync(backups).sort();
  assert.deepEqual(files, ["hesabla-2020-01-03.json", `hesabla-${today}.json`]);

  const saved = JSON.parse(fs.readFileSync(path.join(backups, `hesabla-${today}.json`), "utf8"));
  assert.equal(saved.users.length, 1); // the state from before the day's change

  store.save(); // same day again: no second backup, nothing breaks
  assert.equal(fs.readdirSync(backups).length, 2);
});

test("admin edits a user; validation, duplicate e-mail and permissions are enforced", async () => {
  const created = await call(
    "POST",
    "/users",
    { firstName: "Leyla", lastName: "Staff", email: "leyla@test.az", password: "leyla123", role: "staff" },
    adminToken,
  );
  const id = created.body.id;
  assert.equal(created.body.active, true);

  const edited = await call(
    "PUT",
    `/users/${id}`,
    { firstName: "Leyla2", email: "Leyla.New@Test.az", role: "admin", phone: "050" },
    adminToken,
  );
  assert.equal(edited.status, 200);
  assert.equal(edited.body.firstName, "Leyla2");
  assert.equal(edited.body.lastName, "Staff"); // untouched fields stay
  assert.equal(edited.body.email, "leyla.new@test.az");
  assert.equal(edited.body.role, "admin");
  assert.equal(edited.body.phone, "050");
  assert.equal("passwordHash" in edited.body, false);

  assert.equal((await call("PUT", `/users/${id}`, { firstName: " " }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${id}`, { email: "nope" }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${id}`, { role: "boss" }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${id}`, { active: "no" }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${id}`, { email: "admin@test.az" }, adminToken)).status, 409);
  assert.equal((await call("PUT", "/users/nope", { firstName: "X" }, adminToken)).status, 404);

  // an admin who was just promoted can manage users, a demoted one cannot
  const login = await call("POST", "/auth/login", { email: "leyla.new@test.az", password: "leyla123" });
  assert.equal((await call("GET", "/users", undefined, login.body.token)).status, 200);
  await call("PUT", `/users/${id}`, { role: "staff" }, adminToken);
  assert.equal((await call("GET", "/users", undefined, login.body.token)).status, 403);
  assert.equal((await call("PUT", `/users/${id}`, { firstName: "Hack" }, login.body.token)).status, 403);
});

test("admin cannot change their own role or disable themselves", async () => {
  const me = await call("GET", "/auth/me", undefined, adminToken);
  const id = me.body.user.id;
  assert.equal((await call("PUT", `/users/${id}`, { role: "staff" }, adminToken)).status, 400);
  assert.equal((await call("PUT", `/users/${id}`, { active: false }, adminToken)).status, 400);
  // the same role / active value is not a change
  assert.equal((await call("PUT", `/users/${id}`, { role: "admin", active: true }, adminToken)).status, 200);
  assert.equal((await call("GET", "/auth/me", undefined, adminToken)).status, 200);
});

test("a disabled user is locked out until re-enabled, and old sessions stay dead", async () => {
  const created = await call(
    "POST",
    "/users",
    { firstName: "Tural", lastName: "Staff", email: "tural@test.az", password: "tural123", role: "staff" },
    adminToken,
  );
  const id = created.body.id;
  const login = await call("POST", "/auth/login", { email: "tural@test.az", password: "tural123" });
  assert.equal(login.status, 200);
  assert.ok(login.body.user.lastLoginAt > 0);
  assert.equal((await call("GET", "/data", undefined, login.body.token)).status, 200);

  const off = await call("PUT", `/users/${id}`, { active: false }, adminToken);
  assert.equal(off.body.active, false);

  assert.equal((await call("GET", "/data", undefined, login.body.token)).status, 401);
  const blocked = await call("POST", "/auth/login", { email: "tural@test.az", password: "tural123" });
  assert.equal(blocked.status, 403);
  // wrong password still looks like any other failed login
  assert.equal((await call("POST", "/auth/login", { email: "tural@test.az", password: "bad" })).status, 401);

  await call("PUT", `/users/${id}`, { active: true }, adminToken);
  assert.equal((await call("GET", "/data", undefined, login.body.token)).status, 401); // old token stays revoked
  assert.equal((await call("POST", "/auth/login", { email: "tural@test.az", password: "tural123" })).status, 200);
});

test("warehouse and accountant roles can be assigned; unknown roles are rejected", async () => {
  const mk = (email, role) =>
    call("POST", "/users", { firstName: "R", lastName: "Role", email, password: "secret1", role }, adminToken);

  const w = await mk("wh@test.az", "warehouse");
  const a = await mk("acc@test.az", "accountant");
  assert.equal(w.status, 201);
  assert.equal(w.body.role, "warehouse");
  assert.equal(a.body.role, "accountant");
  assert.equal((await mk("bad@test.az", "boss")).status, 400);

  const switched = await call("PUT", `/users/${w.body.id}`, { role: "accountant" }, adminToken);
  assert.equal(switched.body.role, "accountant");

  // these roles are not admins
  const login = await call("POST", "/auth/login", { email: "wh@test.az", password: "secret1" });
  assert.equal((await call("GET", "/users", undefined, login.body.token)).status, 403);
  assert.equal((await call("GET", "/users/activity", undefined, login.body.token)).status, 403);
});

test("audit trail records who did what, keeps names after deletion and never leaks secrets", async () => {
  const before = (await call("GET", "/users/activity?limit=200", undefined, adminToken)).body.total;

  const created = await call(
    "POST",
    "/users",
    { firstName: "Audit", lastName: "Subject", email: "audit@test.az", password: "audit123", role: "staff" },
    adminToken,
  );
  const id = created.body.id;
  await call("PUT", `/users/${id}`, { firstName: "Audit2", role: "warehouse" }, adminToken);
  await call("PUT", `/users/${id}`, { firstName: "Audit2" }, adminToken); // no change: no entry
  await call("PUT", `/users/${id}`, { active: false }, adminToken);
  await call("PUT", `/users/${id}`, { active: true }, adminToken);
  await call("PUT", `/users/${id}/password`, { newPassword: "another1" }, adminToken);
  await call("DELETE", `/users/${id}`, undefined, adminToken);

  const log = await call("GET", "/users/activity?limit=200", undefined, adminToken);
  assert.equal(log.body.total, before + 6);

  const mine = log.body.items.slice(0, 6).map((e) => e.action); // newest first
  assert.deepEqual(mine, [
    "user.delete",
    "user.password",
    "user.enable",
    "user.disable",
    "user.update",
    "user.create",
  ]);

  const me = (await call("GET", "/auth/me", undefined, adminToken)).body.user;
  const update = log.body.items[4];
  assert.equal(update.actorName, `${me.firstName} ${me.lastName}`);
  assert.equal(update.actorId, me.id);
  assert.equal(update.targetName, "Audit2 Subject");
  assert.deepEqual(update.meta, { fields: ["firstName"], role: { from: "staff", to: "warehouse" } });

  // the deleted user is still named in the trail
  assert.equal(log.body.items[0].targetName, "Audit2 Subject");
  assert.equal(log.body.items[0].meta.email, "audit@test.az");

  const raw = JSON.stringify(log.body);
  assert.equal(raw.includes("audit123"), false);
  assert.equal(raw.includes("another1"), false);
  assert.equal(raw.includes("passwordHash"), false);
});

test("audit paging: limit and offset", async () => {
  const all = (await call("GET", "/users/activity?limit=200", undefined, adminToken)).body;
  const page = (await call("GET", "/users/activity?limit=2&offset=1", undefined, adminToken)).body;
  assert.equal(page.total, all.total);
  assert.deepEqual(page.items.map((e) => e.id), all.items.slice(1, 3).map((e) => e.id));
  assert.equal((await call("GET", "/users/activity?limit=9999", undefined, adminToken)).body.items.length <= 200, true);
});
