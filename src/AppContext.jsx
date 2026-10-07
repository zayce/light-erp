import { createContext, useContext, useEffect, useReducer } from "react";
import toast from "react-hot-toast";
import { createId } from "./utils/id";
import { formatSignedMoney, setCurrency } from "./utils/format";
import { readStorage, writeStorage } from "./utils/storage";

const AppContext = createContext(null);

const initialState = {
  report: [],
  cashflow: [],
  users: [],
  anbar: [
    {
      sku: "ELEC-001",
      name: 'MacBook Pro 16"',
      category: "Elektronika",
      subcategory: "Komputer",
      stockCurrent: 15,
      stockMin: 10,
      price: 100,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "ELEC-002",
      name: "iPhone 15 Pro",
      category: "Elektronika",
      subcategory: "Telefon",
      stockCurrent: 8,
      stockMin: 5,
      price: 180,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "ELEC-003",
      name: "Samsung S24",
      category: "Elektronika",
      subcategory: "Telefon",
      stockCurrent: 22,
      stockMin: 10,
      price: 140,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "GEYIM-001",
      name: "Köynək (XL)",
      category: "Geyim",
      subcategory: "Köynək",
      stockCurrent: 45,
      stockMin: 20,
      price: 35,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "QIDA-001",
      name: "Qəhvə (1kg)",
      category: "Qida",
      subcategory: "İçki",
      stockCurrent: 120,
      stockMin: 50,
      price: 18,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
  ],
  categories: [
    {
      id: 1,
      name: "Elektronika",
      subcategories: [
        { id: 11, name: "Komputer" },
        { id: 12, name: "Telefon" },
        { id: 13, name: "Televizor" },
      ],
    },
    {
      id: 2,
      name: "Geyim",
      subcategories: [
        { id: 21, name: "Köynək" },
        { id: 22, name: "Şalvar" },
      ],
    },
    {
      id: 3,
      name: "Qida",
      subcategories: [
        { id: 31, name: "İçki" },
        { id: 32, name: "Şirniyyat" },
      ],
    },
    {
      id: 4,
      name: "Mebel",
      subcategories: [
        { id: 41, name: "Stol" },
        { id: 42, name: "Stul" },
      ],
    },
  ],
};

// Scaner

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeCategories = (categories) => {
  if (!Array.isArray(categories)) return initialState.categories;

  // old format: ["Elektronika", "Qida"]
  if (categories.every((item) => typeof item === "string")) {
    return categories.map((name, index) => ({
      id: createId(),
      name,
      subcategories: [],
    }));
  }

  // new format
  return categories.map((cat, index) => ({
    id: Number(cat?.id) || createId(),
    name: String(cat?.name || "").trim(),
    subcategories: Array.isArray(cat?.subcategories)
      ? cat.subcategories.map((sub, subIndex) => ({
          id: Number(sub?.id) || createId(),
          name: String(sub?.name || "").trim(),
        }))
      : [],
  }));
};

const normalizeAnbar = (anbar) => {
  if (!Array.isArray(anbar)) return initialState.anbar;

  return anbar.map((item) => ({
    ...item,
    category: String(item?.category || "").trim(),
    subcategory: String(item?.subcategory || "").trim(),
    stockCurrent: Number(item?.stockCurrent || 0),
    stockMin: Number(item?.stockMin || 0),
    price: Number(item?.price || 0),
    cost: Number(item?.cost || 0),
  }));
};

const defaultSettings = () => ({
  currency: "AZN",
  language: "az",
  timezone: "Asia/Baku",
});

const normalizeSettings = (settings) => ({
  ...defaultSettings(),
  ...(settings && typeof settings === "object" && !Array.isArray(settings)
    ? settings
    : {}),
});

export const normalizeState = (data) => {
  return {
    report: Array.isArray(data?.report) ? data.report : [],
    cashflow: Array.isArray(data?.cashflow) ? data.cashflow : [],
    users: Array.isArray(data?.users) ? data.users : [],
    anbar: normalizeAnbar(data?.anbar),
    categories: normalizeCategories(data?.categories),
    purchases: Array.isArray(data?.purchases) ? data.purchases : [],
    settings: normalizeSettings(data?.settings),
  };
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const formatCashflowAmount = (type, value) => formatSignedMoney(type, value);

const sameText = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// delta < 0 takes stock out (sale), delta > 0 puts it back.
// Matches by SKU first; falls back to name for reports created before SKU was stored.
const findProductIndex = (anbar, ref) => {
  let index = ref?.sku ? anbar.findIndex((i) => sameText(i.sku, ref.sku)) : -1;
  if (index === -1 && ref?.name) {
    index = anbar.findIndex((i) => sameText(i.name, ref.name));
  }
  return index;
};

const adjustStock = (anbar, ref, delta) => {
  const index = findProductIndex(anbar, ref);
  if (index === -1) return anbar;

  return anbar.map((item, i) =>
    i === index
      ? {
          ...item,
          stockCurrent: Math.max(0, Number(item.stockCurrent || 0) + delta),
        }
      : item,
  );
};

const calcPerformance = (revenue, list, editingId = null) => {
  const safeList = Array.isArray(list) ? list : [];

  const filtered = editingId
    ? safeList.filter((item) => item.id !== editingId)
    : safeList;

  const maxRevenue = filtered.length
    ? Math.max(
        Number(revenue || 0),
        ...filtered.map((item) => Number(item.revenue || 0)),
      )
    : Number(revenue || 0);

  if (!maxRevenue) return 1;

  return Math.max(
    1,
    Math.min(100, Math.round((Number(revenue || 0) / maxRevenue) * 100)),
  );
};

export const reducer = (state, action) => {
  const safeState = normalizeState(state);

  switch (action.type) {
    case "SET_DATA":
      return normalizeState({
        ...safeState,
        ...action.payload,
      });

    // Replaces everything (used when data arrives from the server or a backup).
    case "REPLACE_DATA":
      return normalizeState(action.payload);

    case "RESET_DATA":
      return normalizeState({
        report: [],
        cashflow: [],
        users: [],
        anbar: [],
        purchases: [],
      });

    case "UPDATE_SETTINGS":
      return {
        ...safeState,
        settings: normalizeSettings({
          ...safeState.settings,
          ...action.payload,
        }),
      };

    case "ADD_REPORT_ITEM": {
      const revenue = Number(action.payload.amount || 0);
      const salesCount = Number(action.payload.salesCount || 0);
      const operationType = action.payload.operationType;
      const cashflowType = operationType === "Xərc" ? "expense" : "income";

      const reportId = createId();
      const cashflowId = createId();

      // cost of goods sold, frozen at the moment of the sale
      const soldIndex =
        operationType !== "Xərc"
          ? findProductIndex(safeState.anbar, {
              sku: action.payload.sku,
              name: action.payload.product,
            })
          : -1;
      const cogs =
        soldIndex === -1
          ? 0
          : round2(salesCount * Number(safeState.anbar[soldIndex].cost || 0));

      const newReportItem = {
        id: reportId,
        name: action.payload.product,
        sku: action.payload.sku || "",
        salesCount,
        revenue,
        cogs,
        performance: calcPerformance(revenue, safeState.report),
        category: action.payload.category,
        operationType,
        date: action.payload.date,
        note: action.payload.note || "",
        linkedCashflowId: cashflowId,
      };

      const newCashflowItem = {
        id: cashflowId,
        date: action.payload.date,
        category: action.payload.category || operationType,
        desc: action.payload.product,
        type: cashflowType,
        amountRaw: revenue,
        amount: formatCashflowAmount(cashflowType, revenue),
        source: "report",
        sourceId: reportId,
      };

      const updatedAnbar =
        operationType !== "Xərc"
          ? adjustStock(
              safeState.anbar,
              { sku: action.payload.sku, name: action.payload.product },
              -salesCount,
            )
          : safeState.anbar;

      return {
        ...safeState,
        report: [newReportItem, ...safeState.report],
        cashflow: [newCashflowItem, ...safeState.cashflow],
        anbar: updatedAnbar,
      };
    }

    case "UPDATE_REPORT_ITEM": {
      const revenue = Number(action.payload.data.amount || 0);
      const salesCount = Number(action.payload.data.salesCount || 0);

      const oldReportItem = safeState.report.find(
        (item) => item.id === action.payload.id,
      );
      if (!oldReportItem) return safeState;

      const cashflowType =
        action.payload.data.operationType === "Xərc" ? "expense" : "income";

      const soldIndex =
        action.payload.data.operationType !== "Xərc"
          ? findProductIndex(safeState.anbar, {
              sku: action.payload.data.sku,
              name: action.payload.data.product,
            })
          : -1;
      const cogs =
        soldIndex === -1
          ? 0
          : round2(salesCount * Number(safeState.anbar[soldIndex].cost || 0));

      const updatedReport = safeState.report.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              name: action.payload.data.product,
              sku: action.payload.data.sku || item.sku || "",
              salesCount,
              revenue,
              cogs,
              performance: calcPerformance(
                revenue,
                safeState.report,
                action.payload.id,
              ),
              category: action.payload.data.category,
              operationType: action.payload.data.operationType,
              date: action.payload.data.date,
              note: action.payload.data.note || "",
            }
          : item,
      );

      const updatedCashflow = safeState.cashflow.map((cf) =>
        cf.id === oldReportItem.linkedCashflowId
          ? {
              ...cf,
              date: action.payload.data.date,
              category:
                action.payload.data.category ||
                action.payload.data.operationType,
              desc: action.payload.data.product,
              type: cashflowType,
              amountRaw: revenue,
              amount: formatCashflowAmount(cashflowType, revenue),
            }
          : cf,
      );

      let updatedAnbar = [...safeState.anbar];

      if (oldReportItem.operationType !== "Xərc") {
        updatedAnbar = adjustStock(
          updatedAnbar,
          { sku: oldReportItem.sku, name: oldReportItem.name },
          Number(oldReportItem.salesCount || 0),
        );
      }

      if (action.payload.data.operationType !== "Xərc") {
        updatedAnbar = adjustStock(
          updatedAnbar,
          {
            sku: action.payload.data.sku,
            name: action.payload.data.product,
          },
          -salesCount,
        );
      }

      return {
        ...safeState,
        report: updatedReport,
        cashflow: updatedCashflow,
        anbar: updatedAnbar,
      };
    }

    case "DELETE_REPORT_ITEM": {
      const reportItem = safeState.report.find(
        (item) => item.id === action.payload.id,
      );
      if (!reportItem) return safeState;

      const updatedAnbar =
        reportItem.operationType !== "Xərc"
          ? adjustStock(
              safeState.anbar,
              { sku: reportItem.sku, name: reportItem.name },
              Number(reportItem.salesCount || 0),
            )
          : safeState.anbar;

      return {
        ...safeState,
        report: safeState.report.filter(
          (item) => item.id !== action.payload.id,
        ),
        cashflow: safeState.cashflow.filter(
          (cf) => cf.id !== reportItem.linkedCashflowId,
        ),
        anbar: updatedAnbar,
      };
    }

    case "ADD_CASHFLOW_ITEM": {
      const raw = Number(action.payload.amountRaw || 0);
      const type = action.payload.type || "income";

      const newItem = {
        ...action.payload,
        id: createId(),
        type,
        amountRaw: raw,
        amount: formatCashflowAmount(type, raw),
        source: action.payload.source || "manual",
        sourceId: action.payload.sourceId || null,
      };

      return {
        ...safeState,
        cashflow: [newItem, ...safeState.cashflow],
      };
    }

    case "UPDATE_CASHFLOW_ITEM":
      return {
        ...safeState,
        cashflow: safeState.cashflow.map((item) => {
          if (item.id !== action.payload.id) return item;

          const raw = Number(
            action.payload.data.amountRaw ?? item.amountRaw ?? 0,
          );
          const type = action.payload.data.type || item.type;

          return {
            ...item,
            ...action.payload.data,
            type,
            amountRaw: raw,
            amount: formatCashflowAmount(type, raw),
          };
        }),
      };

    case "DELETE_CASHFLOW_ITEM":
      return {
        ...safeState,
        cashflow: safeState.cashflow.filter(
          (item) => item.id !== action.payload.id,
        ),
      };

    case "ADD_ANBAR_ITEM": {
      const anbar = safeState.anbar || [];

      const exists = anbar.some(
        (item) =>
          String(item.sku).toLowerCase() ===
            String(action.payload.sku).toLowerCase() ||
          String(item.name).toLowerCase() ===
            String(action.payload.name).toLowerCase(),
      );

      if (exists) return safeState;

      return {
        ...safeState,
        anbar: [action.payload, ...anbar],
      };
    }

    case "SET_ANBAR":
      return {
        ...state,
        anbar: action.payload,
      };

    case "UPDATE_ANBAR_ITEM": {
      const newSku = action.payload.data?.sku;
      const skuChanged = newSku !== undefined && newSku !== action.payload.sku;

      return {
        ...safeState,
        anbar: safeState.anbar.map((item) =>
          item.sku === action.payload.sku
            ? { ...item, ...action.payload.data }
            : item,
        ),
        report: skuChanged
          ? safeState.report.map((r) =>
              r.sku === action.payload.sku ? { ...r, sku: newSku } : r,
            )
          : safeState.report,
        purchases: skuChanged
          ? safeState.purchases.map((p) =>
              p.sku === action.payload.sku ? { ...p, sku: newSku } : p,
            )
          : safeState.purchases,
      };
    }

    case "DELETE_ANBAR_ITEM":
      return {
        ...safeState,
        anbar: safeState.anbar.filter(
          (item) => item.sku !== action.payload.sku,
        ),
      };

    case "ADD_CATEGORY": {
      const name = String(action.payload?.name || "").trim();
      if (!name) return safeState;

      const exists = safeState.categories.some(
        (cat) => cat.name.toLowerCase() === name.toLowerCase(),
      );

      if (exists) return safeState;

      const newCategory = {
        id: createId(),
        name,
        subcategories: [],
      };

      return {
        ...safeState,
        categories: [newCategory, ...safeState.categories],
      };
    }

    case "ADD_SUBCATEGORY": {
      const categoryId = Number(action.payload?.categoryId);
      const name = String(action.payload?.name || "").trim();

      if (!categoryId || !name) return safeState;

      return {
        ...safeState,
        categories: safeState.categories.map((cat) => {
          if (cat.id !== categoryId) return cat;

          const exists = cat.subcategories.some(
            (sub) => sub.name.toLowerCase() === name.toLowerCase(),
          );

          if (exists) return cat;

          return {
            ...cat,
            subcategories: [
              ...cat.subcategories,
              {
                id: createId(),
                name,
              },
            ],
          };
        }),
      };
    }

    case "ADD_USER":
      return {
        ...safeState,
        users: [action.payload, ...safeState.users],
      };

    case "UPDATE_USER":
      return {
        ...safeState,
        users: safeState.users.map((user) =>
          user.id === action.payload.id ? action.payload : user,
        ),
      };

    case "DELETE_USER":
      return {
        ...safeState,
        users: safeState.users.filter((user) => user.id !== action.payload.id),
      };

    // Stock-take: sets the real counted quantity. payload: [{ sku, counted }]
    case "STOCK_COUNT": {
      const counts = new Map(
        (Array.isArray(action.payload) ? action.payload : [])
          .filter((c) => c && Number.isFinite(Number(c.counted)) && Number(c.counted) >= 0)
          .map((c) => [String(c.sku).trim().toLowerCase(), Number(c.counted)]),
      );
      if (counts.size === 0) return safeState;

      return {
        ...safeState,
        anbar: safeState.anbar.map((item) => {
          const key = String(item.sku).trim().toLowerCase();
          return counts.has(key)
            ? { ...item, stockCurrent: counts.get(key) }
            : item;
        }),
      };
    }

    case "ADD_PURCHASE": {
      const qty = Number(action.payload?.qty);
      const unitCost = Number(action.payload?.unitCost);
      if (!(qty > 0) || !(unitCost >= 0)) return safeState;

      const index = findProductIndex(safeState.anbar, {
        sku: action.payload.sku,
        name: action.payload.name,
      });
      if (index === -1) return safeState;

      const product = safeState.anbar[index];
      const total = round2(qty * unitCost);
      const purchaseId = createId();
      const cashflowId = createId();
      const date = action.payload.date || new Date().toISOString().slice(0, 10);

      const oldStock = Number(product.stockCurrent || 0);
      const oldCost = Number(product.cost || 0);
      // Weighted average cost. An old cost of 0 means "unknown", so it is not averaged in.
      const newCost =
        oldCost > 0 && oldStock > 0
          ? round2((oldStock * oldCost + qty * unitCost) / (oldStock + qty))
          : round2(unitCost);

      const supplier = String(action.payload.supplier || "").trim();

      const purchase = {
        id: purchaseId,
        sku: product.sku,
        name: product.name,
        qty,
        unitCost: round2(unitCost),
        total,
        supplier,
        date,
        note: String(action.payload.note || "").trim(),
        linkedCashflowId: cashflowId,
      };

      const cashflowItem = {
        id: cashflowId,
        date,
        category: "Alış",
        desc: `Alış: ${product.name} ×${qty}`,
        type: "expense",
        amountRaw: total,
        amount: formatCashflowAmount("expense", total),
        source: "purchase",
        sourceId: purchaseId,
      };

      return {
        ...safeState,
        anbar: safeState.anbar.map((item, i) =>
          i === index
            ? {
                ...item,
                stockCurrent: oldStock + qty,
                cost: newCost,
                supplier: item.supplier || supplier,
              }
            : item,
        ),
        purchases: [purchase, ...safeState.purchases],
        cashflow: [cashflowItem, ...safeState.cashflow],
      };
    }

    // Removes the purchase and its expense and takes the received stock back out.
    // The averaged cost is not rolled back (history of older costs is not kept).
    case "DELETE_PURCHASE": {
      const purchase = safeState.purchases.find(
        (p) => p.id === action.payload.id,
      );
      if (!purchase) return safeState;

      return {
        ...safeState,
        purchases: safeState.purchases.filter((p) => p.id !== purchase.id),
        cashflow: safeState.cashflow.filter(
          (c) => c.id !== purchase.linkedCashflowId,
        ),
        anbar: adjustStock(
          safeState.anbar,
          { sku: purchase.sku, name: purchase.name },
          -Number(purchase.qty || 0),
        ),
      };
    }

    case "SCAN_PRODUCT": {
      const code = String(action.payload).trim().toLowerCase();

      let found = false;

      const updatedAnbar = safeState.anbar.map((item) => {
        const match =
          String(item.sku).toLowerCase() === code ||
          String(item.barcode || "").toLowerCase() === code ||
          String(item.name).toLowerCase() === code;

        if (match) {
          found = true;

          return {
            ...item,
            stockCurrent: Number(item.stockCurrent || 0) + 1,
          };
        }

        return item;
      });

      // Bildiriş UI qatında göstərilir (reducer təmiz qalır)
      if (!found) return safeState;

      return {
        ...safeState,
        anbar: updatedAnbar,
      };
    }

    default:
      return safeState;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (defaultState) => {
      const saved = readStorage("global-data");
      const parsed = safeParse(saved, defaultState);
      return normalizeState(parsed);
    },
  );

  // Keep the money formatter in sync with the saved currency (idempotent).
  setCurrency(state.settings?.currency);

  useEffect(() => {
    const ok = writeStorage("global-data", JSON.stringify(state));
    if (!ok) {
      toast.error("Yaddaş doludur: dəyişikliklər brauzerdə saxlanıla bilmədi", {
        id: "storage-full",
      });
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
};
