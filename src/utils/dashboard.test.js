import {
  amountOf,
  monthlySeries,
  monthTotals,
  pctChange,
  topProducts,
  stockBreakdown,
  lowStockItems,
  yearMonthOf,
} from "./dashboard";
import { getStockStatus, stockPercent, countLowStock } from "./stock";

describe("amountOf", () => {
  test("uses amountRaw, keeping decimals", () => {
    expect(amountOf({ amountRaw: 12.5, amount: "+₼12,5" })).toBe(12.5);
  });
  test("falls back to the formatted string for legacy records", () => {
    expect(amountOf({ amount: "+₼1 200" })).toBe(1200);
  });
});

test("yearMonthOf reads ISO dates without time-zone shifts", () => {
  expect(yearMonthOf("2026-03-01")).toEqual({ year: 2026, month: 2 });
  expect(yearMonthOf("2025-12-31")).toEqual({ year: 2025, month: 11 });
  expect(yearMonthOf("garbage")).toBeNull();
  expect(yearMonthOf("")).toBeNull();
});

describe("monthlySeries", () => {
  const now = new Date(2026, 9, 6); // 6 Oct 2026
  const cashflow = [
    { date: "2026-10-02", type: "income", amountRaw: 100 },
    { date: "2026-10-03", type: "expense", amountRaw: 40 },
    { date: "2026-09-15", type: "income", amountRaw: 50 },
    { date: "2025-10-10", type: "income", amountRaw: 999 }, // same month number, other year
  ];

  test("covers exactly N rolling months, oldest first", () => {
    const series = monthlySeries(cashflow, 3, now);
    expect(series.map((s) => s.key)).toEqual(["2026-08", "2026-09", "2026-10"]);
  });

  test("does not mix the same month of different years", () => {
    const oct = monthlySeries(cashflow, 3, now).find((s) => s.key === "2026-10");
    expect(oct.gelir).toBe(100);
    expect(oct.xerc).toBe(40);
  });

  test("crosses a year boundary correctly", () => {
    const series = monthlySeries([], 3, new Date(2026, 0, 10));
    expect(series.map((s) => s.key)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });
});

test("monthTotals and pctChange", () => {
  const cashflow = [
    { date: "2026-10-02", type: "income", amountRaw: 150 },
    { date: "2026-10-03", type: "expense", amountRaw: 50 },
    { date: "2026-09-02", type: "income", amountRaw: 100 },
  ];
  const cur = monthTotals(cashflow, 2026, 9);
  const prev = monthTotals(cashflow, 2026, 8);
  expect(cur).toEqual({ income: 150, expense: 50, profit: 100 });
  expect(pctChange(cur.income, prev.income)).toBe(50);
  expect(pctChange(10, 0)).toBeNull();
  expect(pctChange(50, 100)).toBe(-50);
});

test("topProducts sums revenue per product and skips expenses", () => {
  const top = topProducts(
    [
      { name: "A", revenue: 10, salesCount: 1, operationType: "Satış" },
      { name: "A", revenue: 30, salesCount: 2, operationType: "Satış" },
      { name: "B", revenue: 25, salesCount: 1, operationType: "Satış" },
      { name: "Kirayə", revenue: 500, operationType: "Xərc" },
    ],
    5,
  );
  expect(top.map((t) => t.name)).toEqual(["A", "B"]);
  expect(top[0]).toMatchObject({ revenue: 40, count: 3 });
});

describe("stock status helpers", () => {
  test("status thresholds", () => {
    expect(getStockStatus(0, 10)).toBe("kritik");
    expect(getStockStatus(3, 10)).toBe("kritik");
    expect(getStockStatus(7, 10)).toBe("asagi");
    expect(getStockStatus(15, 10)).toBe("normal");
    expect(getStockStatus(25, 10)).toBe("yuksek");
  });
  test("stockPercent is clamped to 0..100", () => {
    expect(stockPercent(0, 10)).toBe(0);
    expect(stockPercent(10, 10)).toBe(50);
    expect(stockPercent(500, 10)).toBe(100);
    expect(stockPercent(5, 0)).toBe(100);
  });
  test("breakdown, low-stock list and counter agree", () => {
    const anbar = [
      { sku: "1", name: "a", stockCurrent: 1, stockMin: 10 },
      { sku: "2", name: "b", stockCurrent: 8, stockMin: 10 },
      { sku: "3", name: "c", stockCurrent: 15, stockMin: 10 },
    ];
    expect(stockBreakdown(anbar)).toEqual({ normal: 1, asagi: 1, kritik: 1, yuksek: 0 });
    expect(lowStockItems(anbar).map((i) => i.sku)).toEqual(["1", "2"]);
    expect(countLowStock(anbar)).toBe(2);
  });
});

describe("csv exports", () => {
  const { reportToCsv, cashflowToCsv, exportReport } = require("./exports");

  test("report rows are exported with a header", () => {
    const csv = reportToCsv([
      { date: "2026-10-01", operationType: "Satış", name: "A;B", sku: "A-1", salesCount: 2, revenue: 30 },
    ]);
    const [header, row] = csv.split("\r\n");
    expect(header.startsWith("Tarix;Əməliyyat")).toBe(true);
    expect(row).toContain('"A;B"');
    expect(row).toContain(";2;30;");
  });

  test("cashflow export keeps decimals (amountRaw) and labels the type", () => {
    const csv = cashflowToCsv([
      { date: "2026-10-01", type: "expense", category: "Kirayə", desc: "Ofis", amountRaw: 12.5 },
    ]);
    expect(csv.split("\r\n")[1]).toBe("2026-10-01;Xərc;Kirayə;Ofis;12.5");
  });

  test("exporting nothing returns false", () => {
    expect(exportReport([])).toBe(false);
  });
});

describe("backup", () => {
  const { buildBackup, parseBackup } = require("./backup");

  test("a backup round-trips", () => {
    const state = { anbar: [{ sku: "A", name: "a", stockCurrent: 1 }], report: [], cashflow: [], purchases: [] };
    const restored = parseBackup(JSON.stringify(buildBackup(state)));
    expect(restored.anbar[0].sku).toBe("A");
    expect(restored.settings.currency).toBe("AZN");
  });

  test("bad files are rejected with a readable message", () => {
    expect(() => parseBackup("not json")).toThrow("JSON");
    expect(() => parseBackup("[]")).toThrow();
    expect(() => parseBackup('{"anbar":{}}')).toThrow("anbar");
    expect(() => parseBackup("{}")).toThrow("tapılmadı");
    expect(() => parseBackup('{"app":"hesabla","version":99,"data":{"anbar":[]}}')).toThrow("yeni");
  });
});

describe("gross profit", () => {
  const { grossProfit } = require("./dashboard");

  test("sales minus frozen cost of goods, expenses ignored", () => {
    const report = [
      { name: "A", revenue: 100, cogs: 60, operationType: "Satış" },
      { name: "B", revenue: 50, operationType: "Satış" }, // old record without cogs
      { name: "Kirayə", revenue: 500, operationType: "Xərc" },
    ];
    expect(grossProfit(report)).toBe(90);
    expect(topProducts(report)[0]).toMatchObject({ name: "A", profit: 40 });
  });
});

test("reorderSuggestions lists low items, most urgent first, with a target of 2x minimum", () => {
  const { reorderSuggestions } = require("./stock");
  const list = reorderSuggestions([
    { sku: "ok", name: "Fine", stockCurrent: 20, stockMin: 10, cost: 3 },
    { sku: "low", name: "Low", stockCurrent: 8, stockMin: 10, cost: 2 },
    { sku: "crit", name: "Critical", stockCurrent: 1, stockMin: 10, cost: 5, supplier: "S" },
  ]);
  expect(list.map((i) => i.sku)).toEqual(["crit", "low"]);
  expect(list[0]).toMatchObject({ qty: 19, estimate: 95, supplier: "S" });
  expect(list[1]).toMatchObject({ qty: 12, estimate: 24 });
});
