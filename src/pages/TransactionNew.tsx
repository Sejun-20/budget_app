import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { getIncomeCategories, getExpenseCategoryNames } from "@/lib/categories";
import { formatAmountInput, formatWon, parseAmountInput } from "@/lib/money";
import { insertTransaction } from "@/lib/transactions";

type TxType = "income" | "expense";

function todayString(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function TransactionNew() {
  const [searchParams] = useSearchParams();
  const initialType: TxType = searchParams.get("type") === "income" ? "income" : "expense";

  const [type, setType] = useState<TxType>(initialType);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const categories = type === "income" ? incomeCategories : expenseCategories;
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayString());
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getIncomeCategories(), getExpenseCategoryNames()]).then(([income, expense]) => {
      setIncomeCategories(income);
      setExpenseCategories(expense);
      setCategory((type === "income" ? income : expense)[0] ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React Router keeps this component mounted across query-string-only
  // navigation (e.g. tapping 수입 추가 then 지출 추가 from Home) — resync
  // `type` whenever the URL's ?type= changes instead of only reading it once.
  useEffect(() => {
    const nextType: TxType = searchParams.get("type") === "income" ? "income" : "expense";
    if (nextType !== type) handleTypeChange(nextType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleTypeChange(next: TxType) {
    setType(next);
    const nextCategories = next === "income" ? incomeCategories : expenseCategories;
    setCategory(nextCategories[0] ?? "");
    setError(null);
    setSuccessMsg(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const amountNum = parseAmountInput(amount);
    if (!amountNum || amountNum <= 0) {
      setError("금액을 올바르게 입력하세요.");
      return;
    }

    setSubmitting(true);
    try {
      await insertTransaction({
        type,
        source: "manual",
        category,
        amount: amountNum,
        date,
        memo: memo || null,
        paymentMethod,
      });
      setSuccessMsg(`${type === "income" ? "수입" : "지출"} ${formatWon(amountNum)}이 저장되었습니다.`);
      setAmount("");
      setMemo("");
      setDate(todayString());
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 overflow-x-hidden p-6"
      style={{ background: "var(--color-page-bg)" }}
    >
      <PageHeader title={type === "income" ? "수입 추가" : "지출 추가"} />

      <div className="field flex w-full p-1">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className="flex-1 rounded px-3 py-2 text-sm font-medium"
          style={
            type === "expense"
              ? { background: "var(--color-red)", color: "#fff" }
              : { color: "var(--color-text-muted)" }
          }
        >
          지출
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className="flex-1 rounded px-3 py-2 text-sm font-medium"
          style={
            type === "income"
              ? { background: "var(--color-green)", color: "#fff" }
              : { color: "var(--color-text-muted)" }
          }
        >
          수입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-4">
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm">
          카테고리
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full min-w-0 px-3 py-2">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-full min-w-0 flex-col gap-1 text-sm">
          금액 (원)
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(amount)}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            className="field w-full min-w-0 px-3 py-2"
            required
          />
        </label>

        <label className="flex w-full min-w-0 flex-col gap-1 text-sm">
          날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field px-3 py-2"
            required
          />
        </label>

        <label className="flex w-full min-w-0 flex-col gap-1 text-sm">
          결제수단
          <div className="field flex w-full p-1">
            {(["cash", "card"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className="flex-1 rounded px-3 py-2 text-sm font-medium"
                style={
                  paymentMethod === m ? { background: "var(--color-primary)", color: "#fff" } : { color: "var(--color-text-muted)" }
                }
              >
                {m === "cash" ? "현금" : "카드"}
              </button>
            ))}
          </div>
        </label>

        <label className="flex w-full min-w-0 flex-col gap-1 text-sm">
          메모
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="field w-full min-w-0 px-3 py-2"
          />
        </label>

        {error && <p className="break-words text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}
        {successMsg && <p className="break-words text-sm" style={{ color: "var(--color-green)" }}>{successMsg}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-2 text-sm">
          저장
        </button>
      </form>
    </div>
  );
}
