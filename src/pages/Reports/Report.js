import {
  Percent,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import "./Report.scss";

export const Report = () => {
  const cards = [
    {
      title: "Orta Satış",
      value: "$54,667",
      percent: "+12.5% bu ay",
      icon: ShoppingCart,
      color: "green",
      status: "positive",
    },
    {
      title: "Mənfəət Marjası",
      value: "193,000₼",
      percent: "+8.2% bu ay",
      icon: Percent,
      color: "red",
      status: "negative",
    },
    {
      title: "Aktiv Məhsullar",
      value: "456,200₼",
      percent: "+5.1% bu ay",
      icon: Package,
      color: "blue",
      status: "positive",
    },
    {
      title: "Müştəri Sayı",
      value: "135,500₼",
      percent: "+18.3% bu ay",
      icon: Users,
      color: "purple",
      status: "positive",
    },
  ];

  const cardTitle = ["SIRA", "MƏHSUL", "SATIŞ SAYI", "GƏLİR", "PERFORMANS"];

  const profitTrend = [
    { month: "Yan", value: 17000 },
    { month: "Fev", value: 21000 },
    { month: "Mar", value: 19000 },
    { month: "Apr", value: 26000 },
    { month: "May", value: 23000 },
    { month: "İyn", value: 29500 },
  ];

  const categoryPerf = [
    { name: "Elektronika", sales: 125000, profit: 32000 },
    { name: "Geyim", sales: 85000, profit: 28000 },
    { name: "Qida", sales: 65000, profit: 18000 },
    { name: "Mebel", sales: 42000, profit: 12000 },
  ];

  const topProducts = [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      salesCount: 48,
      revenue: 153600,
      performance: 100,
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      salesCount: 72,
      revenue: 129600,
      performance: 84,
    },
    {
      id: 3,
      name: "Samsung Galaxy S24",
      salesCount: 65,
      revenue: 91000,
      performance: 59,
    },
    {
      id: 4,
      name: "Qəhvə (1kg)",
      salesCount: 340,
      revenue: 6120,
      performance: 4,
    },
    {
      id: 5,
      name: "Ofis Stolu",
      salesCount: 28,
      revenue: 7840,
      performance: 5,
    },
  ];

  const formatAzMoney = (n) =>
    n.toLocaleString("az-AZ", { maximumFractionDigits: 0 });

  return (
    <>
      <div className="Report-Wrapper">
        <div className="Report-Inner">
          <div className="Report-Titles">
            <div className="Report-Title">
              <div className="Report-Title-Name">Hesabatlar və Analitika</div>
              <div className="Report-Title-Desc">
                Biznesinizin performansını qiymətləndirin
              </div>
            </div>
            <div className="Report-Header-Button">
              <button className="button-opis">
                <div className="plus">+</div>
                <div className="button-text"> Əməliyyat Əlavə Et</div>
              </button>
            </div>
          </div>

          <div className="Report-cards-grid">
            {cards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div className="Card" key={index}>
                  <div className={`card-info ${item.color}`}>
                    <div className="card-title">{item.title}</div>
                    <div className="card-value">{item.value}</div>
                    <div className={`card-percent ${item.status}`}>
                      {item.percent}
                    </div>
                  </div>
                  <div className="card-icon">
                    <Icon />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="Report-Charts">
            <div className="ChartCard">
              <div className="ChartTitle">Mənfəət Tendensiyası</div>
              <div className="ChartBody">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={profitTrend}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ChartCard">
              <div className="ChartTitle">Kateqoriya üzrə Performans</div>
              <div className="ChartBody">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerf}>
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar dataKey="sales" name="Satış" fill="#3b82f6" />
                    <Bar dataKey="profit" name="Mənfəət" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="Report-Many-Cards">
            <div className="Report-Many-Cards-Title">
              Ən Çox Satılan Məhsullar
            </div>

            <div className="Report-Many-Cards-Table">
              <div className="Table-Head">
                {cardTitle.map((t, i) => (
                  <div key={i} className="Th">
                    {t}
                  </div>
                ))}
              </div>
              <div className="Table-Body">
                {topProducts.map((p) => (
                  <div key={p.id} className="Tr">
                    <div className="Td rank">#{p.id}</div>
                    <div className="Td product">{p.name}</div>
                    <div className="Td count">{p.salesCount}</div>
                    <div className="Td revenue">
                      ₼{formatAzMoney(p.revenue)}
                    </div>

                    <div className="Td perf">
                      <div className="PerfBar">
                        <div
                          className="PerfFill"
                          style={{ width: `${p.performance}%` }}
                        />
                      </div>
                      <div className="PerfText">{p.performance}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
