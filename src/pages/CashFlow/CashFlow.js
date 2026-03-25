import "./CashFlow.scss";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ClashFlowModal } from "../../Component/CashFlowModal/ClashFlowModal";
import { useApp } from "../../AppContext";

export const CashFlow = () => {
  const [openClashFlow, setOpenClashFlow] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editOperation, setEditOperation] = useState(null);

  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];

  const { state, dispatch } = useApp();
  const operations = state.cashflow;

  const formatMoney = (value) => {
    return `₼${Number(value || 0).toLocaleString("az-AZ")}`;
  };

  const totalIncome = useMemo(() => {
    return operations
      .filter((op) => op.type === "income")
      .reduce((sum, op) => sum + Number(op.amountRaw || 0), 0);
  }, [operations]);

  const totalExpense = useMemo(() => {
    return operations
      .filter((op) => op.type === "expense")
      .reduce((sum, op) => sum + Number(op.amountRaw || 0), 0);
  }, [operations]);

  const balance = totalIncome - totalExpense;

  const sortedOperations = useMemo(() => {
    return [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [operations]);

  const filteredOperations = useMemo(() => {
    let result = sortedOperations;

    if (filterType !== "all") {
      result = result.filter((op) => op.type === filterType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (op) =>
          String(op.category || "").toLowerCase().includes(term) ||
          String(op.desc || "").toLowerCase().includes(term) ||
          String(op.date || "").toLowerCase().includes(term) ||
          (op.type === "income" ? "gəlir" : "xərc").includes(term) ||
          String(op.source || "").toLowerCase().includes(term)
      );
    }

    return result;
  }, [sortedOperations, filterType, searchTerm]);

  const chartData = useMemo(() => {
    const initialData = months.map((month) => ({
      month,
      gelir: 0,
      xerc: 0,
    }));

    operations.forEach((op) => {
      if (!op.date) return;

      const dateObj = new Date(op.date);
      const monthIndex = dateObj.getMonth();

      if (monthIndex < 0 || monthIndex > 11) return;

      const numericAmount = Number(op.amountRaw || 0);

      if (op.type === "income") {
        initialData[monthIndex].gelir += numericAmount;
      } else {
        initialData[monthIndex].xerc += numericAmount;
      }
    });

    return initialData;
  }, [operations]);

  const handleAddOrUpdateOperation = (operationData) => {
    if (editOperation) {
      dispatch({
        type: "UPDATE_CASHFLOW_ITEM",
        payload: {
          id: editOperation.id,
          data: {
            ...operationData,
            amountRaw: Number(operationData.amountRaw ?? operationData.amount ?? 0),
          },
        },
      });
    } else {
      dispatch({
        type: "ADD_CASHFLOW_ITEM",
        payload: {
          ...operationData,
          amountRaw: Number(operationData.amountRaw ?? operationData.amount ?? 0),
          source: "manual",
          sourceId: null,
        },
      });
    }

    setOpenClashFlow(false);
    setEditOperation(null);
  };

  const handleDeleteOperation = (id) => {
    dispatch({
      type: "DELETE_CASHFLOW_ITEM",
      payload: { id },
    });
  };

  const handleEditOperation = (operation) => {
    setEditOperation({
      ...operation,
      amount: Number(operation.amountRaw || 0),
    });
    setOpenClashFlow(true);
  };

  const handleCloseModal = () => {
    setOpenClashFlow(false);
    setEditOperation(null);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="Chart-Tooltip">
          <div className="Tooltip-Title">{label}</div>
          <div className="Tooltip-Income">
            Gəlir : {formatMoney(payload[0]?.value || 0)}
          </div>
          <div className="Tooltip-Expense">
            Xərc : {formatMoney(payload[1]?.value || 0)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="CashFlow-Wrapper">
      <div className="CashFlow-Inner">
        <div className="CashFlow-Header">
          <div className="CashFlow-Header-Text">
            <div className="CashFlow-Header-Name">Pul Axını</div>
            <div className="CashFlow-Header-Desc">
              Gəlir və xərclərinizi izləyin
            </div>
          </div>

          <div className="CashFlow-Header-Button">
            <button
              className="button-opis"
              onClick={() => {
                setEditOperation(null);
                setOpenClashFlow(true);
              }}
              type="button"
            >
              <div className="plus">+</div>
              <div className="button-text">Əməliyyat Əlavə Et</div>
            </button>
          </div>
        </div>

        <div className="CashFlow-Counts">
          <div className="CashFlow-Count income">
            <div>
              <div className="CashFlow-Count-Title">Ümumi Gəlir</div>
              <div className="CashFlow-Count-Price">
                {formatMoney(totalIncome)}
              </div>
            </div>
            <div className="CashFlow-Icon income">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="CashFlow-Count expense">
            <div>
              <div className="CashFlow-Count-Title">Ümumi Xərc</div>
              <div className="CashFlow-Count-Price">
                {formatMoney(totalExpense)}
              </div>
            </div>
            <div className="CashFlow-Icon expense">
              <TrendingDown size={22} />
            </div>
          </div>

          <div className="CashFlow-Count balance">
            <div>
              <div className="CashFlow-Count-Title">Xalis Pul Axını</div>
              <div className="CashFlow-Count-Price">{formatMoney(balance)}</div>
            </div>
            <div className="CashFlow-Icon balance">
              <Calendar size={22} />
            </div>
          </div>
        </div>

        <div className="CashFlow-Statics">
          <div className="CashFlow-Statics-Title">
            Aylıq Pul Axını Dinamikası
          </div>

          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} barGap={12}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gelir" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="xerc" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="CashFlow-CashCount">
          <div className="CashFlow-CashCount-Header">
            <div className="CashFlow-CashCount-Title">Əməliyyatlar</div>

            <div className="CashFlow-Controls">
              <div className="SearchBox">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="Actions">
                <Filter size={18} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Hamısı</option>
                  <option value="income">Gəlir</option>
                  <option value="expense">Xərc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="CashFlow-Table Head">
            <div className="CashFlow-Table-Name">TARİX</div>
            <div className="CashFlow-Table-Name">KATEQORİYA</div>
            <div className="CashFlow-Table-Name">TƏSVİR</div>
            <div className="CashFlow-Table-Name">TİP</div>
            <div className="CashFlow-Table-Name">MƏBLƏĞ</div>
            <div className="CashFlow-Table-Name Right">ƏMƏLİYYAT</div>
          </div>

          <div className="CashFlow-Table-Body">
            {filteredOperations.length > 0 ? (
              filteredOperations.map((op) => (
                <div className="CashFlow-Table Row" key={op.id}>
                  <div className="CashFlow-Table-Body-title">{op.date}</div>
                  <div className="CashFlow-Table-Body-title">{op.category}</div>

                  <div className="CashFlow-Table-Body-title">
                    {op.desc}
                    {op.source === "report" && (
                      <span className="SourceTag">Report</span>
                    )}
                  </div>

                  <div>
                    <span className={`Type ${op.type}`}>
                      {op.type === "income" ? "Gəlir" : "Xərc"}
                    </span>
                  </div>

                  <div className={`Amount ${op.type} Right`}>
                    {op.amount}
                  </div>

                  <div className="Row-Actions">
                    <button
                      className="Edit"
                      type="button"
                      onClick={() => handleEditOperation(op)}
                      disabled={op.source === "report"}
                      title={
                        op.source === "report"
                          ? "Bu əməliyyat Report səhifəsindən idarə olunur"
                          : "Redaktə et"
                      }
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="Delete"
                      type="button"
                      disabled={op.source === "report"}
                      onClick={() => handleDeleteOperation(op.id)}
                      title={
                        op.source === "report"
                          ? "Bu əməliyyat Report səhifəsindən idarə olunur"
                          : "Sil"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="EmptyState">Heç bir əməliyyat tapılmadı</div>
            )}
          </div>
        </div>
      </div>

      <ClashFlowModal
        open={openClashFlow}
        onClose={handleCloseModal}
        onSubmitOperation={handleAddOrUpdateOperation}
        editOperation={editOperation}
      />
    </div>
  );
};