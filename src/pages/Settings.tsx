import { useEffect, useRef, useState, type FormEvent } from "react";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/apiKey";
import { exportBackup, importBackup } from "@/lib/backup";
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
  categoryHasTransactions,
  setIncomeCategoryColor,
  setExpenseCategoryColor,
} from "@/lib/categories";
import { getExpenseCategoryColorMap, getIncomeCategoryColorMap } from "@/lib/chartColors";
import CategoryManager from "@/components/CategoryManager";
import PageHeader from "@/components/PageHeader";

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
  const [incomeColorMap, setIncomeColorMap] = useState<Record<string, string>>({});

  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function reloadCategories() {
    const [income, expense, expenseColors, incomeColors] = await Promise.all([
      getIncomeCategories(),
      getExpenseCategories(),
      getExpenseCategoryColorMap(),
      getIncomeCategoryColorMap(),
    ]);
    setIncomeCategories(income);
    setExpenseCategories(expense.map((c) => c.name));
    setExpenseColorMap(expenseColors);
    setIncomeColorMap(incomeColors);
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

  async function handleRestoreFile(file: File | undefined) {
    if (!file) return;
    if (restoreInputRef.current) restoreInputRef.current.value = "";
    if (
      !window.confirm("백업 파일 내용으로 현재 데이터(거래 내역, 카테고리, 초기 자산)를 덮어씁니다. 계속할까요?")
    ) {
      return;
    }
    setRestoring(true);
    setRestoreMessage(null);
    try {
      await importBackup(file);
      setRestoreMessage("복원이 완료되었습니다. 화면을 새로고침합니다...");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setRestoreMessage(err instanceof Error ? err.message : "복원 중 오류가 발생했습니다.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-8 p-6" style={{ background: "var(--color-page-bg)" }}>
      <PageHeader title="설정" />

      <section className="flex flex-col gap-3">
        <h2 className="app-title text-sm font-semibold">Claude API 키</h2>
        <p className="app-muted text-xs">
          영수증 사진 인식(Claude Vision)에 사용됩니다. 이 키는 이 기기의 브라우저에만 저장되며, 서버로
          전송되지 않고 Anthropic API에 직접 요청할 때만 사용됩니다.
        </p>

        {hasKey ? (
          <div className="app-card flex items-center justify-between p-3 text-sm">
            <span className="app-muted">API 키가 설정되어 있습니다.</span>
            <button type="button" onClick={handleClearKey} className="text-xs underline" style={{ color: "var(--color-red)" }}>
              삭제
            </button>
          </div>
        ) : (
          <p className="rounded-xl p-3 text-xs" style={{ background: "var(--color-gold-tint)", color: "var(--color-text-strong)" }}>
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
            className="field w-full min-w-0 px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-primary w-full px-4 py-2 text-sm">
            {hasKey ? "키 교체" : "키 저장"}
          </button>
          {keySaved && <p className="text-sm" style={{ color: "var(--color-green)" }}>저장되었습니다.</p>}
        </form>

        <p className="app-muted text-xs">
          console.anthropic.com에서 키를 발급받고, 사용량 한도(spend limit)를 설정해두는 것을 권장합니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="app-title text-sm font-semibold">초기 자산</h2>
        <p className="app-muted text-xs">가계부를 처음 시작하는 시점의 잔액입니다. 대시보드의 현재 자산 계산에 사용됩니다.</p>
        <form onSubmit={handleSaveBalance} className="flex flex-col gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(balanceInput)}
            onChange={(e) => setBalanceInput(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="예: 1,000,000"
            className="field w-full min-w-0 px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-outline w-full px-4 py-2 text-sm">
            {balanceHasValue ? "초기 자산 수정" : "초기 자산 저장"}
          </button>
          {balanceSaved && <p className="text-sm" style={{ color: "var(--color-green)" }}>저장되었습니다.</p>}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="app-title text-sm font-semibold">데이터 백업</h2>
        <p className="app-muted text-xs">
          이 앱의 모든 데이터(거래 내역, 카테고리, 초기 자산)는 서버가 아니라 <strong>이 기기의 브라우저
          저장소(IndexedDB)</strong>에만 저장됩니다. 다른 기기와 자동으로 동기화되지 않고, 브라우저 데이터를 지우거나
          기기를 변경/초기화하면 데이터가 사라질 수 있으니 주기적으로 백업하는 것을 권장합니다. (Claude API 키는
          보안을 위해 백업 파일에 포함되지 않습니다.)
        </p>

        <button type="button" onClick={() => exportBackup()} className="btn-primary w-full px-4 py-2 text-sm">
          백업 파일 내보내기
        </button>

        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => handleRestoreFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={restoring}
          onClick={() => restoreInputRef.current?.click()}
          className="btn-outline w-full px-4 py-2 text-sm"
        >
          백업 파일에서 복원
        </button>
        {restoreMessage && <p className="text-sm" style={{ color: "var(--color-text)" }}>{restoreMessage}</p>}
      </section>

      <CategoryManager
        title="지출 카테고리"
        description="영수증 인식과 지출 입력에 사용되는 카테고리입니다. 이름을 바꾸면 기존 내역에도 함께 반영되고, 삭제해도 기존 내역의 카테고리 표시는 그대로 유지됩니다."
        categories={expenseCategories}
        colorFor={(name) => expenseColorMap[name] ?? "var(--chart-text-muted)"}
        checkHistory={(name) => categoryHasTransactions("expense", name)}
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
        onColorChange={async (name, color) => {
          await setExpenseCategoryColor(name, color);
          await reloadCategories();
        }}
      />

      <CategoryManager
        title="수입 카테고리"
        description="수입 입력에 사용되는 카테고리입니다. 이름을 바꾸면 기존 내역에도 함께 반영되고, 삭제해도 기존 내역의 카테고리 표시는 그대로 유지됩니다."
        categories={incomeCategories}
        colorFor={(name) => incomeColorMap[name] ?? "var(--chart-text-muted)"}
        checkHistory={(name) => categoryHasTransactions("income", name)}
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
        onColorChange={async (name, color) => {
          await setIncomeCategoryColor(name, color);
          await reloadCategories();
        }}
      />
    </div>
  );
}
