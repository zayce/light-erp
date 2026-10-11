import { canAccess, canManageSystem, homePath, pagesOf, ROLES } from "./access";

test("admin sees every section, including user management", () => {
  ["dashboard", "warehouse", "purchases", "cashflow", "report", "settings", "users"].forEach((p) =>
    expect(canAccess("admin", p)).toBe(true),
  );
});

test("only admin manages users", () => {
  ROLES.filter((r) => r !== "admin").forEach((r) => expect(canAccess(r, "users")).toBe(false));
});

test("warehouse keeper cannot open finance sections", () => {
  expect(canAccess("warehouse", "warehouse")).toBe(true);
  expect(canAccess("warehouse", "purchases")).toBe(true);
  ["cashflow", "report", "dashboard"].forEach((p) => expect(canAccess("warehouse", p)).toBe(false));
});

test("accountant works with money, not with the stock screen", () => {
  ["cashflow", "report", "purchases", "dashboard"].forEach((p) => expect(canAccess("accountant", p)).toBe(true));
  expect(canAccess("accountant", "warehouse")).toBe(false);
});

test("every role can open settings, so a redirect can never loop", () => {
  ROLES.forEach((r) => expect(canAccess(r, "settings")).toBe(true));
  ROLES.forEach((r) => expect(canAccess(r, pagesOf(r)[0])).toBe(true));
});

test("home page is the first section the role may open; unknown roles act like staff", () => {
  expect(homePath("admin")).toBe("/dashboard");
  expect(homePath("warehouse")).toBe("/warehouse");
  expect(homePath("accountant")).toBe("/dashboard");
  expect(pagesOf("mystery")).toEqual(pagesOf("staff"));
  expect(pagesOf(undefined)).toEqual(pagesOf("staff"));
});

test("system settings and backup restore are for admin and staff only", () => {
  expect(canManageSystem("admin")).toBe(true);
  expect(canManageSystem("staff")).toBe(true);
  expect(canManageSystem("warehouse")).toBe(false);
  expect(canManageSystem("accountant")).toBe(false);
  expect(canManageSystem("mystery")).toBe(true); // unknown roles act like staff
});
