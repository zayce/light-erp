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
