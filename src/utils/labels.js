import { formatMoney } from "./format";

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

const SAFE_IMAGE = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

// Builds the printable page. Product names come from users, so everything is escaped,
// and only a PNG data URL is accepted as an image source.
export const buildLabelsHtml = (labels) => {
  const cells = labels
    .map((l) => {
      const img = SAFE_IMAGE.test(l.qr || "") ? `<img src="${l.qr}" alt="">` : "";
      return `<div class="label">${img}<div class="name">${escapeHtml(l.name)}</div><div class="sku">${escapeHtml(l.sku)}</div><div class="price">${escapeHtml(formatMoney(l.price))}</div></div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Etiketlər</title><style>
    body { font-family: Arial, sans-serif; margin: 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .label { border: 1px dashed #999; padding: 8px; text-align: center; break-inside: avoid; }
    .label img { width: 110px; height: 110px; }
    .name { font-weight: 700; font-size: 14px; }
    .sku { font-size: 12px; color: #444; }
    .price { font-size: 16px; font-weight: 700; margin-top: 2px; }
    @media print { body { margin: 0; } }
  </style></head><body><div class="grid">${cells}</div></body></html>`;
};

// items: [{ sku, name, price }], copies: how many labels per product
export const printLabels = async (items, copies = 1) => {
  // open synchronously (inside the click) so the pop-up blocker allows it
  const win = window.open("", "_blank");
  if (!win) throw new Error("Pop-up bloklanıb. Brauzerdə bu sayta icazə verin");

  try {
    const QRCode = (await import("qrcode")).default;
    const labels = [];
    for (const item of items) {
      const qr = await QRCode.toDataURL(String(item.sku), { margin: 1, width: 220 });
      for (let i = 0; i < copies; i += 1) labels.push({ ...item, qr });
    }

    win.document.open();
    win.document.write(buildLabelsHtml(labels));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  } catch (err) {
    win.close();
    throw err;
  }
};
