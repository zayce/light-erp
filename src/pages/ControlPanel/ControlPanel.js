import {
  DollarSign,
  TrendingDown,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
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
import "./ControlPanel.scss";

export const ControlPanel = () => {
  const cards = [
    {
      title: "Ümumi Gəlir",
      value: "328,500₼",
      percent: "+12.5% bu ay",
      icon: DollarSign,
      color: "green",
      status: "positive",
    },
    {
      title: "Ümumi Xərc",
      value: "193,000₼",
      percent: "+8.2% bu ay",
      icon: TrendingDown,
      color: "red",
      status: "negative",
    },
    {
      title: "Anbar Dəyəri",
      value: "456,200₼",
      percent: "+5.1% bu ay",
      icon: Package,
      color: "blue",
      status: "positive",
    },
    {
      title: "Xalis Mənfəət",
      value: "135,500₼",
      percent: "+18.3% bu ay",
      icon: TrendingUp,
      color: "purple",
      status: "positive",
    },
  ];
  const lineData = [
    { month: "Yan", gelir: 45000, xerc: 28000 },
    { month: "Fev", gelir: 52000, xerc: 31000 },
    { month: "Mar", gelir: 48000, xerc: 29000 },
    { month: "Apr", gelir: 60000, xerc: 33000 },
    { month: "May", gelir: 55000, xerc: 32000 },
    { month: "İyn", gelir: 68000, xerc: 38000 },
  ];

  const pieData = [
    { name: "Elektronika", value: 35 },
    { name: "Geyim", value: 25 },
    { name: "Qida", value: 20 },
    { name: "Digər", value: 20 },
  ];
  const operations = [
    {
      title: "Məhsul satışı #1234",
      date: "26 Dek 2024",
      amount: "+2,450 ₼",
      type: "income",
    },
    {
      title: "Təchizat alışı",
      date: "25 Dek 2024",
      amount: "-1,200 ₼",
      type: "expense",
    },
    {
      title: "Məhsul satışı #1233",
      date: "25 Dek 2024",
      amount: "+3,200 ₼",
      type: "income",
    },
    {
      title: "Əmək haqqı",
      date: "24 Dek 2024",
      amount: "-5,500 ₼",
      type: "expense",
    },
    {
      title: "Məhsul satışı #1232",
      date: "24 Dek 2024",
      amount: "+1,850 ₼",
      type: "income",
    },
  ];

  return (
    <>
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
                      dataKey="gelir"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                    <Line
                      dataKey="xerc"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* <div className="chart-Body-bottom">
                <button>1</button>
                <button>1</button>
                <button>1</button>
                <button>1</button>
              </div> */}
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
                        <Cell
                          key={i}
                          fill={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][i]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pie-legend">
                {pieData.map((item, i) => (
                  <div className="legend-item" key={i}>
                    <div
                      className="legend-color"
                      style={{
                        background: [
                          "#3b82f6",
                          "#8b5cf6",
                          "#10b981",
                          "#f59e0b",
                        ][i],
                      }}
                    />
                    <div className="legend-text">
                      {item.name} ({item.value}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="operations-card">
            <div className="operations-title">Son Əməliyyatlar</div>

            <div className="operations-list">
              {operations.map((item, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
