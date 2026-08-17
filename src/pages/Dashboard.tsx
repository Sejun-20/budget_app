import { useEffect, useState, type FormEvent } from "react";
import { formatWon, getExpenseCategoryColorMap, getIncomeCategoryColorMap } from "@/lib/chartColors";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import type { PeriodSelection } from "@/lib/period";
import {
  getBalanceSummary,
  getCategoryBreakdown,
  getCurrentMonthNet,
  getWeeklySummary,
  getMonthlySummary,
  type BalanceSummary,
  type CategoryAmount,
  type MonthNet,
  type WeeklyPoint,
  type MonthlyPoint,
} from "@/lib/dashboard";
import { setInitialBalance } from "@/lib/settings";
import CategoryPieChart from "@/components/CategoryPieChart";
import IncomeExpenseBarChart, { type BarPoint } from "@/components/IncomeExpenseBarChart";
import PeriodFilter from "@/components/PeriodFilter";
import PageHeader from "@/components/PageHeader";

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
  const [monthNet, setMonthNet] = useState<MonthNet | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryAmount[] | null>(null);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryAmount[] | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPoint[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[] | null>(null);
  const [expenseColorMap, setExpenseColorMap] = useState<Record<string, string>>({});
  const [incomeColorMap, setIncomeColorMap] = useState<Record<string, string>>({});

  const [expenseBreakdownSelection, setExpenseBreakdownSelection] = useState<PeriodSelection | null>({
    kind: "quick",
    value: "month",
  });
  const [incomeBreakdownSelection, setIncomeBreakdownSelection] = useState<PeriodSelection | null>({
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
    getCurrentMonthNet().then(setMonthNet);
    getExpenseCategoryColorMap().then(setExpenseColorMap);
    getIncomeCategoryColorMap().then(setIncomeColorMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getCategoryBreakdown(expenseBreakdownSelection ?? { kind: "quick", value: "month" }, "expense").then(
      setExpenseBreakdown
    );
  }, [expenseBreakdownSelection]);

  useEffect(() => {
    getCategoryBreakdown(incomeBreakdownSelection ?? { kind: "quick", value: "month" }, "income").then(
      setIncomeBreakdown
    );
  }, [incomeBreakdownSelection]);

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6" style={{ background: "var(--color-page-bg)" }}>
      <PageHeader title="대시보드" />

      {/* 현재 자산 */}
      <section className="app-card p-5">
        {editingBalance ? (
          <form onSubmit={saveInitialBalance} className="flex flex-col gap-3">
            <label className="app-muted flex flex-col gap-1 text-sm">
              앱을 처음 사용하는 시점의 잔액을 입력하세요 (원)
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(balanceInput)}
                onChange={(e) => setBalanceInput(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="예: 1,000,000"
                className="field px-3 py-2"
                required
                autoFocus
              />
            </label>
            {balanceError && <p className="text-sm" style={{ color: "var(--color-red)" }}>{balanceError}</p>}
            <button type="submit" disabled={savingBalance} className="btn-primary px-4 py-2 text-sm">
              저장
            </button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="app-muted text-sm">현재 자산</p>
              <p className="app-title text-3xl font-bold tabular-nums">{summary ? formatWon(summary.balance) : "..."}</p>
            </div>
            {summary && monthNet && (
              <div className="app-muted grid shrink-0 grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 pt-1 text-xs">
                <span>이월 :</span>
                <span className="text-right tabular-nums">{formatWon(summary.balance - monthNet.income + monthNet.expense)}</span>
                <span>수입 :</span>
                <span className="text-right tabular-nums">{formatWon(monthNet.income)}</span>
                <span>지출 :</span>
                <span className="text-right tabular-nums">{formatWon(monthNet.expense)}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 카테고리별 지출 비율 */}
      <section className="app-card p-5">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="app-title text-sm font-semibold">카테고리별 지출 비율</h2>
          <PeriodFilter
            quickOptions={["week", "month", "all"]}
            selection={expenseBreakdownSelection}
            onChange={setExpenseBreakdownSelection}
          />
        </div>
        {expenseBreakdown === null ? (
          <p className="app-muted py-8 text-center text-sm">불러오는 중...</p>
        ) : (
          <CategoryPieChart data={expenseBreakdown} colorMap={expenseColorMap} />
        )}
      </section>

      {/* 카테고리별 수입 비율 */}
      <section className="app-card p-5">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="app-title text-sm font-semibold">카테고리별 수입 비율</h2>
          <PeriodFilter
            quickOptions={["week", "month", "all"]}
            selection={incomeBreakdownSelection}
            onChange={setIncomeBreakdownSelection}
          />
        </div>
        {incomeBreakdown === null ? (
          <p className="app-muted py-8 text-center text-sm">불러오는 중...</p>
        ) : (
          <CategoryPieChart
            data={incomeBreakdown}
            colorMap={incomeColorMap}
            emptyMessage="해당 기간에 수입 내역이 없습니다."
          />
        )}
      </section>

      {/* 주별 요약 */}
      <section className="app-card p-5">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="app-title text-sm font-semibold">주별 수입/지출 (월요일 시작)</h2>
          <PeriodFilter
            selection={weeklySelection}
            onChange={setWeeklySelection}
            defaultLabel="최근 8주"
            allowWeekSelection={false}
          />
        </div>
        {weekly === null ? (
          <p className="app-muted py-8 text-center text-sm">불러오는 중...</p>
        ) : (
          <IncomeExpenseBarChart data={weeklyBars} />
        )}
      </section>

      {/* 월별 요약 */}
      <section className="app-card p-5">
        <div className="mb-4 flex flex-col gap-3">
          <h2 className="app-title text-sm font-semibold">월별 수입/지출 추이</h2>
          <PeriodFilter
            selection={monthlySelection}
            onChange={setMonthlySelection}
            defaultLabel="최근 6개월"
            allowWeekSelection={false}
          />
        </div>
        {monthly === null ? (
          <p className="app-muted py-8 text-center text-sm">불러오는 중...</p>
        ) : (
          <IncomeExpenseBarChart data={monthlyBars} />
        )}
      </section>
    </div>
  );
}
