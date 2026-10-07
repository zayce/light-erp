import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useApp } from "../../AppContext";
import { PurchaseModal } from "../../Component/PurchaseModal/PurchaseModal";
import { formatMoney } from "../../utils/format";
import { exportPurchases, exportReorderList } from "../../utils/exports";
import { reorderSuggestions } from "../../utils/stock";
import "./Purchases.scss";

export const Purchases = () => {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [search, setSearch] = useState("");

  const purchases = state.purchases;

  const stats = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const sum = (list) => list.reduce((acc, p) => acc + Number(p.total || 0), 0);
    return {
      month: sum(purchases.filter((p) => String(p.date).startsWith(monthKey))),
      total: sum(purchases),
      count: purchases.length,
    };
  }, [purchases]);

  const suggestions = useMemo(() => reorderSuggestions(state.anbar), [state.anbar]);
  const suggestionsTotal = suggestions.reduce((sum, i) => sum + i.estimate, 0);

  const openModal = (initial = null) => {
    setPrefill(initial);
    setOpen(true);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...purchases].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!q) return list;
    return list.filter((p) =>
      [p.name, p.sku, p.supplier, p.note].some((v) => String(v || "").toLowerCase().includes(q)),
    );
  }, [purchases, search]);

  const addPurchase = (data) => {
    dispatch({ type: "ADD_PURCHASE", payload: data });
    setOpen(false);
    toast.success(`${data.name}: stok +${data.qty}`);
  };

  const removePurchase = (p) => {
    const ok = window.confirm(
      `“${p.name}” alışı silinsin?\n\nStokdan ${p.qty} ədəd çıxılacaq və əlaqəli xərc silinəcək.`,
    );
    if (!ok) return;
    dispatch({ type: "DELETE_PURCHASE", payload: { id: p.id } });
    toast.success("Alış silindi");
  };

  return (
    <div className="Purchases-Wrapper">
      <div className="Purchases-Inner">
        <div className="Purchases-Header">
          <div>
            <div className="Purchases-Title">Alışlar</div>
            <div className="Purchases-Desc">Mal qəbulu, maya dəyəri və təchizatçılar</div>
          </div>
          <div className="Purchases-Actions">
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (!exportPurchases(purchases)) toast.error("İxrac üçün alış yoxdur");
              }}
            >
              ⬇ CSV ixrac
            </button>
            <button type="button" onClick={() => openModal()}>
              + Yeni alış
            </button>
          </div>
        </div>

        <div className="Purchases-Stats">
          <div className="Purchases-Stat">
            <span>Bu ay alınıb</span>
            <strong>{formatMoney(stats.month)}</strong>
          </div>
          <div className="Purchases-Stat">
            <span>Cəmi alınıb</span>
            <strong>{formatMoney(stats.total)}</strong>
          </div>
          <div className="Purchases-Stat">
            <span>Alış sayı</span>
            <strong>{stats.count}</strong>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="Purchases-Reorder">
            <div className="Reorder-Head">
              <div>
                <strong>Sifariş təklifləri</strong>
                <span>
                  {suggestions.length} məhsulun stoku azdır
                  {suggestionsTotal > 0 && ` · təxmini ${formatMoney(suggestionsTotal)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!exportReorderList(suggestions)) toast.error("Siyahı boşdur");
                }}
              >
                ⬇ Siyahını CSV
              </button>
            </div>

            {suggestions.slice(0, 6).map((item) => (
              <div className="Reorder-Row" key={item.sku}>
                <div className="name">
                  {item.name}
                  <small>
                    stok {item.current} / min {item.min}
                    {item.supplier ? ` · ${item.supplier}` : ""}
                  </small>
                </div>
                <div className="qty">+{item.qty}</div>
                <button
                  type="button"
                  onClick={() => openModal({ sku: item.sku, qty: item.qty })}
                >
                  Alış əlavə et
                </button>
              </div>
            ))}
            {suggestions.length > 6 && (
              <div className="Reorder-More">və daha {suggestions.length - 6} məhsul (CSV-də hamısı var)</div>
            )}
          </div>
        )}

        <input
          className="Purchases-Search"
          placeholder="Məhsul, SKU, təchizatçı axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="Purchases-Table">
          <div className="Purchases-Row head">
            <div>Tarix</div>
            <div>Məhsul</div>
            <div>Təchizatçı</div>
            <div>Say</div>
            <div>Vahid qiymət</div>
            <div>Cəmi</div>
            <div />
          </div>

          {visible.length === 0 ? (
            <div className="Purchases-Empty">
              <div className="icon">🛒</div>
              <div>{purchases.length ? "Axtarışa uyğun alış yoxdur" : "Hələ alış qeydi yoxdur"}</div>
              {purchases.length === 0 && (
                <button type="button" onClick={() => openModal()}>
                  + İlk alışı əlavə et
                </button>
              )}
            </div>
          ) : (
            visible.map((p) => (
              <div className="Purchases-Row" key={p.id}>
                <div>{p.date}</div>
                <div className="name">
                  {p.name}
                  <small>{p.sku}</small>
                </div>
                <div>{p.supplier || "-"}</div>
                <div>{p.qty}</div>
                <div>{formatMoney(p.unitCost)}</div>
                <div className="total">{formatMoney(p.total)}</div>
                <div>
                  <button
                    type="button"
                    className="del"
                    onClick={() => removePurchase(p)}
                    aria-label="Sil"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PurchaseModal
        open={open}
        products={state.anbar}
        initial={prefill}
        onClose={() => setOpen(false)}
        onSubmit={addPurchase}
      />
    </div>
  );
};
