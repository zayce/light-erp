const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

const ALLOWED_FIELDS = [
  "sku",
  "name",
  "category",
  "subcategory",
  "stockCurrent",
  "stockMin",
  "price",
  "cost",
  "supplier",
  "status",
  "desc",
  "image",
  "barcode",
  "createdAt",
];
const NUMERIC_FIELDS = ["stockCurrent", "stockMin", "price", "cost"];

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

// ---------- storage (JSON file) ----------
const loadProducts = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveProducts = () => {
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(products, null, 2));
  fs.renameSync(tmp, DATA_FILE);
};

let products = loadProducts();

// ---------- helpers ----------
const sameSku = (a, b) =>
  String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

const pickFields = (body) => {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

const validate = (data, { partial }) => {
  for (const key of ["sku", "name"]) {
    if (!partial || data[key] !== undefined) {
      if (typeof data[key] !== "string" || !data[key].trim()) {
        return `"${key}" boş ola bilməz`;
      }
    }
  }
  for (const key of NUMERIC_FIELDS) {
    if (data[key] !== undefined) {
      const n = Number(data[key]);
      if (!Number.isFinite(n) || n < 0) {
        return `"${key}" mənfi olmayan rəqəm olmalıdır`;
      }
    }
  }
  return null;
};

const normalize = (data) => {
  const out = { ...data };
  if (out.sku !== undefined) out.sku = String(out.sku).trim();
  if (out.name !== undefined) out.name = String(out.name).trim();
  for (const key of NUMERIC_FIELDS) {
    if (out[key] !== undefined) out[key] = Number(out[key]);
  }
  return out;
};

// ---------- routes ----------
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/products", (req, res) => {
  const data = pickFields(req.body || {});
  const error = validate(data, { partial: false });
  if (error) return res.status(400).json({ error });

  const clean = normalize(data);
  if (products.some((p) => sameSku(p.sku, clean.sku))) {
    return res.status(409).json({ error: "Bu SKU artıq mövcuddur" });
  }

  const newProduct = {
    ...clean,
    id: crypto.randomUUID(),
    qrCode: `QR_${clean.sku}`,
    createdAt: clean.createdAt || Date.now(),
  };

  products.unshift(newProduct);
  saveProducts();
  res.status(201).json(newProduct);
});

app.put("/products/:sku", (req, res) => {
  const index = products.findIndex((p) => sameSku(p.sku, req.params.sku));
  if (index === -1) return res.status(404).json({ error: "Məhsul tapılmadı" });

  const data = pickFields(req.body || {});
  const error = validate(data, { partial: true });
  if (error) return res.status(400).json({ error });

  const clean = normalize(data);
  if (
    clean.sku !== undefined &&
    products.some((p, i) => i !== index && sameSku(p.sku, clean.sku))
  ) {
    return res.status(409).json({ error: "Bu SKU artıq mövcuddur" });
  }

  products[index] = { ...products[index], ...clean };
  if (clean.sku !== undefined) products[index].qrCode = `QR_${clean.sku}`;
  saveProducts();
  res.json(products[index]);
});

// Atomic stock change (used by barcode scans): body { delta: number }
app.patch("/products/:sku/stock", (req, res) => {
  const index = products.findIndex((p) => sameSku(p.sku, req.params.sku));
  if (index === -1) return res.status(404).json({ error: "Məhsul tapılmadı" });

  const delta = Number((req.body || {}).delta);
  if (!Number.isFinite(delta) || !Number.isInteger(delta) || delta === 0) {
    return res
      .status(400)
      .json({ error: '"delta" sıfırdan fərqli tam ədəd olmalıdır' });
  }

  const next = Number(products[index].stockCurrent || 0) + delta;
  products[index] = { ...products[index], stockCurrent: Math.max(0, next) };
  saveProducts();
  res.json(products[index]);
});

app.delete("/products/:sku", (req, res) => {
  const before = products.length;
  products = products.filter((p) => !sameSku(p.sku, req.params.sku));
  if (products.length === before) {
    return res.status(404).json({ error: "Məhsul tapılmadı" });
  }
  saveProducts();
  res.status(204).end();
});

// Malformed JSON and other errors answer with JSON instead of an HTML stack trace.
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

// Tests import the app; only listen when run directly (node server.js).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (data: ${DATA_FILE})`);
  });
}

module.exports = app;
