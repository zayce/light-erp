import {
  DollarSign,
  TrendingDown,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "../../AppContext";
import "./ControlPanel.scss";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export const ControlPanel = () => {
  const { state } = useApp();

  const parseAmount = (value) => {
    return Number(String(value || "").replace(/[^\d]/g, ""));
  };

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("az-AZ")}₼`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("az-AZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dashboardData = useMemo(() => {
    const totalIncome = state.cashflow
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const totalExpense = state.cashflow
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const stockValue = state.anbar.reduce(
      (sum, item) =>
        sum + Number(item.stockCurrent || 0) * Number(item.price || 0),
      0,
    );

    const netProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      stockValue,
      netProfit,
    };
  }, [state.cashflow, state.anbar]);

  const cards = [
    {
      title: "Ümumi Gəlir",
      value: formatMoney(dashboardData.totalIncome),
      percent: "+12.5% bu ay",
      icon: DollarSign,
      color: "green",
      status: "positive",
    },
    {
      title: "Ümumi Xərc",
      value: formatMoney(dashboardData.totalExpense),
      percent: "+8.2% bu ay",
      icon: TrendingDown,
      color: "red",
      status: "negative",
    },
    {
      title: "Anbar Dəyəri",
      value: formatMoney(dashboardData.stockValue),
      percent: "+5.1% bu ay",
      icon: Package,
      color: "blue",
      status: "positive",
    },
    {
      title: "Xalis Mənfəət",
      value: formatMoney(dashboardData.netProfit),
      percent: "+18.3% bu ay",
      icon: TrendingUp,
      color: "purple",
      status: "positive",
    },
  ];

  const lineData = useMemo(() => {
    const monthNames = [
      "Yan",
      "Fev",
      "Mar",
      "Apr",
      "May",
      "İyn",
      "İyl",
      "Avq",
      "Sen",
      "Okt",
      "Noy",
      "Dek",
    ];

    const base = monthNames.map((month) => ({
      month,
      gelir: 0,
      xerc: 0,
    }));

    state.cashflow.forEach((item) => {
      if (!item.date) return;

      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;

      const monthIndex = date.getMonth();
      const amount = parseAmount(item.amount);

      if (item.type === "income") {
        base[monthIndex].gelir += amount;
      } else {
        base[monthIndex].xerc += amount;
      }
    });

    return base;
  }, [state.cashflow]);

  const pieData = useMemo(() => {
    const grouped = state.anbar.reduce((acc, item) => {
      const category = item.category || "Digər";
      const itemValue =
        Number(item.stockCurrent || 0) * Number(item.price || 0);

      acc[category] = (acc[category] || 0) + itemValue;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      percent: total ? Math.round((value / total) * 100) : 0,
    }));
  }, [state.anbar]);

  const operations = useMemo(() => {
    return [...state.cashflow]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((item) => ({
        title: item.desc,
        date: formatDate(item.date),
        amount: item.amount,
        type: item.type,
      }));
  }, [state.cashflow]);

  return (
    <div className="ControlPaner-Wrapper">
      <div className="ControlPanel-Inner">
        <div className="ControlPanel-Titles">
          <div className="ControlPanel-Title">İdarə Paneli</div>
          <div className="ControlPanel-Title-Desc">
            Biznesinizin ümumi vəziyyətinə baxış
          </div>
        </div>

        <div className="cards-grid">
          {cards.map((item, index) => {
            const Icon = item.icon;

            return (
              <div className="card" key={index}>
                <div className={`card-icon ${item.color}`}>
                  <Icon />
                </div>
                <div className="card-info">
                  <div className="card-title">{item.title}</div>
                  <div className="card-value">{item.value}</div>
                  <div className={`card-percent ${item.status}`}>
                    {item.percent}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="Responsive-Chart-Card">
          <div className="chart-card">
            <div className="chart-title">Gəlir və Xərc Dinamikası</div>

            <div className="chart-body">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="gelir"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xerc"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">Kateqoriya üzrə Bölgü</div>

            <div className="chart-body pie-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pie-legend">
              {pieData.map((item, i) => (
                <div className="legend-item" key={item.name}>
                  <div
                    className="legend-color"
                    style={{
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <div className="legend-text">
                    {item.name} ({item.percent}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="operations-card">
          <div className="operations-title">Son Əməliyyatlar</div>

          <div className="operations-list">
            {operations.length > 0 ? (
              operations.map((item, index) => (
                <div className="operation-item" key={index}>
                  <div className={`operation-icon ${item.type}`}>
                    {item.type === "income" ? (
                      <ArrowUpRight size={20} />
                    ) : (
                      <ArrowDownLeft size={20} />
                    )}
                  </div>

                  <div className="operation-info">
                    <div className="operation-name">{item.title}</div>
                    <div className="operation-date">{item.date}</div>
                  </div>

                  <div className={`operation-amount ${item.type}`}>
                    {item.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="operation-empty">Əməliyyat yoxdur</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
