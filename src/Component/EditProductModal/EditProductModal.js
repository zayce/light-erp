import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./EditProductModal.scss";

const sameText = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const toForm = (p) => ({
  sku: p?.sku ?? "",
  name: p?.name ?? "",
  category: p?.category ?? "",
  subcategory: p?.subcategory ?? "",
  supplier: p?.supplier ?? "",
  price: String(p?.price ?? 0),
  cost: String(p?.cost ?? 0),
  stockCurrent: String(p?.stockCurrent ?? 0),
  stockMin: String(p?.stockMin ?? 0),
  desc: p?.desc ?? "",
});

const NUMBER_FIELDS = ["price", "cost", "stockCurrent", "stockMin"];

export const EditProductModal = ({
  open,
  product,
  products = [],
  categories = [],
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(toForm(product));
  const [errors, setErrors] = useState({});

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) {
      setForm(toForm(product));
      setErrors({});
    }
  }, [open, product]);

  const subcategories = useMemo(() => {
    const cat = categories.find((c) => c.name === form.category);
    return cat?.subcategories || [];
  }, [categories, form.category]);

  if (!open || !product) return null;

  const change = (key) => (e) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category") next.subcategory = "";
      return next;
    });
  };

  const validate = () => {
    const found = {};
    const sku = form.sku.trim();
    const name = form.name.trim();

    if (!sku) found.sku = "SKU boş ola bilməz";
    else if (products.some((p) => p.sku !== product.sku && sameText(p.sku, sku))) {
      found.sku = "Bu SKU artıq mövcuddur";
    }

    if (!name) found.name = "Ad boş ola bilməz";
    else if (products.some((p) => p.sku !== product.sku && sameText(p.name, name))) {
      found.name = "Bu adlı məhsul artıq mövcuddur";
    }

    NUMBER_FIELDS.forEach((key) => {
      const raw = String(form[key]).trim();
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n) || n < 0) {
        found[key] = "0 və ya daha böyük ədəd olmalıdır";
      }
    });

    return found;
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Sahələri yoxlayın");
      return;
    }

    onSave(product.sku, {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory,
      supplier: form.supplier.trim(),
      desc: form.desc.trim(),
      price: Number(form.price),
      cost: Number(form.cost),
      stockCurrent: Number(form.stockCurrent),
      stockMin: Number(form.stockMin),
    });
  };

  const field = (key, label, props = {}) => (
    <label className={`EP-Field ${errors[key] ? "has-error" : ""}`}>
      <span>{label}</span>
      <input value={form[key]} onChange={change(key)} {...props} />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  );

  return (
    <div className="EP-Overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="EP-Modal" onSubmit={submit} noValidate>
        <div className="EP-Head">
          <h2>Məhsulu redaktə et</h2>
          <button type="button" className="EP-Close" onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        <div className="EP-Grid">
          {field("name", "Məhsul adı", { autoFocus: true })}
          {field("sku", "SKU")}

          <label className="EP-Field">
            <span>Kateqoriya</span>
            <select value={form.category} onChange={change("category")}>
              <option value="">Seçilməyib</option>
              {categories.map((c) => (
                <option key={c.id ?? c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              {form.category && !categories.some((c) => c.name === form.category) && (
                <option value={form.category}>{form.category}</option>
              )}
            </select>
          </label>

          <label className="EP-Field">
            <span>Alt kateqoriya</span>
            <select value={form.subcategory} onChange={change("subcategory")}>
              <option value="">Seçilməyib</option>
              {subcategories.map((s) => (
                <option key={s.id ?? s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
              {form.subcategory && !subcategories.some((s) => s.name === form.subcategory) && (
                <option value={form.subcategory}>{form.subcategory}</option>
              )}
            </select>
          </label>

          {field("price", "Satış qiyməti", { type: "number", min: 0, step: "0.01" })}
          {field("cost", "Maya dəyəri", { type: "number", min: 0, step: "0.01" })}
          {field("stockCurrent", "Cari stok", { type: "number", min: 0, step: "1" })}
          {field("stockMin", "Minimum stok", { type: "number", min: 0, step: "1" })}
          {field("supplier", "Təchizatçı")}
        </div>

        <label className="EP-Field">
          <span>Təsvir</span>
          <textarea value={form.desc} onChange={change("desc")} rows={3} />
        </label>

        <p className="EP-Hint">
          Stoku burada düzəltmək inventarlaşdırma kimi işləyir. Mal qəbulu üçün “Alışlar” bölməsindən istifadə edin.
        </p>

        <div className="EP-Actions">
          <button type="button" className="EP-Cancel" onClick={onClose}>
            Ləğv et
          </button>
          <button type="submit" className="EP-Save">
            Yadda saxla
          </button>
        </div>
      </form>
    </div>
  );
};
