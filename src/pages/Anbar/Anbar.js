import { useEffect, useMemo, useState } from "react";
import { NewProductModal } from "../NewProductModal/NewProductModal";
import { Trash2 } from "lucide-react";
import "./Anbar.scss";

const STORAGE_KEY = "anbar_products_v1";

const CAT_KEY = "anbar_categories_v1";

export const Anbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const defaultCategories = ["Elektronika", "Geyim", "Qida", "Mebel", "Digər"];
  const initialProducts = [
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

const [deletingSku, setDeletingSku] = useState(null);

const deleteProduct = (sku) => {
  setDeletingSku(sku);
  setTimeout(() => {
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    setDeletingSku(null);
  }, 220);
};

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(CAT_KEY);
      return saved ? JSON.parse(saved) : defaultCategories;
    } catch {
      return defaultCategories;
    }
  });

  useEffect(() => {
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
  }, [categories]);

  // ✅ ВОТ ГЛАВНОЕ: products теперь state
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // ✅ Автосохранение
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const getStatus = (current, min) => {
    if (current <= min * 0.3) return "kritik";
    if (current < min) return "asagi";
    if (current > min * 2) return "yuksek";
    return "normal";
  };

  const totalStockValue = useMemo(
    () =>
      products.reduce((sum, item) => sum + item.stockCurrent * item.price, 0),
    [products],
  );

  const lowStockCount = useMemo(
    () =>
      products.filter((item) =>
        ["asagi", "kritik"].includes(
          getStatus(item.stockCurrent, item.stockMin),
        ),
      ).length,
    [products],
  );

  const totalProductsCount = products.length;

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return products.filter((item) => {
      const matchesSearch =
        item.sku.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // ✅ ДОБАВЛЕНИЕ ИЗ МОДАЛКИ
  const addProduct = (data) => {
    // data приходит из модалки: { name, sku, category, price, stock, minStock, ... }
    const newItem = {
      sku: data.sku.trim(),
      name: data.name.trim(),
      category: data.category,
      stockCurrent: Number(data.stock || 0),
      stockMin: Number(data.minStock || 0),
      price: Number(data.price || 0),
      // можешь сохранить доп поля:
      supplier: data.supplier || "",
      cost: Number(data.cost || 0),
      status: data.status || "Normal",
      desc: data.desc || "",
      image: data.image ? data.image.name : "", // пока просто имя файла
      createdAt: Date.now(),
    };

    // простая защита от одинакового SKU
    const exists = products.some(
      (p) => p.sku.toLowerCase() === newItem.sku.toLowerCase(),
    );
    if (exists) {
      alert("Bu SKU artıq mövcuddur!");
      return;
    }

    setProducts((prev) => [newItem, ...prev]); // добавляем в начало таблицы
    setOpenNewProduct(false);
  };

  // какое поле редактируем сейчас
  const [editing, setEditing] = useState(null);
  // editing = { sku: "ELEC-001", field: "name", value: "..." }

  const startEdit = (sku, field, currentValue) => {
    setEditing({ sku, field, value: String(currentValue ?? "") });
  };

  const stopEdit = () => setEditing(null);

  const isEditing = (sku, field) =>
    editing && editing.sku === sku && editing.field === field;

  const setEditValue = (v) => setEditing((p) => ({ ...p, value: v }));

  const commitEdit = () => {
    if (!editing) return;
    const { sku, field, value } = editing;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku !== sku) return p;

        // нормализация по типам
        if (field === "price") return { ...p, price: Number(value || 0) };
        if (field === "stockCurrent")
          return { ...p, stockCurrent: Number(value || 0) };
        if (field === "stockMin") return { ...p, stockMin: Number(value || 0) };

        // текстовые поля
        const trimmed = field === "sku" ? value.trim() : value;
        return { ...p, [field]: trimmed };
      }),
    );

    stopEdit();
  };

  const cancelEdit = () => stopEdit();

  // Enter сохранить / Esc отменить
  const onEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const EditableCell = ({
    sku,
    field,
    value,
    type = "text",
    options,
    editing,
    startEdit,
    setEditValue,
    commitEdit,
    cancelEdit,
    onEditKeyDown,
    className = "",
  }) => {
    const active = editing && editing.sku === sku && editing.field === field;

    // если select
    if (active && options?.length) {
      return (
        <select
          className={`EC-Input ${className}`}
          value={editing.value}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={commitEdit}
          autoFocus
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // если input
    if (active) {
      return (
        <input
          className={`EC-Input ${className}`}
          value={editing.value}
          type={type}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={onEditKeyDown}
          onBlur={commitEdit}
          autoFocus
        />
      );
    }

    // обычный режим
    return (
      <div
        className={`EC-Text ${className}`}
        onClick={() => startEdit(sku, field, value)}
        title="Click to edit"
      >
        {value}
      </div>
    );
  };

  return (
    <div className="Anbar-Wrapper">
      <div className="Anbar-Inner">
        {/* ...твой header */}
        <div className="Anbar-Header">
          <div className="Anbar-Header-Text">
            <div className="Anbar-Header-Name">Anbar idarəetməsi</div>
            <div className="Anbar-Header-Desc">
              Məhsul inventarınızı idarə edin
            </div>
          </div>

          <div className="Anbar-Header-Button">
            <button
              className="button-opis"
              onClick={() => setOpenNewProduct(true)}
              type="button"
            >
              <div className="button-text">+ Yeni Məhsul</div>
            </button>
          </div>
        </div>

        {/* ...stats */}
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

        {/* ...поиск/фильтр */}
        {/* ...таблица */}
        <div className="Anbar-Objects-Saves">
          <div className="row header">
            <div className="row-Title">SKU</div>
            <div className="row-Title">MƏHSUL ADI</div>
            <div className="row-Title">KATEQORIYA</div>
            <div className="row-Title">STOK</div>
            <div className="row-Title">QIYMƏT</div>
            <div className="row-Title">STATUS</div>
            <div className="row-Title">DƏYƏR</div>
          </div>

          {filteredProducts.map((item) => {
            const total = item.stockCurrent * item.price;
            const status = getStatus(item.stockCurrent, item.stockMin);

            const isDeleting = deletingSku === item.sku;

            return (
              <div
                className={`row body ${isDeleting ? "is-deleting" : ""}`}
                key={item.sku}
              >
                {/* SKU */}
                <EditableCell
                  sku={item.sku}
                  field="sku"
                  value={item.sku}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell sku"
                />

                {/* NAME */}
                <EditableCell
                  sku={item.sku}
                  field="name"
                  value={item.name}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell name"
                />

                {/* CATEGORY (select) */}
                <EditableCell
                  sku={item.sku}
                  field="category"
                  value={item.category}
                  options={categories}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell category"
                />

                {/* STOCK current / min (два inline поля) */}
                <div className="cell stock">
                  <EditableCell
                    sku={item.sku}
                    field="stockCurrent"
                    value={item.stockCurrent}
                    type="number"
                    editing={editing}
                    startEdit={startEdit}
                    setEditValue={setEditValue}
                    commitEdit={commitEdit}
                    cancelEdit={cancelEdit}
                    onEditKeyDown={onEditKeyDown}
                    className={
                      item.stockCurrent < item.stockMin ? "EC-Danger" : ""
                    }
                  />
                  <span className="min"> / </span>
                  <EditableCell
                    sku={item.sku}
                    field="stockMin"
                    value={item.stockMin}
                    type="number"
                    editing={editing}
                    startEdit={startEdit}
                    setEditValue={setEditValue}
                    commitEdit={commitEdit}
                    cancelEdit={cancelEdit}
                    onEditKeyDown={onEditKeyDown}
                  />
                </div>

                {/* PRICE */}
                <EditableCell
                  sku={item.sku}
                  field="price"
                  value={item.price}
                  type="number"
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell price"
                />

                {/* STATUS (оставь как было) */}
                <div className="cell">
                  <span className={`status ${status}`}>
                    {status === "normal" && "Normal"}
                    {status === "asagi" && "Aşağı"}
                    {status === "kritik" && "Kritik"}
                    {status === "yuksek" && "Yüksək"}
                  </span>
                </div>

                {/* TOTAL */}
                <div className="cell total">${total.toLocaleString()}</div>

                {/* TRASH */}
                <button
                  type="button"
                  className="row-delete"
                  onClick={() => deleteProduct(item.sku)}
                  aria-label="delete"
                  title="Sil"
                  disabled={isDeleting}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <NewProductModal
        open={openNewProduct}
        onClose={() => setOpenNewProduct(false)}
        onSubmit={addProduct}
        categories={categories}
        onAddCategory={(cat) => {
          const name = cat.trim();
          if (!name) return;

          setCategories((prev) => {
            const exists = prev.some(
              (c) => c.toLowerCase() === name.toLowerCase(),
            );
            if (exists) return prev;
            return [name, ...prev];
          });
        }}
      />
    </div>
  );
};
