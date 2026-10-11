// Which sections of the app each role can open. This controls navigation and routes;
// the company data itself is one shared workspace on the server (sales, purchases and
// reports all touch stock and cash together), so it is not a data-isolation boundary.
export const ROLES = ["admin", "staff", "warehouse", "accountant"];

export const PAGE_PATHS = {
  dashboard: "/dashboard",
  warehouse: "/warehouse",
  purchases: "/purchases",
  cashflow: "/cashflow",
  report: "/report",
  settings: "/settings",
  users: "/usepanels",
};

const PAGES_BY_ROLE = {
  admin: ["dashboard", "warehouse", "purchases", "cashflow", "report", "settings", "users"],
  staff: ["dashboard", "warehouse", "purchases", "cashflow", "report", "settings"],
  warehouse: ["warehouse", "purchases", "settings"],
  accountant: ["dashboard", "purchases", "cashflow", "report", "settings"],
};

// Unknown or missing roles behave like a regular employee rather than locking out.
export const pagesOf = (role) => PAGES_BY_ROLE[role] || PAGES_BY_ROLE.staff;

export const canAccess = (role, page) => pagesOf(role).includes(page);

// Where a user lands when they open a page they may not see.
export const homePath = (role) => PAGE_PATHS[pagesOf(role)[0]];

// System settings and backup/restore (a restore replaces all company data) stay with
// admins and regular staff, as before; the narrower roles do not see them.
const SYSTEM_ROLES = ["admin", "staff"];
export const canManageSystem = (role) => SYSTEM_ROLES.includes(role) || !PAGES_BY_ROLE[role];

export const ROLE_LABEL_KEYS = {
  admin: "users_role_admin",
  staff: "users_role_staff",
  warehouse: "users_role_warehouse",
  accountant: "users_role_accountant",
};
