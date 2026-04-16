import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { NewProductModal } from "../../Component/NewProductModal/NewProductModal";
import { useApp } from "../../AppContext";
import "./Anbar.scss";
import { CameraScanner } from "../../Component/CameraScaner/CameraScaner";
export const Anbar = () => {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [deletingSku, setDeletingSku] = useState(null);
  const [editing, setEditing] = useState(null);

  // Scaner Function
  const [lastScanned, setLastScanned] = useState(null);

  const [flash, setFlash] = useState(false);
  const handleScan = (code) => {
    setLastScanned(code);

    dispatch({
      type: "SCAN_PRODUCT",
      payload: code,
    });
  };

  const products = Array.isArray(state?.anbar) ? state.anbar : [];
  const rawCategories = Array.isArray(state?.categories)
    ? state.categories
    : [];

  // Нормализуем категории: и строки, и объекты приводим к одному виду
  const categories = useMemo(() => {
    return rawCategories.map((cat, index) => {
      if (typeof cat === "string") {
        return {
          id: `legacy-${index}`,
          name: cat,
          subcategories: [],
        };
      }

      return {
        id: cat?.id ?? `cat-${index}`,
        name: String(cat?.name || "").trim(),
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories.map((sub, subIndex) => {
              if (typeof sub === "string") {
                return {
                  id: `legacy-sub-${index}-${subIndex}`,
                  name: sub,
                };
              }

              return {
                id: sub?.id ?? `sub-${index}-${subIndex}`,
                name: String(sub?.name || "").trim(),
              };
            })
          : [],
      };
    });
  }, [rawCategories]);

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategory === "all") return null;
    return categories.find((cat) => cat.name === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const visibleSubcategories = selectedCategoryObj?.subcategories || [];

  const getStatus = (current, min) => {
    if (current <= min * 0.3) return "kritik";
    if (current < min) return "asagi";
    if (current > min * 2) return "yuksek";
    return "normal";
  };

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, item) => {
      return sum + Number(item?.stockCurrent || 0) * Number(item?.price || 0);
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((item) =>
      ["asagi", "kritik"].includes(
        getStatus(Number(item?.stockCurrent || 0), Number(item?.stockMin || 0)),
      ),
    ).length;
  }, [products]);

  const totalProductsCount = products.length;

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return products.filter((item) => {
      const sku = String(item?.sku || "").toLowerCase();
      const name = String(item?.name || "").toLowerCase();
      const category = String(item?.category || "");
      const subcategory = String(item?.subcategory || "");

      const matchesSearch =
        sku.includes(search) ||
        name.includes(search) ||
        category.toLowerCase().includes(search) ||
        subcategory.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "all" || category === selectedCategory;

      const matchesSubcategory =
        selectedSubcategory === "all" || subcategory === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, searchTerm, selectedCategory, selectedSubcategory]);

  const addProduct = (data) => {
    const newItem = {
      sku: String(data?.sku || "").trim(),
      name: String(data?.name || "").trim(),
      category: String(data?.category || "").trim(),
      subcategory: String(data?.subcategory || "").trim(),
      stockCurrent: Number(data?.stock || 0),
      stockMin: Number(data?.minStock || 0),
      price: Number(data?.price || 0),
      supplier: String(data?.supplier || "").trim(),
      cost: Number(data?.cost || 0),
      status: data?.status || "Normal",
      desc: String(data?.desc || "").trim(),
      image: data?.image ? data.image.name : "",
      createdAt: Date.now(),
    };

    if (!newItem.sku || !newItem.name) return;

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
    const nonEditableFields = [
      "category",
      "subcategory",
      "stockCurrent",
      "stockMin",
      "price",
    ];

    if (nonEditableFields.includes(field)) return;

    setEditing({
      sku,
      field,
      value: String(currentValue ?? ""),
    });
  };

  const stopEdit = () => setEditing(null);

  const setEditValue = (value) => {
    setEditing((prev) => ({
      ...prev,
      value,
    }));
  };

  const commitEdit = () => {
    if (!editing) return;

    const { sku, field, value } = editing;

    let normalizedValue = value;

    if (
      field === "price" ||
      field === "stockCurrent" ||
      field === "stockMin" ||
      field === "cost"
    ) {
      normalizedValue = Number(value || 0);
    }

    if (
      field === "sku" ||
      field === "name" ||
      field === "category" ||
      field === "subcategory" ||
      field === "supplier" ||
      field === "desc"
    ) {
      normalizedValue = String(value || "").trim();
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
    editing,
    startEdit,
    setEditValue,
    commitEdit,
    onEditKeyDown,
    className = "",
  }) => {
    const active = editing && editing.sku === sku && editing.field === field;

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
              <div className="Stats-Title">Məhsul Növləri</div>
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
            placeholder="SKU, məhsul adı, kateqoriya ilə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("all");
            }}
          >
            <option value="all">Bütün kateqoriyalar</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            disabled={selectedCategory === "all"}
          >
            <option value="all">Bütün alt kateqoriyalar</option>
            {visibleSubcategories.map((sub) => (
              <option key={sub.id} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="Anbar-Objects-Saves">
          <div className="row header">
            <div className="row-Title">SKU</div>
            <div className="row-Title">MƏHSUL ADI</div>
            <div className="row-Title">KATEQORİYA</div>
            <div className="row-Title">ALT KATEQORİYA</div>
            <div className="row-Title">STOK</div>
            <div className="row-Title">QIYMƏT</div>
            <div className="row-Title">STATUS</div>
            <div className="row-Title">DƏYƏR</div>
          </div>

          {filteredProducts.length > 0 ? (
            filteredProducts.map((item) => {
              const total =
                Number(item?.stockCurrent || 0) * Number(item?.price || 0);

              const status = getStatus(
                Number(item?.stockCurrent || 0),
                Number(item?.stockMin || 0),
              );

              const isDeleting = deletingSku === item?.sku;

              return (
                <div
                  className={`row body ${isDeleting ? "is-deleting" : ""}`}
                  key={item?.sku}
                >
                  <EditableCell
                    sku={item?.sku}
                    field="sku"
                    value={item?.sku}
                    editing={editing}
                    startEdit={startEdit}
                    setEditValue={setEditValue}
                    commitEdit={commitEdit}
                    onEditKeyDown={onEditKeyDown}
                    className="cell sku"
                  />

                  <EditableCell
                    sku={item?.sku}
                    field="name"
                    value={item?.name}
                    editing={editing}
                    startEdit={startEdit}
                    setEditValue={setEditValue}
                    commitEdit={commitEdit}
                    onEditKeyDown={onEditKeyDown}
                    className="cell name"
                  />

                  <div className="cell category">{item?.category}</div>
                  <div className="cell category">
                    {item?.subcategory || "—"}
                  </div>

                  <div className="cell stock">
                    <span
                      className={
                        Number(item?.stockCurrent) < Number(item?.stockMin)
                          ? "EC-Danger"
                          : ""
                      }
                    >
                      {item?.stockCurrent}
                    </span>
                    <span className="min"> / </span>
                    <span>{item?.stockMin}</span>
                  </div>

                  <div className="cell price">{item?.price}</div>

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
                    onClick={() => deleteProduct(item?.sku)}
                    aria-label="delete"
                    title="Sil"
                    disabled={isDeleting}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="Anbar-Empty">Məhsul tapılmadı</div>
          )}
        </div>

        <div className={`scanner-box ${flash ? "scan-success" : ""}`}>
          <div className="scanner-header">
            <div className="scanner-title">📷 Scanner</div>
            <div className="scanner-status">Active</div>
          </div>

          <div className="scanner-content">
            <CameraScanner onScan={handleScan} />
          </div>

          {lastScanned && (
            <div className="scanner-result">
              Son kod: <b>{lastScanned}</b>
            </div>
          )}

          <button className="scanner-btn">Kamera icazə ver</button>
        </div>
      </div>

      <NewProductModal
        open={openNewProduct}
        onClose={() => setOpenNewProduct(false)}
        onSubmit={addProduct}
        categories={categories}
        onAddCategory={(name) => {
          dispatch({
            type: "ADD_CATEGORY",
            payload: { name },
          });
        }}
        onAddSubcategory={(categoryId, name) => {
          dispatch({
            type: "ADD_SUBCATEGORY",
            payload: { categoryId, name },
          });
        }}
      />
    </div>
  );
};
