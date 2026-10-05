export const CURRENCY = "₼";
const LOCALE = "az-AZ";

export const formatMoney = (value) =>
  `${CURRENCY}${Number(value || 0).toLocaleString(LOCALE)}`;

export const formatSignedMoney = (type, value) =>
  `${type === "income" ? "+" : "-"}${formatMoney(value)}`;
