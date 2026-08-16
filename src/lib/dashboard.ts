import { getDb } from "./db";
import { getInitialBalance, hasInitialBalance } from "./settings";
import {
  type PeriodSelection,
  type CustomPeriod,
  todayUTC,
  parseDateUTC,
  formatDateUTC,
  addDaysUTC,
  mondayOfWeekUTC,
  resolveCustomRange,
  weeksInYear,
  daysInMonth,
} from "./period";

interface RawTransaction {
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
}

async function getAllForAggregation(): Promise<RawTransaction[]> {
  const db = await getDb();
  const all = await db.getAll("transactions");
  return all.map((t) => ({ type: t.type, category: t.category, amount: t.amount, date: t.date }));
}

export interface BalanceSummary {
  hasInitialBalance: boolean;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export async function getBalanceSummary(): Promise<BalanceSummary> {
  const txs = await getAllForAggregation();
  const totalIncome = txs
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const initialBalance = await getInitialBalance();

  return {
    hasInitialBalance: await hasInitialBalance(),
    initialBalance,
    totalIncome,
    totalExpense,
    balance: initialBalance + totalIncome - totalExpense,
  };
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export async function getCategoryBreakdown(
  selection: PeriodSelection,
  type: "income" | "expense" = "expense"
): Promise<CategoryAmount[]> {
  const matching = (await getAllForAggregation()).filter((t) => t.type === type);

  let filtered = matching;
  if (selection.kind === "quick") {
    if (selection.value !== "all") {
      const today = todayUTC();
      const start =
        selection.value === "week"
          ? mondayOfWeekUTC(today)
          : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      const startStr = formatDateUTC(start);
      filtered = matching.filter((t) => t.date >= startStr);
    }
  } else {
    const { start, end } = resolveCustomRange(selection.value);
    filtered = matching.filter((t) => t.date >= start && t.date <= end);
  }

  const totals = new Map<string, number>();
  for (const t of filtered) {
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface WeeklyPoint {
  weekStart: string;
  income: number;
  expense: number;
}

export async function getWeeklySummary(custom?: CustomPeriod): Promise<WeeklyPoint[]> {
  const txs = await getAllForAggregation();

  let weekStarts: string[];
  if (!custom) {
    const currentMonday = mondayOfWeekUTC(todayUTC());
    weekStarts = Array.from({ length: 8 }, (_, i) =>
      formatDateUTC(addDaysUTC(currentMonday, -7 * (7 - i)))
    );
  } else if (custom.month) {
    // 8 weeks ending at the week containing the last day of the selected month.
    const lastOfMonth = new Date(Date.UTC(custom.year, custom.month - 1, daysInMonth(custom.year, custom.month)));
    const anchorMonday = mondayOfWeekUTC(lastOfMonth);
    weekStarts = Array.from({ length: 8 }, (_, i) => formatDateUTC(addDaysUTC(anchorMonday, -7 * (7 - i))));
  } else {
    weekStarts = weeksInYear(custom.year);
  }

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const ws of weekStarts) buckets.set(ws, { income: 0, expense: 0 });

  for (const t of txs) {
    const monday = formatDateUTC(mondayOfWeekUTC(parseDateUTC(t.date)));
    const bucket = buckets.get(monday);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return weekStarts.map((weekStart) => ({ weekStart, ...buckets.get(weekStart)! }));
}

export interface MonthlyPoint {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
}

export async function getMonthlySummary(custom?: CustomPeriod): Promise<MonthlyPoint[]> {
  const txs = await getAllForAggregation();

  let months: string[];
  if (!custom) {
    const today = todayUTC();
    months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - i), 1));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    });
  } else if (custom.month) {
    // 6 months ending at the selected year/month.
    months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(custom.year, custom.month! - 1 - (5 - i), 1));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    });
  } else {
    months = Array.from({ length: 12 }, (_, i) => `${custom.year}-${String(i + 1).padStart(2, "0")}`);
  }

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const m of months) buckets.set(m, { income: 0, expense: 0 });

  for (const t of txs) {
    const key = t.date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return months.map((month) => ({ month, ...buckets.get(month)! }));
}
