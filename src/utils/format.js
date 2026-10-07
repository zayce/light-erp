const SYMBOLS = { AZN: "₼", USD: "$", EUR: "€", TRY: "₺" };
const LOCALE = "az-AZ";

let currentCode = "AZN";

// Only the symbol changes: amounts are NOT converted between currencies.
export const setCurrency = (code) => {
  if (SYMBOLS[code]) currentCode = code;
};

export const currencySymbol = () => SYMBOLS[currentCode];

export const formatMoney = (value) =>
  `${currencySymbol()}${Number(value || 0).toLocaleString(LOCALE)}`;

export const formatSignedMoney = (type, value) =>
  `${type === "income" ? "+" : "-"}${formatMoney(value)}`;
