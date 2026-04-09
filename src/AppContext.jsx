import { createContext, useContext, useEffect, useReducer } from "react";

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
      id: Date.now() + index,
      name,
      subcategories: [],
    }));
  }

  // new format
  return categories.map((cat, index) => ({
    id: Number(cat?.id) || Date.now() + index,
    name: String(cat?.name || "").trim(),
    subcategories: Array.isArray(cat?.subcategories)
      ? cat.subcategories.map((sub, subIndex) => ({
          id: Number(sub?.id) || Date.now() + index + subIndex + 1000,
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

const normalizeState = (data) => {
  return {
    report: Array.isArray(data?.report) ? data.report : [],
    cashflow: Array.isArray(data?.cashflow) ? data.cashflow : [],
    users: Array.isArray(data?.users) ? data.users : [],
    anbar: normalizeAnbar(data?.anbar),
    categories: normalizeCategories(data?.categories),
  };
};

const formatCashflowAmount = (type, value) => {
  const numeric = Number(value || 0);
  return `${type === "income" ? "+" : "-"}₼${numeric.toLocaleString("az-AZ")}`;
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

const reducer = (state, action) => {
  const safeState = normalizeState(state);

  switch (action.type) {
    case "SET_DATA":
      return normalizeState({
        ...safeState,
        ...action.payload,
      });

    case "ADD_REPORT_ITEM": {
      const revenue = Number(action.payload.amount || 0);
      const salesCount = Number(action.payload.salesCount || 0);
      const operationType = action.payload.operationType;
      const cashflowType = operationType === "Xərc" ? "expense" : "income";

      const reportId = Date.now();
      const cashflowId = reportId + 1;

      const newReportItem = {
        id: reportId,
        name: action.payload.product,
        salesCount,
        revenue,
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

      const updatedAnbar = safeState.anbar.map((item) => {
        if (item.name === action.payload.product && operationType !== "Xərc") {
          return {
            ...item,
            stockCurrent: Math.max(
              0,
              Number(item.stockCurrent || 0) - salesCount,
            ),
          };
        }
        return item;
      });

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

      const updatedReport = safeState.report.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              name: action.payload.data.product,
              salesCount,
              revenue,
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
        updatedAnbar = updatedAnbar.map((item) => {
          if (item.name === oldReportItem.name) {
            return {
              ...item,
              stockCurrent:
                Number(item.stockCurrent || 0) +
                Number(oldReportItem.salesCount || 0),
            };
          }
          return item;
        });
      }

      if (action.payload.data.operationType !== "Xərc") {
        updatedAnbar = updatedAnbar.map((item) => {
          if (item.name === action.payload.data.product) {
            return {
              ...item,
              stockCurrent: Math.max(
                0,
                Number(item.stockCurrent || 0) - salesCount,
              ),
            };
          }
          return item;
        });
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
          ? safeState.anbar.map((item) => {
              if (item.name === reportItem.name) {
                return {
                  ...item,
                  stockCurrent:
                    Number(item.stockCurrent || 0) +
                    Number(reportItem.salesCount || 0),
                };
              }
              return item;
            })
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
        id: Date.now(),
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

    case "UPDATE_ANBAR_ITEM":
      return {
        ...safeState,
        anbar: safeState.anbar.map((item) =>
          item.sku === action.payload.sku
            ? { ...item, ...action.payload.data }
            : item,
        ),
      };

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
        id: Date.now(),
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
                id: Date.now(),
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

    default:
      return safeState;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (defaultState) => {
      const saved = localStorage.getItem("global-data");
      const parsed = safeParse(saved, defaultState);
      return normalizeState(parsed);
    },
  );

  useEffect(() => {
    localStorage.setItem("global-data", JSON.stringify(state));
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
