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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6" style={{ background: "var(--color-page-bg)" }}>
      <div className="flex items-center justify-between">
        <h1 className="app-title text-xl font-bold">전체 내역</h1>
        <HomeLink />
      </div>

      {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}

      {transactions === null && <p className="app-muted text-sm">불러오는 중...</p>}
      {transactions !== null && transactions.length === 0 && <p className="app-muted text-sm">아직 내역이 없습니다.</p>}

      <ul className="flex flex-col gap-2">
        {transactions?.map((t) =>
          editingId === t.id ? (
            <li key={t.id} className="app-card p-4">
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
            <li key={t.id} className="app-card flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="app-muted text-xs">
                  {t.date} · {t.category}
                  {t.source === "receipt" && " · 영수증"}
                </span>
                <span className="truncate text-sm">{t.merchant || t.memo || "-"}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className="text-sm font-medium tabular-nums"
                  style={{ color: t.type === "income" ? "var(--color-green)" : "var(--color-red)" }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatWon(t.amount)}
                </span>
                <button onClick={() => setEditingId(t.id)} className="app-muted text-xs underline">
                  수정
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-xs underline" style={{ color: "var(--color-red)" }}>
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
