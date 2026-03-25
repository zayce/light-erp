import {
  Percent,
  ShoppingCart,
  Package,
  Users,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { useApp } from "../../AppContext";
import "./Report.scss";
import { ReportsModal } from "../../Component/ReportsModal/ReportsModal";

export const Report = () => {
  const { state, dispatch } = useApp();

  const [editOperation, setEditOperation] = useState(null);
  const [openClashFlow, setOpenClashFlow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("revenueDesc");

  const topProducts = state.report;

  const formatMoney = (value) =>
    `₼${Number(value || 0).toLocaleString("az-AZ")}`;

  const cardTitle = [
    "SIRA",
    "MƏHSUL",
    "SATIŞ SAYI",
    "GƏLİR",
    "PERFORMANS",
    "ƏMƏLİYYATLAR",
  ];

  const reportCards = useMemo(() => {
    const totalRevenue = topProducts.reduce(
      (sum, item) => sum + Number(item.revenue || 0),
      0,
    );

    const totalSalesCount = topProducts.reduce(
      (sum, item) => sum + Number(item.salesCount || 0),
      0,
    );

    const activeProducts = state.anbar.filter(
      (item) => Number(item.stockCurrent || 0) > 0,
    ).length;

    const uniqueCategories = new Set(
      topProducts.map((item) => item.category).filter(Boolean),
    ).size;

    const averageSale =
      totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

    return [
      {
        title: "Orta Satış",
        value: formatMoney(averageSale),
        percent: `${totalSalesCount} satış`,
        icon: ShoppingCart,
        color: "green",
        status: "positive",
      },
      {
        title: "Mənfəət Marjası",
        value: formatMoney(totalRevenue),
        percent: `${topProducts.length} əməliyyat`,
        icon: Percent,
        color: "red",
        status: "negative",
      },
      {
        title: "Aktiv Məhsullar",
        value: String(activeProducts),
        percent: "stokda mövcuddur",
        icon: Package,
        color: "blue",
        status: "positive",
      },
      {
        title: "Kateqoriya Sayı",
        value: String(uniqueCategories),
        percent: "aktiv kateqoriya",
        icon: Users,
        color: "purple",
        status: "positive",
      },
    ];
  }, [topProducts, state.anbar]);

  const profitTrend = useMemo(() => {
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
      value: 0,
    }));

    topProducts.forEach((item) => {
      if (!item.date) return;

      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;

      const monthIndex = date.getMonth();
      base[monthIndex].value += Number(item.revenue || 0);
    });

    return base;
  }, [topProducts]);

  const categoryPerf = useMemo(() => {
    const grouped = topProducts.reduce((acc, item) => {
      const key = item.category || "Digər";

      if (!acc[key]) {
        acc[key] = {
          name: key,
          sales: 0,
          profit: 0,
        };
      }

      acc[key].sales += Number(item.salesCount || 0);
      acc[key].profit += Number(item.revenue || 0);

      return acc;
    }, {});

    return Object.values(grouped);
  }, [topProducts]);

  const handleAddOrUpdateOperation = (operationData) => {
    if (editOperation) {
      dispatch({
        type: "UPDATE_REPORT_ITEM",
        payload: {
          id: editOperation.id,
          data: operationData,
        },
      });
    } else {
      dispatch({
        type: "ADD_REPORT_ITEM",
        payload: operationData,
      });
    }

    setOpenClashFlow(false);
    setEditOperation(null);
  };

  const handleEdit = (item) => {
    setEditOperation({
      id: item.id,
      product: item.name,
      category: item.category,
      operationType: item.operationType,
      amount: item.revenue,
      salesCount: item.salesCount,
      date: item.date,
      note: item.note,
    });

    setOpenClashFlow(true);
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Silmək istədiyinə əminsən?");
    if (!confirmDelete) return;

    dispatch({
      type: "DELETE_REPORT_ITEM",
      payload: { id },
    });
  };

  const handleCloseModal = () => {
    setOpenClashFlow(false);
    setEditOperation(null);
  };

  const categories = useMemo(() => {
    const unique = [...new Set(topProducts.map((item) => item.category))];
    return ["All", ...unique];
  }, [topProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...topProducts];

    if (searchTerm.trim()) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    switch (sortBy) {
      case "revenueDesc":
        result.sort((a, b) => Number(b.revenue) - Number(a.revenue));
        break;
      case "revenueAsc":
        result.sort((a, b) => Number(a.revenue) - Number(b.revenue));
        break;
      case "salesDesc":
        result.sort((a, b) => Number(b.salesCount) - Number(a.salesCount));
        break;
      case "salesAsc":
        result.sort((a, b) => Number(a.salesCount) - Number(b.salesCount));
        break;
      case "nameAsc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameDesc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return result.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [topProducts, searchTerm, selectedCategory, sortBy]);

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

          <div className="Report-cards-grid">
            {reportCards.map((item, index) => {
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
                  <AreaChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatMoney(value)} />
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
                    <Tooltip
                      formatter={(value, name) =>
                        name === "profit" ? formatMoney(value) : value
                      }
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Satış sayı" fill="#3b82f6" />
                    <Bar dataKey="profit" name="Gəlir" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="Report-Many-Cards">
            <div className="Report-Many-Cards-Title">
              Ən Çox Satılan Məhsullar
            </div>

            <div className="Report-Toolbar">
              <div className="Report-Search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Məhsul axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="Report-Filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "Bütün Kateqoriyalar" : category}
                  </option>
                ))}
              </select>

              <select
                className="Report-Filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="revenueDesc">Gəlir: böyük → kiçik</option>
                <option value="revenueAsc">Gəlir: kiçik → böyük</option>
                <option value="salesDesc">Satış sayı: böyük → kiçik</option>
                <option value="salesAsc">Satış sayı: kiçik → böyük</option>
                <option value="nameAsc">Ad: A → Z</option>
                <option value="nameDesc">Ad: Z → A</option>
              </select>
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <div key={p.id} className="Tr">
                      <div className="Td rank">#{p.rank}</div>
                      <div className="Td product">{p.name}</div>
                      <div className="Td count">{p.salesCount}</div>
                      <div className="Td revenue">{formatMoney(p.revenue)}</div>

                      <div className="Td perf">
                        <div className="PerfBar">
                          <div
                            className="PerfFill"
                            style={{ width: `${p.performance}%` }}
                          />
                        </div>
                        <div className="PerfText">{p.performance}%</div>
                      </div>

                      <div className="Td actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(p)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(p.id)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="Empty-State">Heç bir nəticə tapılmadı</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportsModal
        open={openClashFlow}
        onClose={handleCloseModal}
        onSubmitOperation={handleAddOrUpdateOperation}
        editOperation={editOperation}
      />
    </>
  );
};
