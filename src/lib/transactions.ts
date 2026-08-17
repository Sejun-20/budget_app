import { getDb, type TransactionRecord } from "./db";

export interface NewTransaction {
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  merchant?: string | null;
  memo?: string | null;
  source: "receipt" | "manual";
  /** Only meaningful for expenses — income has no cash/card distinction. */
  paymentMethod?: "cash" | "card";
}

export type Transaction = TransactionRecord;

export function validateTransaction(input: Partial<NewTransaction>): string | null {
  if (input.type !== "income" && input.type !== "expense") {
    return "type이 올바르지 않습니다.";
  }
  if (input.source !== "receipt" && input.source !== "manual") {
    return "source가 올바르지 않습니다.";
  }
  if (typeof input.category !== "string" || input.category.trim() === "") {
    return "category가 올바르지 않습니다.";
  }
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0) {
    return "amount는 0보다 큰 숫자여야 합니다.";
  }
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return "date 형식이 올바르지 않습니다 (YYYY-MM-DD).";
  }
  return null;
}

export async function insertTransaction(input: NewTransaction): Promise<number> {
  const db = await getDb();
  const now = new Date().toISOString();
  const record: Omit<TransactionRecord, "id"> = {
    type: input.type,
    category: input.category,
    amount: Math.round(input.amount),
    date: input.date,
    merchant: input.merchant ?? null,
    memo: input.memo ?? null,
    source: input.source,
    paymentMethod: input.paymentMethod,
    created_at: now,
    updated_at: now,
  };
  const id = await db.add("transactions", record as TransactionRecord);
  return id;
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const all = await db.getAll("transactions");
  return all.sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const db = await getDb();
  const row = await db.get("transactions", id);
  return row ?? null;
}

export async function updateTransaction(id: number, input: NewTransaction): Promise<boolean> {
  const db = await getDb();
  const existing = await db.get("transactions", id);
  if (!existing) return false;
  const record: TransactionRecord = {
    ...existing,
    type: input.type,
    category: input.category,
    amount: Math.round(input.amount),
    date: input.date,
    merchant: input.merchant ?? null,
    memo: input.memo ?? null,
    source: input.source,
    paymentMethod: input.paymentMethod,
    updated_at: new Date().toISOString(),
  };
  await db.put("transactions", record);
  return true;
}

export async function deleteTransaction(id: number): Promise<boolean> {
  const db = await getDb();
  const existing = await db.get("transactions", id);
  if (!existing) return false;
  await db.delete("transactions", id);
  return true;
}
