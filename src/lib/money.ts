import { appConfig } from "@/config/app";

const minorUnitScale = 10 ** appConfig.currencyFractionDigits;
const maximumDatabaseMinorUnits = 2_147_483_647;
const moneyInputPattern = new RegExp(`^\\d+(?:\\.\\d{1,${appConfig.currencyFractionDigits}})?$`);

export function moneyInputToMinorUnits(value: string): number | null {
  const input = value.trim();
  if (!moneyInputPattern.test(input)) return null;

  const [whole, fraction = ""] = input.split(".");
  const minorUnitDigits = `${whole.replace(/^0+/, "") || "0"}${fraction.padEnd(appConfig.currencyFractionDigits, "0")}`;
  if (
    minorUnitDigits.length > String(maximumDatabaseMinorUnits).length ||
    (minorUnitDigits.length === String(maximumDatabaseMinorUnits).length &&
      minorUnitDigits > String(maximumDatabaseMinorUnits))
  )
    return null;
  return Number(minorUnitDigits);
}

export function minorUnitsToMoneyInput(minorUnits: number): string {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) return "";

  const whole = Math.floor(minorUnits / minorUnitScale);
  const fraction = String(minorUnits % minorUnitScale)
    .padStart(appConfig.currencyFractionDigits, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
