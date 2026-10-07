import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { formatMoney } from "../../utils/format";
import "../EditProductModal/EditProductModal.scss";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  sku: "",
  qty: "",
  unitCost: "",
  supplier: "",
  date: today(),
  note: "",
});

export const PurchaseModal = ({
  open,
  products = [],
  initial = null, // optional { sku, qty } to pre-fill (reorder suggestions)
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (!open) return;

    const base = emptyForm();
    const p = initial?.sku ? products.find((item) => item.sku === initial.sku) : null;
    if (p) {
      base.sku = p.sku;
      base.qty = initial.qty ? String(initial.qty) : "";
      base.unitCost = Number(p.cost) > 0 ? String(p.cost) : "";
      base.supplier = p.supplier || "";
    }
    setForm(base);
    setErrors({});
    // products is intentionally left out: the form must not reset while typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const product = useMemo(
    () => products.find((p) => p.sku === form.sku),
    [products, form.sku],
  );

  if (!open) return null;

  const change = (key) => (e) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // choosing a product pre-fills the last known cost and supplier
  const pickProduct = (e) => {
    const sku = e.target.value;
    const p = products.find((item) => item.sku === sku);
    setErrors((prev) => ({ ...prev, sku: "" }));
    setForm((prev) => ({
      ...prev,
      sku,
      unitCost: p && Number(p.cost) > 0 ? String(p.cost) : prev.unitCost,
      supplier: p?.supplier || prev.supplier,
    }));
  };

  const qty = Number(form.qty);
  const unitCost = Number(form.unitCost);
  const total =
    qty > 0 && Number.isFinite(unitCost) && unitCost >= 0
      ? Math.round(qty * unitCost * 100) / 100
      : 0;

  const submit = (e) => {
    e.preventDefault();
    const found = {};

    if (!product) found.sku = "Məhsul seçin";
    if (!(qty > 0)) found.qty = "Say 0-dan böyük olmalıdır";
    if (form.unitCost === "" || !(unitCost >= 0)) {
      found.unitCost = "Vahid qiymət 0 və ya daha böyük olmalıdır";
    }
    if (!form.date) found.date = "Tarix seçin";

    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Sahələri yoxlayın");
      return;
    }

    onSubmit({
      sku: product.sku,
      name: product.name,
      qty,
      unitCost,
      supplier: form.supplier.trim(),
      date: form.date,
      note: form.note.trim(),
    });
  };

  return (
    <div className="EP-Overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="EP-Modal" onSubmit={submit} noValidate>
        <div className="EP-Head">
          <h2>Yeni alış (mal qəbulu)</h2>
          <button type="button" className="EP-Close" onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        {products.length === 0 ? (
          <p className="EP-Hint">Əvvəlcə Anbar bölməsinə məhsul əlavə edin.</p>
        ) : (
          <>
            <div className="EP-Grid">
              <label className={`EP-Field ${errors.sku ? "has-error" : ""}`} style={{ gridColumn: "1 / -1" }}>
                <span>Məhsul</span>
                <select value={form.sku} onChange={pickProduct} autoFocus>
                  <option value="">Seçin...</option>
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} ({p.sku}), stok: {p.stockCurrent}
                    </option>
                  ))}
                </select>
                {errors.sku && <em>{errors.sku}</em>}
              </label>

              <label className={`EP-Field ${errors.qty ? "has-error" : ""}`}>
                <span>Say</span>
                <input type="number" min="0" step="1" value={form.qty} onChange={change("qty")} />
                {errors.qty && <em>{errors.qty}</em>}
              </label>

              <label className={`EP-Field ${errors.unitCost ? "has-error" : ""}`}>
                <span>Vahid alış qiyməti</span>
                <input type="number" min="0" step="0.01" value={form.unitCost} onChange={change("unitCost")} />
                {errors.unitCost && <em>{errors.unitCost}</em>}
              </label>

              <label className="EP-Field">
                <span>Təchizatçı</span>
                <input value={form.supplier} onChange={change("supplier")} />
              </label>

              <label className={`EP-Field ${errors.date ? "has-error" : ""}`}>
                <span>Tarix</span>
                <input type="date" value={form.date} onChange={change("date")} />
                {errors.date && <em>{errors.date}</em>}
              </label>
            </div>

            <label className="EP-Field">
              <span>Qeyd</span>
              <textarea rows={2} value={form.note} onChange={change("note")} />
            </label>

            <p className="EP-Hint">
              Cəmi: <strong>{formatMoney(total)}</strong>. Stok artacaq, məbləğ Pul Axınına xərc kimi yazılacaq,
              maya dəyəri isə orta çəkili hesablanacaq.
            </p>
          </>
        )}

        <div className="EP-Actions">
          <button type="button" className="EP-Cancel" onClick={onClose}>
            Ləğv et
          </button>
          {products.length > 0 && (
            <button type="submit" className="EP-Save">
              Alışı qeyd et
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
