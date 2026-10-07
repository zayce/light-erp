import {
  DollarSign,
  TrendingDown,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "../../AppContext";
import { formatMoney, formatSignedMoney } from "../../utils/format";
import {
  amountOf,
  grossProfit,
  monthlySeries,
  monthTotals,
  pctChange,
  topProducts,
  stockBreakdown,
  lowStockItems,
} from "../../utils/dashboard";
import { STATUS_LABELS } from "../../utils/stock";
import "./ControlPanel.scss";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
const PERIODS = [
  { value: 3, label: "3 ay" },
  { value: 6, label: "6 ay" },
  { value: 12, label: "12 ay" },
];

const compact = (value) =>
  Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);

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

// `goodWhenUp=false` for expenses: growth is shown in red.
const Trend = ({ change, goodWhenUp = true }) => {
  if (change === null || change === undefined) {
    return (
      <div className="card-trend neutral">
        <Minus size={14} /> müqayisə üçün data yoxdur
      </div>
    );
  }
  if (change === 0) {
    return (
      <div className="card-trend neutral">
        <Minus size={14} /> keçən ayla eyni
      </div>
    );
  }
  const up = change > 0;
  const good = up === goodWhenUp;
  return (
    <div className={`card-trend ${good ? "positive" : "negative"}`}>
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(change)}% keçən aya nisbətən
    </div>
  );
};

const EmptyChart = ({ text }) => <div className="chart-empty">{text}</div>;

export const ControlPanel = () => {
  const { t } = useTranslation();
  const { state } = useApp();
  const [months, setMonths] = useState(6);

  const now = useMemo(() => new Date(), []);

  const dashboardData = useMemo(() => {
    const totalIncome = state.cashflow
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + amountOf(item), 0);

    const totalExpense = state.cashflow
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + amountOf(item), 0);

    const stockValue = state.anbar.reduce(
      (sum, item) =>
        sum + Number(item.stockCurrent || 0) * Number(item.price || 0),
      0,
    );

    const cur = monthTotals(state.cashflow, now.getFullYear(), now.getMonth());
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev = monthTotals(
      state.cashflow,
      prevDate.getFullYear(),
      prevDate.getMonth(),
    );

    return {
      totalIncome,
      totalExpense,
      stockValue,
      netProfit: totalIncome - totalExpense,
      grossProfit: grossProfit(state.report),
      incomeChange: pctChange(cur.income, prev.income),
      expenseChange: pctChange(cur.expense, prev.expense),
      profitChange: pctChange(cur.profit, prev.profit),
    };
  }, [state.cashflow, state.anbar, state.report, now]);

  const cards = [
    {
      title: "Ümumi Gəlir",
      value: formatMoney(dashboardData.totalIncome),
      trend: <Trend change={dashboardData.incomeChange} />,
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Ümumi Xərc",
      value: formatMoney(dashboardData.totalExpense),
      trend: <Trend change={dashboardData.expenseChange} goodWhenUp={false} />,
      icon: TrendingDown,
      color: "red",
    },
    {
      title: "Anbar Dəyəri",
      value: formatMoney(dashboardData.stockValue),
      trend: (
        <div className="card-trend neutral">
          <Package size={14} /> {state.anbar.length} məhsul növü
        </div>
      ),
      icon: Package,
      color: "blue",
    },
    {
      title: "Xalis Mənfəət",
      value: formatMoney(dashboardData.netProfit),
      trend: <Trend change={dashboardData.profitChange} />,
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Brüt Mənfəət",
      value: formatMoney(dashboardData.grossProfit),
      trend: (
        <div className="card-trend neutral">
          <Minus size={14} /> satış gəliri − maya dəyəri
        </div>
      ),
      icon: DollarSign,
      color: "green",
    },
  ];

  const lineData = useMemo(
    () => monthlySeries(state.cashflow, months, now),
    [state.cashflow, months, now],
  );
  const hasLineData = lineData.some((m) => m.gelir || m.xerc);

  const pieData = useMemo(() => {
    const grouped = state.anbar.reduce((acc, item) => {
      const category = item.category || "Digər";
      const itemValue =
        Number(item.stockCurrent || 0) * Number(item.price || 0);
      acc[category] = (acc[category] || 0) + itemValue;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, val) => sum + val, 0);

    return Object.entries(grouped)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 100) : 0,
      }));
  }, [state.anbar]);
  const pieTotal = pieData.reduce((sum, p) => sum + p.value, 0);

  const best = useMemo(() => topProducts(state.report, 5), [state.report]);
  const breakdown = useMemo(() => stockBreakdown(state.anbar), [state.anbar]);
  const lowItems = useMemo(() => lowStockItems(state.anbar, 5), [state.anbar]);

  const operations = useMemo(() => {
    return [...state.cashflow]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((item) => ({
        title: item.desc,
        date: formatDate(item.date),
        amount: formatSignedMoney(item.type, amountOf(item)),
        type: item.type,
      }));
  }, [state.cashflow]);

  const moneyTooltip = (value) => formatMoney(value);

  return (
    <div className="ControlPaner-Wrapper">
      <div className="ControlPanel-Inner">
        <div className="ControlPanel-Titles">
          <div className="ControlPanel-Title">{t("controlPanel")}</div>
          <div className="ControlPanel-Title-Desc">{t("controlPanelDesc")}</div>
        </div>

        <div className="cards-grid">
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <div className="card" key={item.title}>
                <div className={`card-icon ${item.color}`}>
                  <Icon />
                </div>
                <div className="card-info">
                  <div className="card-title">{item.title}</div>
                  <div className="card-value">{item.value}</div>
                  {item.trend}
                </div>
              </div>
            );
          })}
        </div>

        <div className="Responsive-Chart-Card">
          <div className="chart-card">
            <div className="chart-head">
              <div className="chart-title">Gəlir və Xərc Dinamikası</div>
              <div className="segmented" role="group" aria-label="Dövr">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={months === p.value ? "active" : ""}
                    onClick={() => setMonths(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-body">
              {hasLineData ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={lineData}>
                    <defs>
                      <linearGradient id="gGelir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gXerc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
                    <Tooltip formatter={moneyTooltip} />
                    <Area
                      type="monotone"
                      dataKey="gelir"
                      name="Gəlir"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fill="url(#gGelir)"
                    />
                    <Area
                      type="monotone"
                      dataKey="xerc"
                      name="Xərc"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="url(#gXerc)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="Seçilmiş dövrdə pul axını yoxdur" />
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-title">{t("controlPanelKatalogType")}</div>

            {pieData.length > 0 ? (
              <>
                <div className="chart-body pie-center">
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          innerRadius={75}
                          outerRadius={110}
                          paddingAngle={4}
                        >
                          {pieData.map((p, i) => (
                            <Cell key={p.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={moneyTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <div className="donut-label">Cəmi</div>
                      <div className="donut-value">{formatMoney(pieTotal)}</div>
                    </div>
                  </div>
                </div>

                <div className="pie-legend">
                  {pieData.map((item, i) => (
                    <div className="legend-item" key={item.name}>
                      <div
                        className="legend-color"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <div className="legend-text">
                        {item.name} ({item.percent}%)
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChart text="Anbarda dəyəri olan məhsul yoxdur" />
            )}
          </div>
        </div>

        <div className="Insights-Grid">
          <div className="chart-card">
            <div className="chart-title">Ən çox gəlir gətirən məhsullar</div>
            {best.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(180, best.length * 56)}>
                <BarChart data={best} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" tickFormatter={compact} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={moneyTooltip} />
                  <Bar dataKey="revenue" name="Gəlir" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="profit" name="Mənfəət" fill="#22c55e" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Hələ satış qeydi yoxdur" />
            )}
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div className="chart-title">Stok vəziyyəti</div>
              <NavLink to="/warehouse" className="link-more">
                Anbara keç →
              </NavLink>
            </div>

            <div className="status-chips">
              {Object.entries(breakdown).map(([key, count]) => (
                <div className={`status-chip ${key}`} key={key}>
                  <div className="status-chip-count">{count}</div>
                  <div className="status-chip-label">{STATUS_LABELS[key]}</div>
                </div>
              ))}
            </div>

            <div className="low-list">
              {lowItems.length > 0 ? (
                lowItems.map((item) => (
                  <div className="low-item" key={item.sku}>
                    <div className="low-item-top">
                      <span className="low-item-name">{item.name}</span>
                      <span className="low-item-qty">
                        {item.stockCurrent} / {item.stockMin}
                      </span>
                    </div>
                    <div className="stock-bar">
                      <span className={item.status} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="low-ok">✅ Bütün məhsulların stoku normaldır</div>
              )}
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

                  <div className={`operation-amount ${item.type}`}>{item.amount}</div>
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
