// Single source of truth for stock status (used by Anbar, dashboard and sidebar).
export const getStockStatus = (current, min) => {
  const cur = Number(current || 0);
  const lim = Number(min || 0);
  if (cur <= lim * 0.3) return "kritik";
  if (cur < lim) return "asagi";
  if (cur > lim * 2) return "yuksek";
  return "normal";
};

export const STATUS_LABELS = {
  normal: "Normal",
  asagi: "Aşağı",
  kritik: "Kritik",
  yuksek: "Yüksək",
};

// 0..100 fill for a stock bar: full when stock reaches twice the minimum.
export const stockPercent = (current, min) => {
  const cur = Number(current || 0);
  const lim = Number(min || 0);
  if (lim <= 0) return cur > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((cur / (lim * 2)) * 100)));
};

export const isLowStatus = (status) => status === "asagi" || status === "kritik";

export const countLowStock = (anbar) =>
  (Array.isArray(anbar) ? anbar : []).filter((item) =>
    isLowStatus(getStockStatus(item?.stockCurrent, item?.stockMin)),
  ).length;

// What to buy next: low items, most urgent first. Target stock is twice the minimum,
// which is where the "normal" band ends.
export const reorderSuggestions = (anbar) =>
  (Array.isArray(anbar) ? anbar : [])
    .filter((item) =>
      isLowStatus(getStockStatus(item?.stockCurrent, item?.stockMin)),
    )
    .map((item) => {
      const current = Number(item.stockCurrent || 0);
      const min = Number(item.stockMin || 0);
      const qty = Math.max(1, Math.ceil(min * 2 - current));
      const cost = Number(item.cost || 0);
      return {
        sku: item.sku,
        name: item.name,
        supplier: item.supplier || "",
        current,
        min,
        qty,
        cost,
        estimate: Math.round(qty * cost * 100) / 100,
        percent: stockPercent(current, min),
      };
    })
    .sort((a, b) => a.percent - b.percent);
