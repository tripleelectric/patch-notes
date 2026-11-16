/** `YYYY-MM-DD` in the machine's local time zone. */
export const localDate = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
