import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import TransactionCalendar from "@/components/TransactionCalendar";
import TransactionEditForm from "@/components/TransactionEditForm";
import { formatWon } from "@/lib/money";
import { deleteTransaction, listTransactions, type Transaction } from "@/lib/transactions";

type Mode = "list" | "calendar" | "summary";

const MODE_LABEL: Record<Mode, string> = { list: "기본", calendar: "달력", summary: "요약" };

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("calendar");
  const [ym, setYm] = useState(currentYearMonth);

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

  function shiftMonth(delta: number) {
    setYm(({ year, month }) => {
      const d = new Date(Date.UTC(year, month - 1 + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    });
  }

  const monthPrefix = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
  const monthTransactions = useMemo(
    () => transactions?.filter((t) => t.date.startsWith(monthPrefix)) ?? [],
    [transactions, monthPrefix]
  );
  const monthIncome = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6" style={{ background: "var(--color-page-bg)" }}>
      <PageHeader title="전체 내역" />

      <div className="field flex gap-1 p-0.5">
        {(["list", "calendar", "summary"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="min-w-0 flex-1 rounded px-1 py-1.5 text-center text-xs font-medium"
            style={mode === m ? { background: "var(--color-primary)", color: "#fff" } : { color: "var(--color-text-muted)" }}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {(mode === "calendar" || mode === "summary") && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="app-title px-3 py-1 text-lg" aria-label="이전 달">
            ‹
          </button>
          <span className="app-title text-sm font-semibold">
            {ym.year}년 {ym.month}월
          </span>
          <button type="button" onClick={() => shiftMonth(1)} className="app-title px-3 py-1 text-lg" aria-label="다음 달">
            ›
          </button>
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}

      {transactions === null && <p className="app-muted text-sm">불러오는 중...</p>}

      {transactions !== null && mode === "list" && transactions.length === 0 && (
        <p className="app-muted text-sm">아직 내역이 없습니다.</p>
      )}

      {transactions !== null && mode === "calendar" && (
        <TransactionCalendar year={ym.year} month={ym.month} transactions={monthTransactions} />
      )}

      {transactions !== null && mode === "summary" && (
        <div className="app-card flex flex-col gap-3 p-5">
          {monthTransactions.length === 0 ? (
            <p className="app-muted py-4 text-center text-sm">해당 월에 내역이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="app-muted">수입 합계</span>
                <span className="font-medium tabular-nums" style={{ color: "var(--color-blue)" }}>
                  {formatWon(monthIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="app-muted">지출 합계</span>
                <span className="font-medium tabular-nums" style={{ color: "var(--color-red)" }}>
                  {formatWon(monthExpense)}
                </span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                <span className="app-muted">순잔액</span>
                <span className="app-title font-semibold tabular-nums">{formatWon(monthIncome - monthExpense)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "list" && (
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
                    style={{ color: t.type === "income" ? "var(--color-blue)" : "var(--color-red)" }}
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
      )}
    </div>
  );
}
