import { getDb } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.get("settings", key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.put("settings", { key, value });
}

export async function hasInitialBalance(): Promise<boolean> {
  return (await getSetting("initial_balance")) !== null;
}

export async function getInitialBalance(): Promise<number> {
  const value = await getSetting("initial_balance");
  return value ? Number(value) : 0;
}

export async function setInitialBalance(amount: number): Promise<void> {
  await setSetting("initial_balance", String(Math.round(amount)));
}

export async function getDefaultPaymentMethod(): Promise<"cash" | "card"> {
  const value = await getSetting("default_payment_method");
  return value === "card" ? "card" : "cash";
}

export async function setDefaultPaymentMethod(method: "cash" | "card"): Promise<void> {
  await setSetting("default_payment_method", method);
}
