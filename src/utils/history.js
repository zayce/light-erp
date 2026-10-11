const same = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// Movement history of one product, rebuilt from purchases and sales.
// Manual stock edits, scans and stock counts are not recorded anywhere, so they are not shown.
export const productHistory = (state, product) => {
  if (!product) return { entries: [], bought: 0, sold: 0 };

  const entries = [];

  (state.purchases || []).forEach((p) => {
    if (!same(p.sku, product.sku)) return;
    entries.push({
      id: `p${p.id}`,
      type: "purchase",
      date: p.date,
      qty: Number(p.qty || 0),
      amount: Number(p.total || 0),
      note: p.supplier || "",
      sort: Number(p.id) || 0,
    });
  });

  (state.report || []).forEach((r) => {
    if (r.operationType === "Xərc") return;
    // old records have no sku and are matched by name
    const matches = r.sku ? same(r.sku, product.sku) : same(r.name, product.name);
    if (!matches) return;
    entries.push({
      id: `r${r.id}`,
      type: "sale",
      date: r.date,
      qty: -Number(r.salesCount || 0),
      amount: Number(r.revenue || 0),
      note: r.category || "",
      sort: Number(r.id) || 0,
    });
  });

  entries.sort((a, b) =>
    String(b.date).localeCompare(String(a.date)) || b.sort - a.sort,
  );

  return {
    entries,
    bought: entries.filter((e) => e.qty > 0).reduce((s, e) => s + e.qty, 0),
    sold: -entries.filter((e) => e.qty < 0).reduce((s, e) => s + e.qty, 0),
  };
};
