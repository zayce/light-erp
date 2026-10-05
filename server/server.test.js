const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

// must be set before server.js is required
process.env.DATA_FILE = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "hesabla-")),
  "products.json",
);

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

const call = async (method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

test("creates a product and rejects a duplicate SKU (case-insensitive)", async () => {
  const created = await call("POST", "/products", {
    sku: "T-1",
    name: "Test",
    price: 5,
    stockCurrent: 3,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.qrCode, "QR_T-1");

  const dup = await call("POST", "/products", { sku: "t-1", name: "Other" });
  assert.equal(dup.status, 409);
});

test("validates required and numeric fields", async () => {
  assert.equal(
    (await call("POST", "/products", { sku: "", name: "x" })).status,
    400,
  );
  assert.equal(
    (await call("POST", "/products", { sku: "N-1", name: "x", price: -1 }))
      .status,
    400,
  );
});

test("PATCH stock changes stock atomically and never goes below zero", async () => {
  const up = await call("PATCH", "/products/T-1/stock", { delta: 2 });
  assert.equal(up.status, 200);
  assert.equal(up.body.stockCurrent, 5);

  const down = await call("PATCH", "/products/T-1/stock", { delta: -99 });
  assert.equal(down.body.stockCurrent, 0);

  assert.equal(
    (await call("PATCH", "/products/T-1/stock", { delta: 0 })).status,
    400,
  );
  assert.equal(
    (await call("PATCH", "/products/T-1/stock", { delta: 1.5 })).status,
    400,
  );
  assert.equal(
    (await call("PATCH", "/products/NOPE/stock", { delta: 1 })).status,
    404,
  );
});

test("PUT updates a product and DELETE removes it", async () => {
  const put = await call("PUT", "/products/T-1", { price: 9 });
  assert.equal(put.body.price, 9);

  assert.equal((await call("DELETE", "/products/T-1")).status, 204);
  assert.equal((await call("DELETE", "/products/T-1")).status, 404);
});

test("malformed JSON returns a JSON 400, not an HTML error page", async () => {
  const res = await fetch(base + "/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json",
  });
  assert.equal(res.status, 400);
  assert.match(res.headers.get("content-type"), /json/);
});
