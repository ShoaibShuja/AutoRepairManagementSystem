import { appConfig } from "@/config/app";

export function formatMoney(minorUnits: number, currency = appConfig.defaultCurrency, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minorUnits);
}
