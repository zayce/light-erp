import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { NewProductModal } from "../../Component/NewProductModal/NewProductModal";
import { useApp } from "../../AppContext";
import "./Anbar.scss";

export const Anbar = () => {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [deletingSku, setDeletingSku] = useState(null);
  const [editing, setEditing] = useState(null);

  const products = state.anbar;
  const categories = state.categories;

  const getStatus = (current, min) => {
    if (current <= min * 0.3) return "kritik";
    if (current < min) return "asagi";
    if (current > min * 2) return "yuksek";
    return "normal";
  };

  const totalStockValue = useMemo(() => {
    return products.reduce(
      (sum, item) =>
        sum + Number(item.stockCurrent || 0) * Number(item.price || 0),
      0,
    );
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((item) =>
      ["asagi", "kritik"].includes(
        getStatus(Number(item.stockCurrent || 0), Number(item.stockMin || 0)),
      ),
    ).length;
  }, [products]);

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

  const addProduct = (data) => {
    const newItem = {
      sku: data.sku.trim(),
      name: data.name.trim(),
      category: data.category,
      stockCurrent: Number(data.stock || 0),
      stockMin: Number(data.minStock || 0),
      price: Number(data.price || 0),
      supplier: data.supplier || "",
      cost: Number(data.cost || 0),
      status: data.status || "Normal",
      desc: data.desc || "",
      image: data.image ? data.image.name : "",
      createdAt: Date.now(),
    };

    dispatch({
      type: "ADD_ANBAR_ITEM",
      payload: newItem,
    });

    setOpenNewProduct(false);
  };

  const deleteProduct = (sku) => {
    setDeletingSku(sku);

    setTimeout(() => {
      dispatch({
        type: "DELETE_ANBAR_ITEM",
        payload: { sku },
      });
      setDeletingSku(null);
    }, 220);
  };

  const startEdit = (sku, field, currentValue) => {
    setEditing({
      sku,
      field,
      value: String(currentValue ?? ""),
    });
  };

  const stopEdit = () => setEditing(null);

  const setEditValue = (value) => {
    setEditing((prev) => ({ ...prev, value }));
  };

  const commitEdit = () => {
    if (!editing) return;

    const { sku, field, value } = editing;

    let normalizedValue = value;

    if (field === "price" || field === "stockCurrent" || field === "stockMin") {
      normalizedValue = Number(value || 0);
    }

    if (field === "sku") {
      normalizedValue = value.trim();
    }

    dispatch({
      type: "UPDATE_ANBAR_ITEM",
      payload: {
        sku,
        data: {
          [field]: normalizedValue,
        },
      },
    });

    stopEdit();
  };

  const cancelEdit = () => stopEdit();

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
    onEditKeyDown,
    className = "",
  }) => {
    const active = editing && editing.sku === sku && editing.field === field;

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

        <div className="Anbar-Filters">
          <input
            type="text"
            placeholder="SKU və ya məhsul adı ilə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Bütün kateqoriyalar</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

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
            const total =
              Number(item.stockCurrent || 0) * Number(item.price || 0);
            const status = getStatus(
              Number(item.stockCurrent || 0),
              Number(item.stockMin || 0),
            );

            const isDeleting = deletingSku === item.sku;

            return (
              <div
                className={`row body ${isDeleting ? "is-deleting" : ""}`}
                key={item.sku}
              >
                <EditableCell
                  sku={item.sku}
                  field="sku"
                  value={item.sku}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell sku"
                />

                <EditableCell
                  sku={item.sku}
                  field="name"
                  value={item.name}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell name"
                />

                <EditableCell
                  sku={item.sku}
                  field="category"
                  value={item.category}
                  options={categories}
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell category"
                />

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
                    onEditKeyDown={onEditKeyDown}
                    className={
                      Number(item.stockCurrent) < Number(item.stockMin)
                        ? "EC-Danger"
                        : ""
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
                    onEditKeyDown={onEditKeyDown}
                  />
                </div>

                <EditableCell
                  sku={item.sku}
                  field="price"
                  value={item.price}
                  type="number"
                  editing={editing}
                  startEdit={startEdit}
                  setEditValue={setEditValue}
                  commitEdit={commitEdit}
                  onEditKeyDown={onEditKeyDown}
                  className="cell price"
                />

                <div className="cell">
                  <span className={`status ${status}`}>
                    {status === "normal" && "Normal"}
                    {status === "asagi" && "Aşağı"}
                    {status === "kritik" && "Kritik"}
                    {status === "yuksek" && "Yüksək"}
                  </span>
                </div>

                <div className="cell total">₼{total.toLocaleString()}</div>

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
          dispatch({
            type: "ADD_CATEGORY",
            payload: cat,
          });
        }}
      />
    </div>
  );
};
