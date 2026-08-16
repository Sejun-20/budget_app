import { useState, type FormEvent } from "react";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
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
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = useState<string>(
    (categories as readonly string[]).includes(transaction.category) ? transaction.category : categories[0]
  );
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date);
  const [merchant, setMerchant] = useState(transaction.merchant ?? "");
  const [memo, setMemo] = useState(transaction.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleTypeChange(next: TxType) {
    setType(next);
    const nextCategories = next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setCategory(nextCategories[0]);
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
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex rounded border border-zinc-300 p-1 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
            type === "expense"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          지출
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
            type === "income"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          수입
        </button>
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {categories.map((c) => (
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
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        required
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        required
      />

      <input
        type="text"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="상호명 (선택)"
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <input
        type="text"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          취소
        </button>
      </div>
    </form>
  );
}
