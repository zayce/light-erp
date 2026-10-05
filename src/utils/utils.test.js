import { createId } from "./id";
import { formatMoney, formatSignedMoney } from "./format";
import { toCsv } from "./csv";
import { readStorage, writeStorage } from "./storage";

test("createId is strictly increasing", () => {
  const ids = Array.from({ length: 1000 }, () => createId());
  for (let i = 1; i < ids.length; i += 1) {
    expect(ids[i]).toBeGreaterThan(ids[i - 1]);
  }
});

test("money formatting", () => {
  expect(formatMoney(1200)).toMatch(/^₼1\D?200$/);
  expect(formatSignedMoney("income", 5)).toBe("+₼5");
  expect(formatSignedMoney("expense", 5)).toBe("-₼5");
  expect(formatMoney(undefined)).toBe("₼0");
});

describe("toCsv", () => {
  const columns = [
    { label: "Ad", value: (r) => r.name },
    { label: "Say", value: (r) => r.qty },
  ];

  test("quotes delimiters, quotes and new lines", () => {
    const csv = toCsv([{ name: 'a;b "c"\nd', qty: 2 }], columns);
    expect(csv).toBe('Ad;Say\r\n"a;b ""c""\nd";2');
  });

  test("neutralises spreadsheet formulas but leaves numbers alone", () => {
    const csv = toCsv([{ name: "=SUM(A1)", qty: -3 }], columns);
    expect(csv.split("\r\n")[1]).toBe("'=SUM(A1);-3");
  });

  test("empty values become empty cells", () => {
    expect(
      toCsv([{ name: null, qty: undefined }], columns).split("\r\n")[1],
    ).toBe(";");
  });
});

describe("storage helpers", () => {
  test("never throw when localStorage fails", () => {
    const get = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    const set = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(readStorage("k")).toBeNull();
    expect(writeStorage("k", "v")).toBe(false);

    get.mockRestore();
    set.mockRestore();
    warn.mockRestore();
  });
});
