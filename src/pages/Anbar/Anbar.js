import { useMemo, useState, useEffect, useRef } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { NewProductModal } from "../../Component/NewProductModal/NewProductModal";
import { EditProductModal } from "../../Component/EditProductModal/EditProductModal";
import { InventoryCountModal } from "../../Component/InventoryCountModal/InventoryCountModal";
import { useApp } from "../../AppContext";
import "./Anbar.scss";
import { CameraScanner } from "../../Component/CameraScaner/CameraScaner";
import toast from "react-hot-toast";
import { formatMoney } from "../../utils/format";
import {
  getStockStatus,
  stockPercent,
  isLowStatus,
  STATUS_LABELS,
} from "../../utils/stock";
import { toCsv, downloadCsv } from "../../utils/csv";

const sameText = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const PAGE_SIZE = 30;

const SORT_OPTIONS = [
  { value: "default", label: "Sıralama: standart" },
  { value: "name", label: "Ada görə (A-Z)" },
  { value: "stock", label: "Stok (azdan çoxa)" },
  { value: "price", label: "Qiymət (bahadan ucuza)" },
  { value: "value", label: "Ümumi dəyər (çoxdan aza)" },
];

// Defined at module level: when it lived inside Anbar it was re-created on every
// render, so the input was remounted (and lost focus) on each keystroke.
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

export const Anbar = () => {
  const { state, dispatch } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [deletingSku, setDeletingSku] = useState(null);
  const [editing, setEditing] = useState(null);
  const [onlyLow, setOnlyLow] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [openCount, setOpenCount] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState("default");
  const searchRef = useRef(null);
  // true once an edit was committed/cancelled, so the blur fired by unmounting
  // the input cannot commit a second time (or commit a cancelled edit).
  const editFinishedRef = useRef(true);

  // Scaner Function
  const [lastScanned, setLastScanned] = useState(null);

  const [flash, setFlash] = useState(false);
  const handleScan = (code) => {
    const normalized = String(code || "").trim().toLowerCase();
    const scanned = (state.anbar || []).find((item) =>
      [item.sku, item.barcode, item.name].some(
        (value) => String(value || "").toLowerCase() === normalized,
      ),
    );

    if (scanned) {
      toast.success(`${scanned.name}: stok +1`);
    } else {
      toast.error(`Məhsul tapılmadı: ${code}`);
    }

    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 300);
    setLastScanned(code);

    dispatch({
      type: "SCAN_PRODUCT",
      payload: code,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      const tag = target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (target?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, item) => {
      return sum + Number(item?.stockCurrent || 0) * Number(item?.price || 0);
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((item) =>
      ["asagi", "kritik"].includes(
        getStockStatus(Number(item?.stockCurrent || 0), Number(item?.stockMin || 0)),
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

      const matchesLow =
        !onlyLow ||
        isLowStatus(getStockStatus(item?.stockCurrent, item?.stockMin));

      return (
        matchesSearch && matchesCategory && matchesSubcategory && matchesLow
      );
    });
  }, [products, searchTerm, selectedCategory, selectedSubcategory, onlyLow]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const num = (v) => Number(v || 0);

    switch (sortBy) {
      case "name":
        return list.sort((a, b) =>
          String(a.name).localeCompare(String(b.name), "az"),
        );
      case "stock":
        return list.sort((a, b) => num(a.stockCurrent) - num(b.stockCurrent));
      case "price":
        return list.sort((a, b) => num(b.price) - num(a.price));
      case "value":
        return list.sort(
          (a, b) =>
            num(b.stockCurrent) * num(b.price) -
            num(a.stockCurrent) * num(a.price),
        );
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  // a new search/filter/sort starts again from the first page
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedCategory, selectedSubcategory, onlyLow, sortBy]);

  const pagedProducts = sortedProducts.slice(0, visibleCount);
  const hiddenCount = sortedProducts.length - pagedProducts.length;

  const applyStockCount = (counts, changed) => {
    dispatch({ type: "STOCK_COUNT", payload: counts });
    setOpenCount(false);
    toast.success(`İnventarizasiya tətbiq olundu: ${changed} məhsul`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setOnlyLow(false);
    setSortBy("default");
  };

  const exportCsv = () => {
    if (!sortedProducts.length) {
      toast.error("İxrac üçün məhsul yoxdur");
      return;
    }

    const csv = toCsv(sortedProducts, [
      { label: "SKU", value: (p) => p.sku },
      { label: "Məhsul adı", value: (p) => p.name },
      { label: "Kateqoriya", value: (p) => p.category },
      { label: "Alt kateqoriya", value: (p) => p.subcategory },
      { label: "Stok", value: (p) => Number(p.stockCurrent || 0) },
      { label: "Min. stok", value: (p) => Number(p.stockMin || 0) },
      { label: "Qiymət", value: (p) => Number(p.price || 0) },
      {
        label: "Dəyər",
        value: (p) => Number(p.stockCurrent || 0) * Number(p.price || 0),
      },
      { label: "Təchizatçı", value: (p) => p.supplier },
    ]);

    downloadCsv(`anbar-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

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

    const duplicate = products.find(
      (p) => sameText(p.sku, newItem.sku) || sameText(p.name, newItem.name),
    );
    if (duplicate) {
      toast.error(
        sameText(duplicate.sku, newItem.sku)
          ? "Bu SKU artıq mövcuddur"
          : "Bu adlı məhsul artıq mövcuddur",
      );
      return;
    }

    dispatch({
      type: "ADD_ANBAR_ITEM",
      payload: newItem,
    });

    setOpenNewProduct(false);
  };

  const saveEditedProduct = (originalSku, data) => {
    dispatch({
      type: "UPDATE_ANBAR_ITEM",
      payload: { sku: originalSku, data },
    });
    setEditingProduct(null);
    toast.success("Məhsul yeniləndi");
  };

  const restoreProduct = (item) => {
    dispatch({ type: "ADD_ANBAR_ITEM", payload: item });
  };

  const deleteProduct = (sku) => {
    const item = products.find((p) => p.sku === sku);
    setDeletingSku(sku);

    setTimeout(() => {
      dispatch({
        type: "DELETE_ANBAR_ITEM",
        payload: { sku },
      });

      setDeletingSku(null);

      if (item) {
        toast(
          (t) => (
            <span>
              {item.name} silindi{" "}
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  restoreProduct(item);
                }}
              >
                Geri qaytar
              </button>
            </span>
          ),
          { duration: 6000 },
        );
      }
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

    editFinishedRef.current = false;
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
    if (!editing || editFinishedRef.current) return;

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

    const current = products.find((p) => p.sku === sku);

    // nothing changed -> no dispatch and no server request
    if (current && String(current[field] ?? "") === String(normalizedValue)) {
      editFinishedRef.current = true;
      stopEdit();
      return;
    }

    if (field === "sku" || field === "name") {
      if (!normalizedValue) {
        toast.error("Bu sahə boş ola bilməz");
        editFinishedRef.current = true;
        stopEdit();
        return;
      }

      const clash = products.some(
        (p) => p.sku !== sku && sameText(p[field], normalizedValue),
      );
      if (clash) {
        toast.error(
          field === "sku"
            ? "Bu SKU artıq mövcuddur"
            : "Bu adlı məhsul artıq mövcuddur",
        );
        editFinishedRef.current = true;
        stopEdit();
        return;
      }
    }

    editFinishedRef.current = true;

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

  const cancelEdit = () => {
    editFinishedRef.current = true;
    stopEdit();
  };

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
              className="button-opis secondary"
              onClick={() => setOpenCount(true)}
              type="button"
            >
              <div className="button-text">📋 İnventarizasiya</div>
            </button>
            <button
              className="button-opis secondary"
              onClick={exportCsv}
              type="button"
            >
              <div className="button-text">⬇ CSV ixrac</div>
            </button>
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

          <div
            className={`Stats-Card clickable ${onlyLow ? "active" : ""}`}
            onClick={() => setOnlyLow((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOnlyLow((v) => !v);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={onlyLow}
            title="Yalnız aşağı stoku göstər"
          >
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
                {formatMoney(totalStockValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="Anbar-Filters">
          <input
            type="text"
            ref={searchRef}
            placeholder="SKU, məhsul adı, kateqoriya ilə axtar...  ( / )"
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

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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

          {sortedProducts.length > 0 ? (
            pagedProducts.map((item) => {
              const total =
                Number(item?.stockCurrent || 0) * Number(item?.price || 0);

              const status = getStockStatus(
                Number(item?.stockCurrent || 0),
                Number(item?.stockMin || 0),
              );

              const isDeleting = deletingSku === item?.sku;

              return (
                <div
                  className={`row body ${isDeleting ? "is-deleting" : ""} ${status === "kritik" ? "is-critical" : ""}`}
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
                    <div className="stock-bar">
                      <span
                        className={status}
                        style={{
                          width: `${stockPercent(item?.stockCurrent, item?.stockMin)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="cell price">{item?.price}</div>

                  <div className="cell">
                    <span className={`status ${status}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  <div className="cell total">{formatMoney(total)}</div>

                  <button
                    type="button"
                    className="row-edit"
                    onClick={() => setEditingProduct(item)}
                    aria-label="edit"
                    title="Redaktə et"
                    disabled={isDeleting}
                  >
                    <Pencil size={18} />
                  </button>

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
            <div className="Anbar-Empty">
              <div className="Anbar-Empty-icon">📦</div>
              <div className="Anbar-Empty-title">Məhsul tapılmadı</div>
              <div className="Anbar-Empty-hint">
                {products.length === 0
                  ? "Anbar boşdur. İlk məhsulu əlavə edin."
                  : "Axtarış və ya filtrlərə uyğun məhsul yoxdur."}
              </div>
              {products.length === 0 ? (
                <button
                  type="button"
                  className="Anbar-Empty-btn"
                  onClick={() => setOpenNewProduct(true)}
                >
                  + Yeni Məhsul
                </button>
              ) : (
                <button
                  type="button"
                  className="Anbar-Empty-btn"
                  onClick={resetFilters}
                >
                  Filtrləri sıfırla
                </button>
              )}
            </div>
          )}
        </div>

        {hiddenCount > 0 && (
          <button
            type="button"
            className="Anbar-LoadMore"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Daha çox göstər ({hiddenCount} qalıb)
          </button>
        )}

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

      <InventoryCountModal
        open={openCount}
        products={products}
        onClose={() => setOpenCount(false)}
        onApply={applyStockCount}
      />

      <EditProductModal
        open={Boolean(editingProduct)}
        product={editingProduct}
        products={products}
        categories={state.categories}
        onClose={() => setEditingProduct(null)}
        onSave={saveEditedProduct}
      />

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
