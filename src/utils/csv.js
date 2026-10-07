// ";" is the default delimiter because Excel in az/ru locales splits on it.
const needsQuotes = /[";\r\n]/;

const escapeCell = (value, delimiter) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  let text = String(value);
  // Neutralise spreadsheet formulas coming from user-entered text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (needsQuotes.test(text) || text.includes(delimiter)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const toCsv = (rows, columns, delimiter = ";") => {
  const header = columns
    .map((col) => escapeCell(col.label, delimiter))
    .join(delimiter);
  const body = rows.map((row) =>
    columns
      .map((col) => escapeCell(col.value(row), delimiter))
      .join(delimiter),
  );
  return [header, ...body].join("\r\n");
};

export const downloadCsv = (filename, csv) => {
  // BOM so Excel opens the file as UTF-8 (ə, ı, ş ...).
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// Generic download used by the JSON backup.
export const downloadFile = (filename, content, type = "text/plain") => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
