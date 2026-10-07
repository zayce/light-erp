import { reducer, normalizeState } from "./AppContext";

const makeState = (overrides = {}) =>
  normalizeState({
    anbar: [
      { sku: "A-1", name: "Alpha", category: "Test", stockCurrent: 10, stockMin: 2, price: 5 },
      { sku: "B-1", name: "Beta", category: "Test", stockCurrent: 4, stockMin: 1, price: 7 },
    ],
    report: [],
    cashflow: [],
    ...overrides,
  });

const stockOf = (state, sku) =>
  state.anbar.find((i) => i.sku === sku).stockCurrent;

const sale = (extra = {}) => ({
  product: "Alpha",
  sku: "A-1",
  category: "Test",
  operationType: "Satış",
  amount: 15,
  salesCount: 3,
  date: "2026-01-01",
  ...extra,
});

describe("sales and stock", () => {
  test("a sale reduces stock by SKU", () => {
    const next = reducer(makeState(), { type: "ADD_REPORT_ITEM", payload: sale() });
    expect(stockOf(next, "A-1")).toBe(7);
    expect(next.report[0].sku).toBe("A-1");
  });

  test("deleting the sale after renaming the product still restores stock", () => {
    let state = reducer(makeState(), { type: "ADD_REPORT_ITEM", payload: sale() });
    state = reducer(state, {
      type: "UPDATE_ANBAR_ITEM",
      payload: { sku: "A-1", data: { name: "Alpha Renamed" } },
    });
    state = reducer(state, {
      type: "DELETE_REPORT_ITEM",
      payload: { id: state.report[0].id },
    });
    expect(stockOf(state, "A-1")).toBe(10);
    expect(state.report).toHaveLength(0);
    expect(state.cashflow).toHaveLength(0);
  });

  test("old reports without a SKU fall back to matching by name", () => {
    const state = makeState({
      report: [
        { id: 1, name: "Alpha", salesCount: 2, revenue: 10, operationType: "Satış", linkedCashflowId: 2 },
      ],
      cashflow: [{ id: 2, type: "income", amountRaw: 10 }],
    });
    const next = reducer(state, { type: "DELETE_REPORT_ITEM", payload: { id: 1 } });
    expect(stockOf(next, "A-1")).toBe(12);
  });

  test("editing a sale re-applies the new quantity", () => {
    let state = reducer(makeState(), { type: "ADD_REPORT_ITEM", payload: sale() });
    state = reducer(state, {
      type: "UPDATE_REPORT_ITEM",
      payload: { id: state.report[0].id, data: sale({ salesCount: 5, amount: 25 }) },
    });
    expect(stockOf(state, "A-1")).toBe(5);
  });

  test("an expense does not touch stock", () => {
    const next = reducer(makeState(), {
      type: "ADD_REPORT_ITEM",
      payload: sale({ operationType: "Xərc", sku: "", salesCount: 0 }),
    });
    expect(stockOf(next, "A-1")).toBe(10);
  });

  test("renaming a SKU keeps existing reports linked", () => {
    let state = reducer(makeState(), { type: "ADD_REPORT_ITEM", payload: sale() });
    state = reducer(state, {
      type: "UPDATE_ANBAR_ITEM",
      payload: { sku: "A-1", data: { sku: "A-9" } },
    });
    expect(state.report[0].sku).toBe("A-9");
  });
});

describe("ids", () => {
  test("report and cashflow ids never collide, even in the same millisecond", () => {
    let state = makeState();
    for (let i = 0; i < 5; i += 1) {
      state = reducer(state, { type: "ADD_REPORT_ITEM", payload: sale({ salesCount: 1, amount: 5 }) });
      state = reducer(state, {
        type: "ADD_CASHFLOW_ITEM",
        payload: { type: "income", amountRaw: 1, desc: "x", date: "2026-01-01" },
      });
    }
    const ids = [...state.report, ...state.cashflow].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("server sync and scanning", () => {
  test("REPLACE_DATA swaps everything and fills in missing keys", () => {
    const next = reducer(makeState({ purchases: [{ id: 1 }] }), {
      type: "REPLACE_DATA",
      payload: { anbar: [{ sku: "Z-1", name: "Zed", stockCurrent: 1 }] },
    });
    expect(next.anbar.map((i) => i.sku)).toEqual(["Z-1"]);
    expect(next.purchases).toEqual([]);
    expect(next.report).toEqual([]);
    expect(next.settings.currency).toBe("AZN");
  });

  test("RESET_DATA empties business data", () => {
    const next = reducer(makeState(), { type: "RESET_DATA" });
    expect(next.anbar).toEqual([]);
    expect(next.report).toEqual([]);
  });

  test("SCAN_PRODUCT adds one unit and never calls alert()", () => {
    const alertSpy = jest.fn();
    window.alert = alertSpy;

    const hit = reducer(makeState(), { type: "SCAN_PRODUCT", payload: " a-1 " });
    expect(stockOf(hit, "A-1")).toBe(11);

    const miss = reducer(makeState(), { type: "SCAN_PRODUCT", payload: "nope" });
    expect(stockOf(miss, "A-1")).toBe(10);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe("purchases", () => {
  const buy = (extra = {}) => ({
    sku: "A-1",
    qty: 10,
    unitCost: 4,
    supplier: "Baku Trade",
    date: "2026-10-01",
    ...extra,
  });

  test("a purchase adds stock, creates an expense and records the supplier", () => {
    const next = reducer(makeState(), { type: "ADD_PURCHASE", payload: buy() });
    expect(stockOf(next, "A-1")).toBe(20);
    expect(next.purchases).toHaveLength(1);
    expect(next.purchases[0]).toMatchObject({ qty: 10, unitCost: 4, total: 40 });
    expect(next.cashflow[0]).toMatchObject({ type: "expense", amountRaw: 40, category: "Alış" });
    expect(next.anbar.find((i) => i.sku === "A-1").supplier).toBe("Baku Trade");
  });

  test("unknown old cost is replaced, known cost is averaged by quantity", () => {
    let state = reducer(makeState(), { type: "ADD_PURCHASE", payload: buy() });
    expect(state.anbar.find((i) => i.sku === "A-1").cost).toBe(4); // old cost was 0 = unknown

    // stock is now 20 at cost 4; buying 20 more at 10 -> (20*4 + 20*10) / 40 = 7
    state = reducer(state, { type: "ADD_PURCHASE", payload: buy({ qty: 20, unitCost: 10 }) });
    expect(state.anbar.find((i) => i.sku === "A-1").cost).toBe(7);
  });

  test("invalid purchases change nothing", () => {
    const state = makeState();
    expect(reducer(state, { type: "ADD_PURCHASE", payload: buy({ qty: 0 }) }).purchases).toHaveLength(0);
    expect(reducer(state, { type: "ADD_PURCHASE", payload: buy({ unitCost: -1 }) }).purchases).toHaveLength(0);
    expect(reducer(state, { type: "ADD_PURCHASE", payload: buy({ sku: "NOPE" }) }).purchases).toHaveLength(0);
  });

  test("deleting a purchase removes its expense and takes the stock back", () => {
    let state = reducer(makeState(), { type: "ADD_PURCHASE", payload: buy() });
    state = reducer(state, { type: "DELETE_PURCHASE", payload: { id: state.purchases[0].id } });
    expect(stockOf(state, "A-1")).toBe(10);
    expect(state.purchases).toHaveLength(0);
    expect(state.cashflow).toHaveLength(0);
  });

  test("a sale freezes the cost of goods sold", () => {
    let state = reducer(makeState(), { type: "ADD_PURCHASE", payload: buy({ unitCost: 4 }) });
    state = reducer(state, { type: "ADD_REPORT_ITEM", payload: sale({ salesCount: 5, amount: 50 }) });
    expect(state.report[0].cogs).toBe(20);

    // a later purchase at a new price does not rewrite the old sale
    state = reducer(state, { type: "ADD_PURCHASE", payload: buy({ qty: 100, unitCost: 50 }) });
    expect(state.report[0].cogs).toBe(20);
  });

  test("renaming a SKU keeps purchases linked", () => {
    let state = reducer(makeState(), { type: "ADD_PURCHASE", payload: buy() });
    state = reducer(state, { type: "UPDATE_ANBAR_ITEM", payload: { sku: "A-1", data: { sku: "A-9" } } });
    expect(state.purchases[0].sku).toBe("A-9");
  });
});

describe("settings", () => {
  test("UPDATE_SETTINGS merges and keeps defaults", () => {
    const next = reducer(makeState(), { type: "UPDATE_SETTINGS", payload: { currency: "USD" } });
    expect(next.settings).toEqual({ currency: "USD", language: "az", timezone: "Asia/Baku" });
  });
});

describe("stock count", () => {
  test("sets the counted quantity for matching SKUs only", () => {
    const next = reducer(makeState(), {
      type: "STOCK_COUNT",
      payload: [
        { sku: "a-1", counted: 7 },
        { sku: "NOPE", counted: 99 },
      ],
    });
    expect(stockOf(next, "A-1")).toBe(7);
    expect(stockOf(next, "B-1")).toBe(4);
    expect(next.anbar).toHaveLength(2);
  });

  test("ignores negative, empty and non-numeric counts", () => {
    const state = makeState();
    const next = reducer(state, {
      type: "STOCK_COUNT",
      payload: [
        { sku: "A-1", counted: -3 },
        { sku: "B-1", counted: "abc" },
      ],
    });
    expect(stockOf(next, "A-1")).toBe(10);
    expect(stockOf(next, "B-1")).toBe(4);
  });

  test("a count of zero is valid", () => {
    expect(stockOf(reducer(makeState(), { type: "STOCK_COUNT", payload: [{ sku: "A-1", counted: 0 }] }), "A-1")).toBe(0);
  });
});
