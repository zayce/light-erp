import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { printLabels } from "../../utils/labels";
import "../EditProductModal/EditProductModal.scss";
import "../InventoryCountModal/InventoryCountModal.scss";

export const LabelsModal = ({ open, products = [], onClose }) => {
  const [selected, setSelected] = useState({});
  const [copies, setCopies] = useState(1);
  const [busy, setBusy] = useState(false);

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) {
      setSelected({});
      setCopies(1);
    }
  }, [open]);

  const chosen = useMemo(
    () => products.filter((p) => selected[p.sku]),
    [products, selected],
  );

  if (!open) return null;

  const allSelected = products.length > 0 && chosen.length === products.length;

  const toggleAll = () =>
    setSelected(allSelected ? {} : Object.fromEntries(products.map((p) => [p.sku, true])));

  const print = async () => {
    if (chosen.length === 0) {
      toast.error("Ən azı bir məhsul seçin");
      return;
    }
    const n = Math.min(20, Math.max(1, Math.floor(Number(copies) || 1)));

    try {
      setBusy(true);
      await printLabels(
        chosen.map((p) => ({ sku: p.sku, name: p.name, price: p.price })),
        n,
      );
    } catch (err) {
      toast.error(err.message || "Etiketlər hazırlanmadı");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="EP-Overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="EP-Modal IC-Modal">
        <div className="EP-Head">
          <h2>QR etiketləri</h2>
          <button type="button" className="EP-Close" onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        <p className="EP-Hint" style={{ marginTop: 0 }}>
          Hər etiketdə məhsulun SKU kodu QR kimi olur, ona görə Anbar bölməsindəki skaner onu tanıyır.
        </p>

        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Hamısını seç ({products.length})
        </label>

        <div className="IC-Table">
          {products.map((p) => (
            <label className="IC-Row" key={p.sku} style={{ gridTemplateColumns: "28px 1fr 90px" }}>
              <input
                type="checkbox"
                checked={Boolean(selected[p.sku])}
                onChange={(e) => setSelected((prev) => ({ ...prev, [p.sku]: e.target.checked }))}
              />
              <div className="name">
                {p.name}
                <small>{p.sku}</small>
              </div>
              <div>{p.price}</div>
            </label>
          ))}
          {products.length === 0 && <div className="IC-Empty">Məhsul yoxdur</div>}
        </div>

        <div className="EP-Actions">
          <label className="IC-Summary" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Hər məhsuldan
            <input
              type="number"
              min="1"
              max="20"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              style={{ width: 60, padding: 6, borderRadius: 8, border: "1px solid #cbd5e1" }}
            />
            ədəd
          </label>
          <button type="button" className="EP-Cancel" onClick={onClose}>
            Bağla
          </button>
          <button type="button" className="EP-Save" onClick={print} disabled={busy || chosen.length === 0}>
            {busy ? "Hazırlanır..." : `Çap et (${chosen.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
