import { useEffect, useState } from "react";
import HomeLink from "@/components/HomeLink";
import TransactionEditForm from "@/components/TransactionEditForm";
import { formatWon } from "@/lib/money";
import { deleteTransaction, listTransactions, type Transaction } from "@/lib/transactions";

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTransactions().then(setTransactions);
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("이 내역을 삭제할까요? 되돌릴 수 없습니다.")) return;

    setError(null);
    const ok = await deleteTransaction(id);
    if (!ok) {
      setError("삭제 중 오류가 발생했습니다.");
      return;
    }
    setTransactions((prev) => prev?.filter((t) => t.id !== id) ?? null);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">전체 내역</h1>
        <HomeLink />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {transactions === null && <p className="text-sm text-zinc-500 dark:text-zinc-400">불러오는 중...</p>}
      {transactions !== null && transactions.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">아직 내역이 없습니다.</p>
      )}

      <ul className="flex flex-col gap-2">
        {transactions?.map((t) =>
          editingId === t.id ? (
            <li key={t.id} className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
              <TransactionEditForm
                transaction={t}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setTransactions((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                  setEditingId(null);
                }}
              />
            </li>
          ) : (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.date} · {t.category}
                  {t.source === "receipt" && " · 영수증"}
                </span>
                <span className="truncate text-sm">{t.merchant || t.memo || "-"}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`text-sm font-medium tabular-nums ${
                    t.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatWon(t.amount)}
                </span>
                <button onClick={() => setEditingId(t.id)} className="text-xs text-zinc-500 underline dark:text-zinc-400">
                  수정
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-600 underline">
                  삭제
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
