import { EXPENSE_CATEGORIES, type ExpenseCategory } from "./categories";

export { formatWon } from "./money";

// Fixed categorical slots from the validated palette. Assigned by category
// identity (declaration order), never by rank/value, so a category always
// keeps the same color regardless of which period/filter is active.
const CATEGORY_COLOR_VARS = [
  "--chart-cat-1",
  "--chart-cat-2",
  "--chart-cat-3",
  "--chart-cat-4",
  "--chart-cat-5",
  "--chart-cat-6",
] as const;

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((cat, i) => [cat, `var(${CATEGORY_COLOR_VARS[i]})`])
) as Record<ExpenseCategory, string>;

export const INCOME_COLOR = "var(--chart-income)";
export const EXPENSE_COLOR = "var(--chart-expense)";
export const GRID_COLOR = "var(--chart-grid)";
export const AXIS_COLOR = "var(--chart-axis)";
export const MUTED_TEXT_COLOR = "var(--chart-text-muted)";
