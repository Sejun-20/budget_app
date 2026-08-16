import { getDb } from "./db";

export interface ExpenseCategoryEntry {
  name: string;
  /** Stable slot into the validated 6-color categorical palette (chartColors.ts),
   * assigned once at creation so deleting/adding other categories never
   * repaints this one. */
  colorIndex: number;
}

const COLOR_SLOTS = 6;

const DEFAULT_INCOME_CATEGORIES = ["월급", "용돈", "부수입", "기타"];
const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryEntry[] = [
  { name: "식비", colorIndex: 0 },
  { name: "생활용품", colorIndex: 1 },
  { name: "건강", colorIndex: 2 },
  { name: "자기개발", colorIndex: 3 },
  { name: "문화생활", colorIndex: 4 },
  { name: "쇼핑", colorIndex: 5 },
];

const INCOME_KEY = "income_categories";
const EXPENSE_KEY = "expense_categories";

export async function getIncomeCategories(): Promise<string[]> {
  const db = await getDb();
  const row = await db.get("settings", INCOME_KEY);
  if (!row) return DEFAULT_INCOME_CATEGORIES;
  return JSON.parse(row.value) as string[];
}

export async function getExpenseCategories(): Promise<ExpenseCategoryEntry[]> {
  const db = await getDb();
  const row = await db.get("settings", EXPENSE_KEY);
  if (!row) return DEFAULT_EXPENSE_CATEGORIES;
  return JSON.parse(row.value) as ExpenseCategoryEntry[];
}

export async function getExpenseCategoryNames(): Promise<string[]> {
  return (await getExpenseCategories()).map((c) => c.name);
}

async function saveIncomeCategories(list: string[]): Promise<void> {
  const db = await getDb();
  await db.put("settings", { key: INCOME_KEY, value: JSON.stringify(list) });
}

async function saveExpenseCategories(list: ExpenseCategoryEntry[]): Promise<void> {
  const db = await getDb();
  await db.put("settings", { key: EXPENSE_KEY, value: JSON.stringify(list) });
}

function nextColorIndex(list: ExpenseCategoryEntry[]): number {
  const used = new Set(list.map((c) => c.colorIndex));
  for (let i = 0; i < COLOR_SLOTS; i++) {
    if (!used.has(i)) return i;
  }
  return list.length % COLOR_SLOTS;
}

/** Renames every existing transaction tagged with a category so historical
 * data follows the rename instead of being orphaned under the old name. */
async function renameCategoryInTransactions(
  type: "income" | "expense",
  oldName: string,
  newName: string
): Promise<void> {
  const db = await getDb();
  const all = await db.getAll("transactions");
  const tx = db.transaction("transactions", "readwrite");
  for (const t of all) {
    if (t.type === type && t.category === oldName) {
      await tx.store.put({ ...t, category: newName, updated_at: new Date().toISOString() });
    }
  }
  await tx.done;
}

export async function addIncomeCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const list = await getIncomeCategories();
  if (list.includes(trimmed)) return;
  await saveIncomeCategories([...list, trimmed]);
}

export async function renameIncomeCategory(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const list = await getIncomeCategories();
  await saveIncomeCategories(list.map((c) => (c === oldName ? trimmed : c)));
  await renameCategoryInTransactions("income", oldName, trimmed);
}

export async function deleteIncomeCategory(name: string): Promise<void> {
  const list = await getIncomeCategories();
  if (list.length <= 1) return; // always keep at least one category
  await saveIncomeCategories(list.filter((c) => c !== name));
}

export async function addExpenseCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const list = await getExpenseCategories();
  if (list.some((c) => c.name === trimmed)) return;
  await saveExpenseCategories([...list, { name: trimmed, colorIndex: nextColorIndex(list) }]);
}

export async function renameExpenseCategory(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const list = await getExpenseCategories();
  await saveExpenseCategories(list.map((c) => (c.name === oldName ? { ...c, name: trimmed } : c)));
  await renameCategoryInTransactions("expense", oldName, trimmed);
}

export async function deleteExpenseCategory(name: string): Promise<void> {
  const list = await getExpenseCategories();
  if (list.length <= 1) return;
  await saveExpenseCategories(list.filter((c) => c.name !== name));
}
