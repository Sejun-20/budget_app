import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface TransactionRecord {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  merchant: string | null;
  memo: string | null;
  source: "receipt" | "manual";
  /** Absent on transactions saved before this field existed. */
  paymentMethod?: "cash" | "card";
  created_at: string;
  updated_at: string;
}

interface BudgetDBSchema extends DBSchema {
  transactions: {
    key: number;
    value: TransactionRecord;
    indexes: { by_date: string; by_type: string };
  };
  settings: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = "budget_app";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BudgetDBSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<BudgetDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<BudgetDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const txStore = db.createObjectStore("transactions", {
          keyPath: "id",
          autoIncrement: true,
        });
        txStore.createIndex("by_date", "date");
        txStore.createIndex("by_type", "type");

        db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}
