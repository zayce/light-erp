import { reducer, normalizeState } from "./AppContext";

const makeState = (overrides = {}) =>
  normalizeState({
    anbar: [
      {
        sku: "A-1",
        name: "Alpha",
        category: "Test",
        stockCurrent: 10,
        stockMin: 2,
        price: 5,
      },
      {
        sku: "B-1",
        name: "Beta",
        category: "Test",
        stockCurrent: 4,
        stockMin: 1,
        price: 7,
      },
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
    const next = reducer(makeState(), {
      type: "ADD_REPORT_ITEM",
      payload: sale(),
    });
    expect(stockOf(next, "A-1")).toBe(7);
    expect(next.report[0].sku).toBe("A-1");
  });

  test("deleting the sale after renaming the product still restores stock", () => {
    let state = reducer(makeState(), {
      type: "ADD_REPORT_ITEM",
      payload: sale(),
    });
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
        {
          id: 1,
          name: "Alpha",
          salesCount: 2,
          revenue: 10,
          operationType: "Satış",
          linkedCashflowId: 2,
        },
      ],
      cashflow: [{ id: 2, type: "income", amountRaw: 10 }],
    });
    const next = reducer(state, {
      type: "DELETE_REPORT_ITEM",
      payload: { id: 1 },
    });
    expect(stockOf(next, "A-1")).toBe(12);
  });

  test("editing a sale re-applies the new quantity", () => {
    let state = reducer(makeState(), {
      type: "ADD_REPORT_ITEM",
      payload: sale(),
    });
    state = reducer(state, {
      type: "UPDATE_REPORT_ITEM",
      payload: {
        id: state.report[0].id,
        data: sale({ salesCount: 5, amount: 25 }),
      },
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
    let state = reducer(makeState(), {
      type: "ADD_REPORT_ITEM",
      payload: sale(),
    });
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
      state = reducer(state, {
        type: "ADD_REPORT_ITEM",
        payload: sale({ salesCount: 1, amount: 5 }),
      });
      state = reducer(state, {
        type: "ADD_CASHFLOW_ITEM",
        payload: {
          type: "income",
          amountRaw: 1,
          desc: "x",
          date: "2026-01-01",
        },
      });
    }
    const ids = [...state.report, ...state.cashflow].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("server sync and scanning", () => {
  test("MERGE_ANBAR adds new server products and keeps local ones", () => {
    const next = reducer(makeState(), {
      type: "MERGE_ANBAR",
      payload: [
        { sku: "a-1", name: "Server copy of Alpha", stockCurrent: 999 },
        { sku: "C-1", name: "Gamma", stockCurrent: 1 },
      ],
    });
    expect(next.anbar.map((i) => i.sku).sort()).toEqual(["A-1", "B-1", "C-1"]);
    expect(stockOf(next, "A-1")).toBe(10);
  });

  test("MERGE_ANBAR with an empty list never wipes the warehouse", () => {
    const next = reducer(makeState(), { type: "MERGE_ANBAR", payload: [] });
    expect(next.anbar).toHaveLength(2);
  });

  test("SCAN_PRODUCT adds one unit and never calls alert()", () => {
    const alertSpy = jest.fn();
    window.alert = alertSpy;

    const hit = reducer(makeState(), {
      type: "SCAN_PRODUCT",
      payload: " a-1 ",
    });
    expect(stockOf(hit, "A-1")).toBe(11);

    const miss = reducer(makeState(), {
      type: "SCAN_PRODUCT",
      payload: "nope",
    });
    expect(stockOf(miss, "A-1")).toBe(10);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
