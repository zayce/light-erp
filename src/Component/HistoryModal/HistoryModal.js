import { useMemo } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { formatMoney } from "../../utils/format";
import { productHistory } from "../../utils/history";
import "../EditProductModal/EditProductModal.scss";
import "./HistoryModal.scss";

export const HistoryModal = ({ open, product, state, onClose }) => {
  useEscapeKey(open, onClose);

  const history = useMemo(
    () => productHistory(state, product),
    [state, product],
  );

  if (!open || !product) return null;

  return (
    <div className="EP-Overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="EP-Modal HM-Modal">
        <div className="EP-Head">
          <h2>{product.name}: hərəkət tarixçəsi</h2>
          <button type="button" className="EP-Close" onClick={onClose} aria-label="Bağla">
            ×
          </button>
        </div>

        <div className="HM-Summary">
          <div>
            <span>Cari stok</span>
            <strong>{product.stockCurrent}</strong>
          </div>
          <div>
            <span>Cəmi alınıb</span>
            <strong className="plus">+{history.bought}</strong>
          </div>
          <div>
            <span>Cəmi satılıb</span>
            <strong className="minus">-{history.sold}</strong>
          </div>
        </div>

        {history.entries.length === 0 ? (
          <div className="HM-Empty">Bu məhsul üçün alış və ya satış qeydi yoxdur</div>
        ) : (
          <div className="HM-List">
            {history.entries.map((e) => (
              <div className="HM-Row" key={e.id}>
                <div className="date">{e.date}</div>
                <div className="type">
                  {e.type === "purchase" ? "Alış" : "Satış"}
                  {e.note && <small>{e.note}</small>}
                </div>
                <div className={`qty ${e.qty > 0 ? "plus" : "minus"}`}>
                  {e.qty > 0 ? `+${e.qty}` : e.qty}
                </div>
                <div className="amount">{formatMoney(e.amount)}</div>
              </div>
            ))}
          </div>
        )}

        <p className="EP-Hint">
          Yalnız alış və satışlar göstərilir. Əl ilə düzəlişlər, skan və inventarizasiya burada görünmür.
        </p>
      </div>
    </div>
  );
};
