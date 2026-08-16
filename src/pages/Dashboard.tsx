import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatWon } from "@/lib/chartColors";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import type { PeriodSelection } from "@/lib/period";
import {
  getBalanceSummary,
  getCategoryBreakdown,
  getWeeklySummary,
  getMonthlySummary,
  type BalanceSummary,
  type CategoryAmount,
  type WeeklyPoint,
  type MonthlyPoint,
} from "@/lib/dashboard";
import { setInitialBalance } from "@/lib/settings";
import CategoryPieChart from "@/components/CategoryPieChart";
import IncomeExpenseBarChart, { type BarPoint } from "@/components/IncomeExpenseBarChart";
import PeriodFilter from "@/components/PeriodFilter";

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y.slice(2)}.${m}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryAmount[] | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPoint[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[] | null>(null);

  const [breakdownSelection, setBreakdownSelection] = useState<PeriodSelection | null>({
    kind: "quick",
    value: "month",
  });
  const [weeklySelection, setWeeklySelection] = useState<PeriodSelection | null>(null);
  const [monthlySelection, setMonthlySelection] = useState<PeriodSelection | null>(null);

  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [savingBalance, setSavingBalance] = useState(false);

  async function loadSummary() {
    const body = await getBalanceSummary();
    setSummary(body);
    if (!body.hasInitialBalance) setEditingBalance(true);
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getCategoryBreakdown(breakdownSelection ?? { kind: "quick", value: "month" }).then(setBreakdown);
  }, [breakdownSelection]);

  useEffect(() => {
    const custom = weeklySelection?.kind === "custom" ? weeklySelection.value : undefined;
    getWeeklySummary(custom).then(setWeekly);
  }, [weeklySelection]);

  useEffect(() => {
    const custom = monthlySelection?.kind === "custom" ? monthlySelection.value : undefined;
    getMonthlySummary(custom).then(setMonthly);
  }, [monthlySelection]);

  async function saveInitialBalance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBalanceError(null);
    const amount = parseAmountInput(balanceInput);
    if (!Number.isFinite(amount)) {
      setBalanceError("숫자를 입력하세요.");
      return;
    }
    setSavingBalance(true);
    try {
      await setInitialBalance(amount);
      setEditingBalance(false);
      setBalanceInput("");
      await loadSummary();
    } finally {
      setSavingBalance(false);
    }
  }

  const weeklyBars: BarPoint[] =
    weekly?.map((w) => ({ label: formatWeekLabel(w.weekStart), income: w.income, expense: w.expense })) ?? [];
  const monthlyBars: BarPoint[] =
    monthly?.map((m) => ({ label: formatMonthLabel(m.month), income: m.income, expense: m.expense })) ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">대시보드</h1>
        <Link to="/" className="text-sm text-zinc-500 underline">
          홈으로
        </Link>
      </div>

      {/* 현재 자산 */}
      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        {editingBalance ? (
          <form onSubmit={saveInitialBalance} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {summary?.hasInitialBalance ? "초기 자산 수정 (원)" : "앱을 처음 사용하는 시점의 잔액을 입력하세요 (원)"}
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(balanceInput)}
                onChange={(e) => setBalanceInput(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="예: 1,000,000"
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                required
                autoFocus
              />
            </label>
            {balanceError && <p className="text-sm text-red-600">{balanceError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingBalance}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                저장
              </button>
              {summary?.hasInitialBalance && (
                <button
                  type="button"
                  onClick={() => setEditingBalance(false)}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">현재 자산</p>
              <p className="text-3xl font-semibold tabular-nums">{summary ? formatWon(summary.balance) : "..."}</p>
              {summary && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  초기 {formatWon(summary.initialBalance)} + 수입 {formatWon(summary.totalIncome)} − 지출{" "}
                  {formatWon(summary.totalExpense)}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setBalanceInput(String(summary?.initialBalance ?? ""));
                setEditingBalance(true);
              }}
              className="text-xs text-zinc-500 underline"
            >
              초기 자산 수정
            </button>
          </div>
        )}
      </section>

      {/* 카테고리별 비율 */}
      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">카테고리별 지출 비율</h2>
          <PeriodFilter quickOptions={["week", "month", "all"]} selection={breakdownSelection} onChange={setBreakdownSelection} />
        </div>
        {breakdown === null ? (
          <p className="py-8 text-center text-sm text-zinc-500">불러오는 중...</p>
        ) : (
          <CategoryPieChart data={breakdown} />
        )}
      </section>

      {/* 주별 요약 */}
      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">주별 수입/지출 (월요일 시작)</h2>
          <PeriodFilter
            selection={weeklySelection}
            onChange={setWeeklySelection}
            defaultLabel="최근 8주"
            allowWeekSelection={false}
          />
        </div>
        {weekly === null ? (
          <p className="py-8 text-center text-sm text-zinc-500">불러오는 중...</p>
        ) : (
          <IncomeExpenseBarChart data={weeklyBars} />
        )}
      </section>

      {/* 월별 요약 */}
      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">월별 수입/지출 추이</h2>
          <PeriodFilter
            selection={monthlySelection}
            onChange={setMonthlySelection}
            defaultLabel="최근 6개월"
            allowWeekSelection={false}
          />
        </div>
        {monthly === null ? (
          <p className="py-8 text-center text-sm text-zinc-500">불러오는 중...</p>
        ) : (
          <IncomeExpenseBarChart data={monthlyBars} />
        )}
      </section>
    </div>
  );
}
