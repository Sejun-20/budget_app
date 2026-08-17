export function formatWon(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}원`;
}

/** Short form for tight spaces (bar labels, calendar cells): "12000" -> "1.2만". */
export function formatCompactWon(amount: number): string {
  if (!amount) return "";
  if (Math.abs(amount) >= 10000) {
    const man = amount / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return new Intl.NumberFormat("ko-KR").format(amount);
}

/** Comma-grouped digits for a numeric text input, e.g. "1234567" -> "1,234,567". */
export function formatAmountInput(value: number | string): string {
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("ko-KR").format(Number(digits));
}

/** Inverse of formatAmountInput — strips grouping to get back a plain number. */
export function parseAmountInput(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}
