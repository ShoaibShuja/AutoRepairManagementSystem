import { normalizePhone } from "./validation";

export function customerSearchFilter(value: string) {
  const nameQuery = value
    .trim()
    .replace(/[%_(),]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!nameQuery) return null;

  const phoneQuery = normalizePhone(nameQuery);
  return [
    `name_normalized.ilike.%${nameQuery}%`,
    ...(phoneQuery ? [`phone_normalized.ilike.%${phoneQuery}%`] : []),
  ].join(",");
}
