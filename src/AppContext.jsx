import { createContext, useContext, useEffect, useReducer } from "react";

const AppContext = createContext(null);

const initialState = {
  report: [],
  cashflow: [],
  anbar: [
    {
      sku: "ELEC-001",
      name: 'MacBook Pro 16"',
      category: "Elektronika",
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
      sku: "GEYIM-002",
      name: "Jeans",
      category: "Geyim",
      stockCurrent: 12,
      stockMin: 15,
      price: 65,
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
    {
      sku: "QIDA-002",
      name: "Çay (500g)",
      category: "Qida",
      stockCurrent: 3,
      stockMin: 30,
      price: 12,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "MEBEL-001",
      name: "Ofis Stolu",
      category: "Mebel",
      stockCurrent: 18,
      stockMin: 8,
      price: 280,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "MEBEL-002",
      name: "Ofis Oturacağı",
      category: "Mebel",
      stockCurrent: 6,
      stockMin: 10,
      price: 150,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
    {
      sku: "ELEC-004",
      name: 'Monitor 27"',
      category: "Elektronika",
      stockCurrent: 9,
      stockMin: 12,
      price: 320,
      supplier: "",
      cost: 0,
      status: "Normal",
      desc: "",
      image: "",
      createdAt: Date.now(),
    },
  ],
  categories: ["Elektronika", "Geyim", "Qida", "Mebel", "Digər"],
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const formatCashflowAmount = (type, value) => {
  const numeric = Number(value || 0);
  return `${type === "income" ? "+" : "-"}₼${numeric.toLocaleString("az-AZ")}`;
};

const calcPerformance = (revenue, list, editingId = null) => {
  const filtered = editingId
    ? list.filter((item) => item.id !== editingId)
    : list;

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
  switch (action.type) {
    case "SET_DATA":
      return action.payload;

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
        performance: calcPerformance(revenue, state.report),
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

      const updatedAnbar = state.anbar.map((item) => {
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
        ...state,
        report: [newReportItem, ...state.report],
        cashflow: [newCashflowItem, ...state.cashflow],
        anbar: updatedAnbar,
      };
    }

    case "UPDATE_REPORT_ITEM": {
      const revenue = Number(action.payload.data.amount || 0);
      const salesCount = Number(action.payload.data.salesCount || 0);

      const oldReportItem = state.report.find(
        (item) => item.id === action.payload.id,
      );
      if (!oldReportItem) return state;

      const cashflowType =
        action.payload.data.operationType === "Xərc" ? "expense" : "income";

      const updatedReport = state.report.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              name: action.payload.data.product,
              salesCount,
              revenue,
              performance: calcPerformance(
                revenue,
                state.report,
                action.payload.id,
              ),
              category: action.payload.data.category,
              operationType: action.payload.data.operationType,
              date: action.payload.data.date,
              note: action.payload.data.note || "",
            }
          : item,
      );

      const updatedCashflow = state.cashflow.map((cf) =>
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

      let updatedAnbar = [...state.anbar];

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
        ...state,
        report: updatedReport,
        cashflow: updatedCashflow,
        anbar: updatedAnbar,
      };
    }

    case "DELETE_REPORT_ITEM": {
      const reportItem = state.report.find(
        (item) => item.id === action.payload.id,
      );
      if (!reportItem) return state;

      const updatedAnbar =
        reportItem.operationType !== "Xərc"
          ? state.anbar.map((item) => {
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
          : state.anbar;

      return {
        ...state,
        report: state.report.filter((item) => item.id !== action.payload.id),
        cashflow: state.cashflow.filter(
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
        ...state,
        cashflow: [newItem, ...state.cashflow],
      };
    }

    case "UPDATE_CASHFLOW_ITEM":
      return {
        ...state,
        cashflow: state.cashflow.map((item) => {
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
        ...state,
        cashflow: state.cashflow.filter(
          (item) => item.id !== action.payload.id,
        ),
      };

    case "ADD_ANBAR_ITEM": {
      const exists = state.anbar.some(
        (item) =>
          item.sku.toLowerCase() === action.payload.sku.toLowerCase() ||
          item.name.toLowerCase() === action.payload.name.toLowerCase(),
      );

      if (exists) return state;

      return {
        ...state,
        anbar: [action.payload, ...state.anbar],
      };
    }

    case "UPDATE_ANBAR_ITEM":
      return {
        ...state,
        anbar: state.anbar.map((item) =>
          item.sku === action.payload.sku
            ? { ...item, ...action.payload.data }
            : item,
        ),
      };

    case "DELETE_ANBAR_ITEM":
      return {
        ...state,
        anbar: state.anbar.filter((item) => item.sku !== action.payload.sku),
      };

    case "ADD_CATEGORY": {
      const name = String(action.payload || "").trim();
      if (!name) return state;

      const exists = state.categories.some(
        (cat) => cat.toLowerCase() === name.toLowerCase(),
      );
      if (exists) return state;

      return {
        ...state,
        categories: [name, ...state.categories],
      };
    }

    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (defaultState) => {
      const saved = localStorage.getItem("global-data");
      return safeParse(saved, defaultState);
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
