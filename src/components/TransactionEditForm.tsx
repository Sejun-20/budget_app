import { useEffect, useState, type FormEvent } from "react";
import { getIncomeCategories, getExpenseCategoryNames } from "@/lib/categories";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { updateTransaction, type Transaction } from "@/lib/transactions";

type TxType = "income" | "expense";

export default function TransactionEditForm({
  transaction,
  onCancel,
  onSaved,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onSaved: (updated: Transaction) => void;
}) {
  const [type, setType] = useState<TxType>(transaction.type);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(transaction.category);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">(transaction.paymentMethod ?? "card");
  const [merchant, setMerchant] = useState(transaction.merchant ?? "");
  const [memo, setMemo] = useState(transaction.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getIncomeCategories(), getExpenseCategoryNames()]).then(([income, expense]) => {
      setIncomeCategories(income);
      setExpenseCategories(expense);
    });
  }, []);

  const categories = type === "income" ? incomeCategories : expenseCategories;
  // If the transaction's saved category was since renamed/deleted from the
  // live list, keep showing it as an option instead of silently swapping it.
  const selectableCategories = categories.includes(category) ? categories : [category, ...categories];

  function handleTypeChange(next: TxType) {
    setType(next);
    const nextCategories = next === "income" ? incomeCategories : expenseCategories;
    setCategory(nextCategories[0] ?? "");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const amountNum = parseAmountInput(amount);
    if (!amountNum || amountNum <= 0) {
      setError("금액을 올바르게 입력하세요.");
      return;
    }

    setSaving(true);
    try {
      const ok = await updateTransaction(transaction.id, {
        type,
        source: transaction.source,
        category,
        amount: amountNum,
        date,
        merchant: merchant || null,
        memo: memo || null,
        paymentMethod,
      });
      if (!ok) {
        setError("저장 중 오류가 발생했습니다.");
        return;
      }
      onSaved({
        ...transaction,
        type,
        category,
        amount: amountNum,
        date,
        merchant: merchant || null,
        memo: memo || null,
        paymentMethod,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="field flex p-1">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className="flex-1 rounded px-3 py-1.5 text-sm font-medium"
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
          className="flex-1 rounded px-3 py-1.5 text-sm font-medium"
          style={
            type === "income"
              ? { background: "var(--color-green)", color: "#fff" }
              : { color: "var(--color-text-muted)" }
          }
        >
          수입
        </button>
      </div>

      <select value={category} onChange={(e) => setCategory(e.target.value)} className="field px-3 py-2 text-sm">
        {selectableCategories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="text"
        inputMode="numeric"
        value={formatAmountInput(amount)}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="금액"
        className="field px-3 py-2 text-sm"
        required
      />

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field px-3 py-2 text-sm" required />

      <div className="field flex p-1">
        {(["cash", "card"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPaymentMethod(m)}
            className="flex-1 rounded px-3 py-1.5 text-sm font-medium"
            style={paymentMethod === m ? { background: "var(--color-primary)", color: "#fff" } : { color: "var(--color-text-muted)" }}
          >
            {m === "cash" ? "현금" : "카드"}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="상호명 (선택)"
        className="field px-3 py-2 text-sm"
      />

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="field px-3 py-2 text-sm"
      />

      {error && <p className="text-sm" style={{ color: "var(--color-red)" }}>{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 px-4 py-2 text-sm">
          저장
        </button>
        <button type="button" onClick={onCancel} className="btn-outline px-4 py-2 text-sm">
          취소
        </button>
      </div>
    </form>
  );
}
