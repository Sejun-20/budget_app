import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/apiKey";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { getInitialBalance, hasInitialBalance, setInitialBalance } from "@/lib/settings";
import {
  getIncomeCategories,
  getExpenseCategories,
  addIncomeCategory,
  renameIncomeCategory,
  deleteIncomeCategory,
  addExpenseCategory,
  renameExpenseCategory,
  deleteExpenseCategory,
} from "@/lib/categories";
import { getCategoryColorMap } from "@/lib/chartColors";
import CategoryManager from "@/components/CategoryManager";

export default function Settings() {
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const [balanceInput, setBalanceInput] = useState("");
  const [balanceSaved, setBalanceSaved] = useState(false);
  const [balanceHasValue, setBalanceHasValue] = useState(false);

  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [expenseColorMap, setExpenseColorMap] = useState<Record<string, string>>({});

  async function reloadCategories() {
    const [income, expense, colorMap] = await Promise.all([
      getIncomeCategories(),
      getExpenseCategories(),
      getCategoryColorMap(),
    ]);
    setIncomeCategories(income);
    setExpenseCategories(expense.map((c) => c.name));
    setExpenseColorMap(colorMap);
  }

  useEffect(() => {
    setHasKey(!!getApiKey());
    reloadCategories();
    (async () => {
      if (await hasInitialBalance()) {
        setBalanceHasValue(true);
        setBalanceInput(String(await getInitialBalance()));
      }
    })();
  }, []);

  function handleSaveKey(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setApiKey(keyInput.trim());
    setKeyInput("");
    setHasKey(true);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  function handleClearKey() {
    if (!window.confirm("저장된 API 키를 삭제할까요?")) return;
    clearApiKey();
    setHasKey(false);
  }

  async function handleSaveBalance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amount = parseAmountInput(balanceInput);
    await setInitialBalance(amount);
    setBalanceHasValue(true);
    setBalanceSaved(true);
    setTimeout(() => setBalanceSaved(false), 2000);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">설정</h1>
        <Link to="/" className="text-sm text-zinc-500 underline">
          홈으로
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Claude API 키</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          영수증 사진 인식(Claude Vision)에 사용됩니다. 이 키는 이 기기의 브라우저에만 저장되며, 서버로
          전송되지 않고 Anthropic API에 직접 요청할 때만 사용됩니다.
        </p>

        {hasKey ? (
          <div className="flex items-center justify-between rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-400">API 키가 설정되어 있습니다.</span>
            <button type="button" onClick={handleClearKey} className="text-xs text-red-600 underline">
              삭제
            </button>
          </div>
        ) : (
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            아직 API 키가 설정되지 않았습니다.
          </p>
        )}

        <form onSubmit={handleSaveKey} className="flex flex-col gap-2">
          <input
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full min-w-0 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {hasKey ? "키 교체" : "키 저장"}
          </button>
          {keySaved && <p className="text-sm text-green-600">저장되었습니다.</p>}
        </form>

        <p className="text-xs text-zinc-400">
          console.anthropic.com에서 키를 발급받고, 사용량 한도(spend limit)를 설정해두는 것을
          권장합니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">초기 자산</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          가계부를 처음 시작하는 시점의 잔액입니다. 대시보드의 현재 자산 계산에 사용됩니다.
        </p>
        <form onSubmit={handleSaveBalance} className="flex flex-col gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(balanceInput)}
            onChange={(e) => setBalanceInput(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="예: 1,000,000"
            className="w-full min-w-0 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="w-full rounded border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            {balanceHasValue ? "초기 자산 수정" : "초기 자산 저장"}
          </button>
          {balanceSaved && <p className="text-sm text-green-600">저장되었습니다.</p>}
        </form>
      </section>

      <CategoryManager
        title="지출 카테고리"
        description="영수증 인식과 지출 입력에 사용되는 카테고리입니다. 이름을 바꾸면 기존 내역에도 함께 반영됩니다."
        categories={expenseCategories}
        colorFor={(name) => expenseColorMap[name] ?? "var(--chart-text-muted)"}
        onAdd={async (name) => {
          await addExpenseCategory(name);
          await reloadCategories();
        }}
        onRename={async (oldName, newName) => {
          await renameExpenseCategory(oldName, newName);
          await reloadCategories();
        }}
        onDelete={async (name) => {
          await deleteExpenseCategory(name);
          await reloadCategories();
        }}
      />

      <CategoryManager
        title="수입 카테고리"
        description="수입 입력에 사용되는 카테고리입니다. 이름을 바꾸면 기존 내역에도 함께 반영됩니다."
        categories={incomeCategories}
        onAdd={async (name) => {
          await addIncomeCategory(name);
          await reloadCategories();
        }}
        onRename={async (oldName, newName) => {
          await renameIncomeCategory(oldName, newName);
          await reloadCategories();
        }}
        onDelete={async (name) => {
          await deleteIncomeCategory(name);
          await reloadCategories();
        }}
      />
    </div>
  );
}
