const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const scrypt = (password, salt) =>
  new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
};

const verifyPassword = async (password, stored) => {
  const [saltHex, keyHex] = String(stored || "").split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"));
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && crypto.timingSafeEqual(key, expected);
};

// JWT secret: JWT_SECRET env var wins; otherwise a random one is generated once
// and kept in the database so tokens survive a restart.
const getSecret = (store) => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!store.db.meta.jwtSecret) {
    store.db.meta.jwtSecret = crypto.randomBytes(32).toString("hex");
    store.save();
  }
  return store.db.meta.jwtSecret;
};

const signToken = (store, user) =>
  jwt.sign({ sub: user.id, tv: user.tokenVersion || 0 }, getSecret(store), {
    expiresIn: "7d",
  });

// Login throttling: 10 failed attempts per 15 minutes per IP + e-mail.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const fails = new Map();

const isLimited = (key) => {
  const entry = fails.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    fails.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILS;
};

const registerFail = (key) => {
  const entry = fails.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    fails.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
};

const clearFails = (key) => fails.delete(key);

const publicUser = (u) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone || "",
  role: u.role,
  notifications: u.notifications,
});

const defaultNotifications = () => ({
  emailNotifications: true,
  lowStockAlerts: true,
  reportNotifications: false,
});

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  getSecret,
  isLimited,
  registerFail,
  clearFails,
  publicUser,
  defaultNotifications,
};
