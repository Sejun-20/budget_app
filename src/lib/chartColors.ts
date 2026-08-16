import { getExpenseCategories, getIncomeCategoryEntries } from "./categories";

export { formatWon } from "./money";

// Fixed categorical slots from the validated palette. Each category is
// assigned a stable slot (see categories.ts) at creation time, never by
// array position, so a category keeps its color regardless of which other
// categories currently exist or which period/filter is active.
const CATEGORY_COLOR_VARS = [
  "--chart-cat-1",
  "--chart-cat-2",
  "--chart-cat-3",
  "--chart-cat-4",
  "--chart-cat-5",
  "--chart-cat-6",
] as const;

function colorOf(c: { color?: string; colorIndex: number }): string {
  return c.color ?? `var(${CATEGORY_COLOR_VARS[c.colorIndex % CATEGORY_COLOR_VARS.length]})`;
}

export async function getExpenseCategoryColorMap(): Promise<Record<string, string>> {
  const categories = await getExpenseCategories();
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.name] = colorOf(c);
  }
  return map;
}

export async function getIncomeCategoryColorMap(): Promise<Record<string, string>> {
  const categories = await getIncomeCategoryEntries();
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.name] = colorOf(c);
  }
  return map;
}

export const INCOME_COLOR = "var(--chart-income)";
export const EXPENSE_COLOR = "var(--chart-expense)";
export const GRID_COLOR = "var(--chart-grid)";
export const AXIS_COLOR = "var(--chart-axis)";
export const MUTED_TEXT_COLOR = "var(--chart-text-muted)";
