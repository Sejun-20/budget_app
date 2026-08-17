import { getDb, type TransactionRecord } from "./db";

interface BackupFile {
  version: 1;
  exportedAt: string;
  transactions: TransactionRecord[];
  settings: { key: string; value: string }[];
}

/** Serializes transactions + settings (categories, initial balance, monthly
 * budget) to a JSON file and triggers a browser download. The Claude API key
 * lives in localStorage, not IndexedDB, and is deliberately excluded — it's
 * a secret, not app data. */
export async function exportBackup(): Promise<void> {
  const db = await getDb();
  const [transactions, settings] = await Promise.all([db.getAll("transactions"), db.getAll("settings")]);
  const data: BackupFile = { version: 1, exportedAt: new Date().toISOString(), transactions, settings };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `가계부_백업_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Restores a previously exported backup, replacing all current
 * transactions/settings. Caller is responsible for confirming with the user
 * first, since this overwrites existing data. */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("올바르지 않은 백업 파일입니다.");
  }
  if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.settings)) {
    throw new Error("올바르지 않은 백업 파일입니다.");
  }

  const db = await getDb();

  const txTx = db.transaction("transactions", "readwrite");
  await txTx.store.clear();
  for (const t of data.transactions) await txTx.store.put(t);
  await txTx.done;

  const settingsTx = db.transaction("settings", "readwrite");
  await settingsTx.store.clear();
  for (const s of data.settings) await settingsTx.store.put(s);
  await settingsTx.done;
}
