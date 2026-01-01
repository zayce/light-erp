import "./Anbar.scss";
import { useState } from "react";

export const Anbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products = [
    {
      sku: "ELEC-001",
      name: 'MacBook Pro 16"',
      category: "Elektronika",
      stockCurrent: 15,
      stockMin: 10,
      price: 100,
    },
    {
      sku: "ELEC-002",
      name: "iPhone 15 Pro",
      category: "Elektronika",
      stockCurrent: 8,
      stockMin: 15,
      price: 180,
    },
    {
      sku: "ELEC-003",
      name: "Samsung S24",
      category: "Elektronika",
      stockCurrent: 22,
      stockMin: 10,
      price: 140,
    },
    {
      sku: "GEYIM-001",
      name: "Köynək (XL)",
      category: "Geyim",
      stockCurrent: 45,
      stockMin: 20,
      price: 35,
    },
    {
      sku: "GEYIM-002",
      name: "Jeans",
      category: "Geyim",
      stockCurrent: 12,
      stockMin: 15,
      price: 65,
    },
    {
      sku: "QIDA-001",
      name: "Qəhvə (1kg)",
      category: "Qida",
      stockCurrent: 120,
      stockMin: 50,
      price: 18,
    },
    {
      sku: "QIDA-002",
      name: "Çay (500g)",
      category: "Qida",
      stockCurrent: 3,
      stockMin: 30,
      price: 12,
    },
    {
      sku: "MEBEL-001",
      name: "Ofis Stolu",
      category: "Mebel",
      stockCurrent: 18,
      stockMin: 8,
      price: 280,
    },
    {
      sku: "MEBEL-002",
      name: "Ofis Oturacağı",
      category: "Mebel",
      stockCurrent: 6,
      stockMin: 10,
      price: 150,
    },
    {
      sku: "ELEC-004",
      name: 'Monitor 27"',
      category: "Elektronika",
      stockCurrent: 9,
      stockMin: 12,
      price: 320,
    },
    
  ];

  const getStatus = (current, min) => {
    if (current <= min * 0.3) return "kritik";
    if (current < min) return "asagi";
    if (current > min * 2) return "yuksek";
    return "normal";
  };

  const totalStockValue = products.reduce((sum, item) => {
    return sum + item.stockCurrent * item.price;
  }, 0);

  const lowStockCount = products.filter((item) => {
    const status = getStatus(item.stockCurrent, item.stockMin);
    return status === "asagi" || status === "kritik";
  }).length;

  const totalProductsCount = products.length;

  const filteredProducts = products.filter((item) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.sku.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="Anbar-Wrapper">
        <div className="Anbar-Inner">
          <div className="Anbar-Header">
            <div className="Anbar-Header-Text">
              <div className="Anbar-Header-Name">Anbar idarəetməsi</div>
              <div className="Anbar-Header-Desc">
                Məhsul inventarınızı idarə edin
              </div>
            </div>
            <div className="Anbar-Header-Button">
              <button className="button-opis">
                <div className="plus">+</div>
                <div className="button-text"> Yeni Məhsul</div>
              </button>
            </div>
          </div>
          <div className="Stats">
            <div className="Stats-Card">
              <div className="Stats-Icon blue">📦</div>
              <div className="Stats-Text">
                <div className="Stats-Title">Ümumi Məhsul</div>
                <div className="Stats-Value">{totalProductsCount}</div>
              </div>
            </div>
            <div className="Stats-Card">
              <div className="Stats-Icon orange">⚠️</div>
              <div className="Stats-Text">
                <div className="Stats-Title">Aşağı Stok</div>
                <div className="Stats-Value">{lowStockCount}</div>
              </div>
            </div>
            <div className="Stats-Card">
              <div className="Stats-Icon green">✅</div>
              <div className="Stats-Text">
                <div className="Stats-Title">Ümumi Dəyər</div>
                <div className="Stats-Value">
                  ₼{totalStockValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div className="Anbar-Input-Filter">
            <div className="Filter-Search">
              <span className="Search-Icon">🔍</span>
              <input
                type="text"
                placeholder="Məhsul adı və ya SKU ilə axtarın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="Filter-Select">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Bütün Kateqoriyalar</option>
                <option value="Elektronika">Elektronika</option>
                <option value="Geyim">Geyim</option>
                <option value="Qida">Qida</option>
                <option value="Mebel">Mebel</option>
              </select>
            </div>
          </div>
          
          <div className="Anbar-Objects-Saves">
            {/* HEADER */}
            <div className="row header">
              <div className="row-Title">SKU</div>
              <div className="row-Title">MƏHSUL ADI</div>
              <div className="row-Title">KATEQORIYA</div>
              <div className="row-Title">STOK</div>
              <div className="row-Title">QIYMƏT</div>
              <div className="row-Title">STATUS</div>
              <div className="row-Title">DƏYƏR</div>
            </div>

            {/* ROWS */}
            {filteredProducts.map((item) => {
              const total = item.stockCurrent * item.price;
              const status = getStatus(item.stockCurrent, item.stockMin);

              return (
                <div className="row body" key={item.sku}>
                  <div className="sku">{item.sku}</div>

                  <div className="name">{item.name}</div>

                  <div className="category">{item.category}</div>

                  <div className="stock">
                    <span
                      className={
                        item.stockCurrent < item.stockMin
                          ? "current danger"
                          : "current"
                      }
                    >
                      {item.stockCurrent}
                    </span>
                    <span className="min"> / {item.stockMin}</span>
                  </div>

                  <div className="price">${item.price}</div>

                  <div>
                    <span className={`status ${status}`}>
                      {status === "normal" && "Normal"}
                      {status === "asagi" && "Aşağı"}
                      {status === "kritik" && "Kritik"}
                      {status === "yuksek" && "Yüksək"}
                    </span>
                  </div>

                  <div className="total">${total.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
