import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "../EditProductModal/EditProductModal.scss";
import "./InventoryCountModal.scss";

export const InventoryCountModal = ({ open, products = [], onClose, onApply }) => {
  const [counts, setCounts] = useState({}); // sku -> string typed by the user
  const [search, setSearch] = useState("");

  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) {
      setCounts({});
      setSearch("");
    }
  }, [open]);

  const changes = useMemo(
    () =>
      products
        .map((p) => {
          const raw = counts[p.sku];
          if (raw === undefined || raw === "") return null;
          const counted = Number(raw);
          if (!Number.isFinite(counted) || counted < 0) return null;
          const diff = counted - Number(p.stockCurrent || 0);
          return diff === 0 ? null : { sku: p.sku, name: p.name, counted, diff };
        })
        .filter(Boolean),
    [products, counts],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.category].some((v) => String(v || "").toLowerCase().includes(q)),
    );
  }, [products, search]);

  if (!open) return null;

  const apply = () => {
    if (changes.length === 0) {
      toast.error("Fərq tapılmadı");
      return;
    }
    onApply(changes.map(({ sku, counted }) => ({ sku, counted })), changes.length);
  };

  return (
    <div className="EP-Overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="EP-Modal IC-Modal">
        <div className="EP-Head">
          <h2>İnventarizasiya</h2>
          <button type="button" className="EP-Close" onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        <p className="EP-Hint" style={{ marginTop: 0 }}>
          Faktiki sayı yazın. Boş buraxılan məhsullara toxunulmur. Yalnız fərqli olanlar dəyişdiriləcək.
        </p>

        <input
          className="IC-Search"
          placeholder="Məhsul axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="IC-Table">
          <div className="IC-Row head">
            <div>Məhsul</div>
            <div>Sistemdə</div>
            <div>Faktiki</div>
            <div>Fərq</div>
          </div>

          {visible.map((p) => {
            const raw = counts[p.sku] ?? "";
            const counted = Number(raw);
            const diff =
              raw !== "" && Number.isFinite(counted) ? counted - Number(p.stockCurrent || 0) : null;

            return (
              <div className="IC-Row" key={p.sku}>
                <div className="name">
                  {p.name}
                  <small>{p.sku}</small>
                </div>
                <div>{p.stockCurrent}</div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={raw}
                    onChange={(e) => setCounts((prev) => ({ ...prev, [p.sku]: e.target.value }))}
                    aria-label={`${p.name} faktiki say`}
                  />
                </div>
                <div className={diff === null || diff === 0 ? "" : diff > 0 ? "plus" : "minus"}>
                  {diff === null ? "-" : diff > 0 ? `+${diff}` : diff}
                </div>
              </div>
            );
          })}

          {visible.length === 0 && <div className="IC-Empty">Məhsul tapılmadı</div>}
        </div>

        <div className="EP-Actions">
          <span className="IC-Summary">{changes.length} fərq</span>
          <button type="button" className="EP-Cancel" onClick={onClose}>
            Ləğv et
          </button>
          <button type="button" className="EP-Save" onClick={apply} disabled={changes.length === 0}>
            Tətbiq et
          </button>
        </div>
      </div>
    </div>
  );
};
