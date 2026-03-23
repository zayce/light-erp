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

  const [operations, setOperations] = useState([
    {
      id: 1,
      date: "2024-12-26",
      category: "Satış",
      desc: "Məhsul satışı #1234",
      type: "income",
      amount: "+₼2 450",
    },
    {
      id: 2,
      date: "2024-12-25",
      category: "Təchizat",
      desc: "Təchizat alışı - ABC Şirkəti",
      type: "expense",
      amount: "-₼1 200",
    },
    {
      id: 3,
      date: "2024-12-25",
      category: "Satış",
      desc: "Məhsul satışı #1233",
      type: "income",
      amount: "+₼3 200",
    },
    {
      id: 4,
      date: "2024-12-24",
      category: "Əmək haqqı",
      desc: "Dekabr əmək haqqı",
      type: "expense",
      amount: "-₼5 500",
    },
    {
      id: 5,
      date: "2024-12-24",
      category: "Satış",
      desc: "Məhsul satışı #1232",
      type: "income",
      amount: "+₼1 850",
    },
    {
      id: 6,
      date: "2024-12-23",
      category: "Kommunal",
      desc: "Elektrik və su",
      type: "expense",
      amount: "-₼450",
    },
    {
      id: 7,
      date: "2024-12-23",
      category: "Xidmət",
      desc: "Konsultasiya xidməti",
      type: "income",
      amount: "+₼800",
    },
    {
      id: 8,
      date: "2024-12-22",
      category: "İcarə",
      desc: "Ofis icarəsi",
      type: "expense",
      amount: "-₼2 000",
    },
  ]);

  const parseAmount = (value) => {
    return Number(String(value).replace(/[^\d]/g, ""));
  };

  const formatMoney = (value) => {
    return `₼${value.toLocaleString("ru-RU")}`;
  };

  const totalIncome = useMemo(() => {
    return operations
      .filter((op) => op.type === "income")
      .reduce((sum, op) => sum + parseAmount(op.amount), 0);
  }, [operations]);

  const totalExpense = useMemo(() => {
    return operations
      .filter((op) => op.type === "expense")
      .reduce((sum, op) => sum + parseAmount(op.amount), 0);
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
          op.category.toLowerCase().includes(term) ||
          op.desc.toLowerCase().includes(term) ||
          op.date.toLowerCase().includes(term) ||
          (op.type === "income" ? "gəlir" : "xərc").includes(term),
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

      const numericAmount = parseAmount(op.amount);

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
      setOperations((prev) =>
        prev.map((item) =>
          item.id === editOperation.id
            ? { ...item, ...operationData, id: editOperation.id }
            : item,
        ),
      );
    } else {
      const newOperation = {
        ...operationData,
        id: Date.now(),
      };

      setOperations((prev) => [newOperation, ...prev]);
    }

    setOpenClashFlow(false);
    setEditOperation(null);
  };

  const handleDeleteOperation = (id) => {
    setOperations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditOperation = (operation) => {
    setEditOperation(operation);
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
            Gəlir : {formatMoney(payload[0].value)}
          </div>
          <div className="Tooltip-Expense">
            Xərc : {formatMoney(payload[1].value)}
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
                  <div className="CashFlow-Table-Body-title">{op.desc}</div>
                  <div>
                    <span className={`Type ${op.type}`}>
                      {op.type === "income" ? "Gəlir" : "Xərc"}
                    </span>
                  </div>
                  <div className={`Amount ${op.type} Right`}>{op.amount}</div>

                  <div className="Row-Actions">
                    <button
                      className="Edit"
                      type="button"
                      onClick={() => handleEditOperation(op)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="Delete"
                      type="button"
                      onClick={() => handleDeleteOperation(op.id)}
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
