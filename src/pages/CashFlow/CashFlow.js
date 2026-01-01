import "./CashFlow.scss";
import { TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const CashFlow = () => {
  const data = [
    { month: "Yanvar", gelir: 45000, xerc: 28000 },
    { month: "Fevral", gelir: 52000, xerc: 31000 },
    { month: "Mart", gelir: 48000, xerc: 29000 },
    { month: "Aprel", gelir: 61000, xerc: 35000 },
    { month: "May", gelir: 55000, xerc: 32000 },
    { month: "İyun", gelir: 68000, xerc: 39000 },
  ];

  const operations = [
    {
      date: "2024-12-26",
      category: "Satış",
      desc: "Məhsul satışı #1234",
      type: "income",
      amount: "+₼2 450",
    },
    {
      date: "2024-12-25",
      category: "Təchizat",
      desc: "Təchizat alışı - ABC Şirkəti",
      type: "expense",
      amount: "-₼1 200",
    },
    {
      date: "2024-12-25",
      category: "Satış",
      desc: "Məhsul satışı #1233",
      type: "income",
      amount: "+₼3 200",
    },
    {
      date: "2024-12-24",
      category: "Əmək haqqı",
      desc: "Dekabr əmək haqqı",
      type: "expense",
      amount: "-₼5 500",
    },
    {
      date: "2024-12-24",
      category: "Satış",
      desc: "Məhsul satışı #1232",
      type: "income",
      amount: "+₼1 850",
    },
    {
      date: "2024-12-23",
      category: "Kommunal",
      desc: "Elektrik və su",
      type: "expense",
      amount: "-₼450",
    },
    {
      date: "2024-12-23",
      category: "Xidmət",
      desc: "Konsultasiya xidməti",
      type: "income",
      amount: "+₼800",
    },
    {
      date: "2024-12-22",
      category: "İcarə",
      desc: "Ofis icarəsi",
      type: "expense",
      amount: "-₼2 000",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="Chart-Tooltip">
          <div className="Tooltip-Title">{label}</div>
          <div className="Tooltip-Income">Gəlir : {payload[0].value}</div>
          <div className="Tooltip-Expense">Xərc : {payload[1].value}</div>
        </div>
      );
    }
    return null;
  };
  return (
    <>
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
              <button className="button-opis">
                <div className="plus">+</div>
                <div className="button-text"> Əməliyyat Əlavə Et</div>
              </button>
            </div>
          </div>
          <div className="CashFlow-Counts">
            <div className="CashFlow-Count income">
              <div>
                <div className="CashFlow-Count-Title">Ümumi Gəlir</div>
                <div className="CashFlow-Count-Price">₼11 250</div>
              </div>
              <div className="CashFlow-Icon income">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="CashFlow-Count expense">
              <div>
                <div className="CashFlow-Count-Title">Ümumi Xərc</div>
                <div className="CashFlow-Count-Price">₼9 800</div>
              </div>
              <div className="CashFlow-Icon expense">
                <TrendingDown size={22} />
              </div>
            </div>

            <div className="CashFlow-Count balance">
              <div>
                <div className="CashFlow-Count-Title">Xalis Pul Axını</div>
                <div className="CashFlow-Count-Price">₼1 450</div>
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
              <BarChart data={data} barGap={12}>
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

              <div className="Actions">
                <Filter size={18} />
                <select>
                  <option>Hamısı</option>
                  <option>Gəlir</option>
                  <option>Xərc</option>
                </select>
              </div>
            </div>

            <div className="CashFlow-Table Head">
              <div className="CashFlow-Table-Name">TARİX</div>
              <div className="CashFlow-Table-Name">KATEQORİYA</div>
              <div className="CashFlow-Table-Name">TƏSVİR</div>
              <div className="CashFlow-Table-Name">TİP</div>
              <div className="CashFlow-Table-Name">MƏBLƏĞ</div>
            </div>

            <div className="CashFlow-Table-Body">
              {operations.map((op, index) => (
                <div className="CashFlow-Table Row" key={index}>
                  <div className="CashFlow-Table-Body-title">{op.date}</div>
                  <div className="CashFlow-Table-Body-title">{op.category}</div>
                  <div className="CashFlow-Table-Body-title">{op.desc}</div>
                  <div>
                    <span className={`Type ${op.type}`}>
                      {op.type === "income" ? "Gəlir" : "Xərc"}
                    </span>
                  </div>
                  <div className={`Amount ${op.type} Right`}>{op.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
