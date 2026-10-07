import { toCsv, downloadCsv } from "./csv";
import { amountOf } from "./dashboard";

const today = () => new Date().toISOString().slice(0, 10);

export const reportToCsv = (report) =>
  toCsv(report, [
    { label: "Tarix", value: (r) => r.date },
    { label: "Əməliyyat", value: (r) => r.operationType },
    { label: "Məhsul / təsvir", value: (r) => r.name },
    { label: "SKU", value: (r) => r.sku },
    { label: "Kateqoriya", value: (r) => r.category },
    { label: "Say", value: (r) => Number(r.salesCount || 0) },
    { label: "Məbləğ", value: (r) => Number(r.revenue || 0) },
    { label: "Qeyd", value: (r) => r.note },
  ]);

export const cashflowToCsv = (cashflow) =>
  toCsv(cashflow, [
    { label: "Tarix", value: (c) => c.date },
    { label: "Növ", value: (c) => (c.type === "income" ? "Gəlir" : "Xərc") },
    { label: "Kateqoriya", value: (c) => c.category },
    { label: "Təsvir", value: (c) => c.desc },
    { label: "Məbləğ", value: (c) => amountOf(c) },
  ]);

// Returns false when there is nothing to export so the caller can warn the user.
export const exportReport = (report) => {
  if (!Array.isArray(report) || report.length === 0) return false;
  downloadCsv(`hesabat-${today()}.csv`, reportToCsv(report));
  return true;
};

export const exportCashflow = (cashflow) => {
  if (!Array.isArray(cashflow) || cashflow.length === 0) return false;
  downloadCsv(`pul-axini-${today()}.csv`, cashflowToCsv(cashflow));
  return true;
};

export const purchasesToCsv = (purchases) =>
  toCsv(purchases, [
    { label: "Tarix", value: (p) => p.date },
    { label: "Məhsul", value: (p) => p.name },
    { label: "SKU", value: (p) => p.sku },
    { label: "Təchizatçı", value: (p) => p.supplier },
    { label: "Say", value: (p) => Number(p.qty || 0) },
    { label: "Vahid qiymət", value: (p) => Number(p.unitCost || 0) },
    { label: "Cəmi", value: (p) => Number(p.total || 0) },
    { label: "Qeyd", value: (p) => p.note },
  ]);

export const exportPurchases = (purchases) => {
  if (!Array.isArray(purchases) || purchases.length === 0) return false;
  downloadCsv(`alislar-${today()}.csv`, purchasesToCsv(purchases));
  return true;
};

export const reorderToCsv = (items) =>
  toCsv(items, [
    { label: "SKU", value: (i) => i.sku },
    { label: "Məhsul", value: (i) => i.name },
    { label: "Təchizatçı", value: (i) => i.supplier },
    { label: "Cari stok", value: (i) => i.current },
    { label: "Minimum", value: (i) => i.min },
    { label: "Təklif olunan say", value: (i) => i.qty },
    { label: "Təxmini məbləğ", value: (i) => i.estimate },
  ]);

export const exportReorderList = (items) => {
  if (!Array.isArray(items) || items.length === 0) return false;
  downloadCsv(`sifaris-siyahisi-${today()}.csv`, reorderToCsv(items));
  return true;
};
