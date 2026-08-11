import { appConfig } from "@/config/app";

export function formatMoney(
  minorUnits: number,
  currency: string = appConfig.defaultCurrency,
  locale = "en-US",
) {
  const fractionDigits = currency === appConfig.defaultCurrency ? appConfig.currencyFractionDigits : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(minorUnits / 10 ** fractionDigits);
}
