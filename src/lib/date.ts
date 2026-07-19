import { format, formatDistanceToNowStrict } from "date-fns";

export function formatDateTime(value: Date | string, pattern = "PPP p") {
  return format(new Date(value), pattern);
}

export function formatRelativeTime(value: Date | string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}
