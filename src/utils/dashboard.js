import { getStockStatus, stockPercent } from "./stock";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

// Cashflow items store the real number in amountRaw. The formatted `amount`
// string ("+₼12,5") loses decimals when parsed, so it is only a fallback.
export const amountOf = (item) => {
  if (item?.amountRaw !== undefined && item?.amountRaw !== null) {
    return Number(item.amountRaw) || 0;
  }
  return Number(String(item?.amount ?? "").replace(/[^\d]/g, "")) || 0;
};

// "2026-03-15" -> { year: 2026, month: 2 } read from the string, so the result
// does not shift with the browser's time zone.
export const yearMonthOf = (dateValue) => {
  if (!dateValue) return null;
  const text = String(dateValue);
  const match = /^(\d{4})-(\d{2})/.exec(text);
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };

  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
};

const keyOf = (year, month) => `${year}-${String(month + 1).padStart(2, "0")}`;

// Rolling window of `months` calendar months ending at `now`.
// Unlike grouping by month number only, 2025 and 2026 are not mixed together.
export const monthlySeries = (cashflow, months = 6, now = new Date()) => {
  const list = Array.isArray(cashflow) ? cashflow : [];
  const buckets = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: keyOf(d.getFullYear(), d.getMonth()),
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      gelir: 0,
      xerc: 0,
    });
  }

  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  list.forEach((item) => {
    const ym = yearMonthOf(item?.date);
    if (!ym) return;
    const bucket = byKey[keyOf(ym.year, ym.month)];
    if (!bucket) return;
    if (item.type === "income") bucket.gelir += amountOf(item);
    else bucket.xerc += amountOf(item);
  });

  return buckets;
};

export const monthTotals = (cashflow, year, month) => {
  let income = 0;
  let expense = 0;
  (Array.isArray(cashflow) ? cashflow : []).forEach((item) => {
    const ym = yearMonthOf(item?.date);
    if (!ym || ym.year !== year || ym.month !== month) return;
    if (item.type === "income") income += amountOf(item);
    else expense += amountOf(item);
  });
  return { income, expense, profit: income - expense };
};

// Percent change vs the previous period; null when there is nothing to compare to.
export const pctChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
};

export const topProducts = (report, limit = 5) => {
  const grouped = {};
  (Array.isArray(report) ? report : []).forEach((r) => {
    if (r?.operationType === "Xərc") return;
    const name = String(r?.name || "").trim();
    if (!name) return;
    const row = grouped[name] || { name, revenue: 0, count: 0, profit: 0 };
    row.revenue += Number(r.revenue || 0);
    row.count += Number(r.salesCount || 0);
    row.profit += Number(r.revenue || 0) - Number(r.cogs || 0);
    grouped[name] = row;
  });
  return Object.values(grouped)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const stockBreakdown = (anbar) => {
  const counts = { normal: 0, asagi: 0, kritik: 0, yuksek: 0 };
  (Array.isArray(anbar) ? anbar : []).forEach((item) => {
    counts[getStockStatus(item?.stockCurrent, item?.stockMin)] += 1;
  });
  return counts;
};

export const lowStockItems = (anbar, limit = 5) =>
  (Array.isArray(anbar) ? anbar : [])
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      stockCurrent: Number(item.stockCurrent || 0),
      stockMin: Number(item.stockMin || 0),
      status: getStockStatus(item.stockCurrent, item.stockMin),
      percent: stockPercent(item.stockCurrent, item.stockMin),
    }))
    .filter((item) => item.status === "asagi" || item.status === "kritik")
    .sort((a, b) => a.percent - b.percent)
    .slice(0, limit);

// Sales revenue minus the cost of the goods sold (cost frozen at the time of each sale).
export const grossProfit = (report) =>
  (Array.isArray(report) ? report : [])
    .filter((r) => r?.operationType !== "Xərc")
    .reduce((sum, r) => sum + Number(r.revenue || 0) - Number(r.cogs || 0), 0);
