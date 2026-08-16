import { useState } from "react";

export default function CategoryManager({
  title,
  description,
  categories,
  colorFor,
  checkHistory,
  onAdd,
  onRename,
  onDelete,
}: {
  title: string;
  description: string;
  categories: string[];
  /** Optional per-category color dot (expense categories only). */
  colorFor?: (name: string) => string;
  /** Whether the category still has saved transactions — gates the extra rename/delete choice. */
  checkHistory: (name: string) => Promise<boolean>;
  onAdd: (name: string) => Promise<void>;
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyPrompt, setHistoryPrompt] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onAdd(trimmed);
      setNewName("");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(name: string) {
    setEditing(name);
    setEditValue(name);
  }

  async function commitEdit(oldName: string) {
    const trimmed = editValue.trim();
    setEditing(null);
    if (!trimmed || trimmed === oldName) return;
    setBusy(true);
    try {
      await onRename(oldName, trimmed);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(name: string) {
    if (categories.length <= 1) {
      window.alert("카테고리는 최소 1개 이상 있어야 합니다.");
      return;
    }
    setBusy(true);
    const hasHistory = await checkHistory(name);
    setBusy(false);
    if (hasHistory) {
      setHistoryPrompt(name);
      return;
    }
    if (!window.confirm(`"${name}" 카테고리를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await onDelete(name);
    } finally {
      setBusy(false);
    }
  }

  async function confirmFinalDelete(name: string) {
    setConfirmDelete(null);
    setBusy(true);
    try {
      await onDelete(name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>

      <ul className="flex flex-col gap-1.5">
        {categories.map((c) =>
          editing === c ? (
            <li key={c} className="flex items-center gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit(c);
                  if (e.key === "Escape") setEditing(null);
                }}
                autoFocus
                className="w-full min-w-0 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => commitEdit(c)}
                className="shrink-0 rounded bg-black px-3 py-2 text-xs font-medium text-white dark:bg-white dark:text-black"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="shrink-0 rounded border border-zinc-300 px-3 py-2 text-xs dark:border-zinc-700"
              >
                취소
              </button>
            </li>
          ) : (
            <li
              key={c}
              className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span className="flex min-w-0 items-center gap-2">
                {colorFor && (
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(c) }}
                  />
                )}
                <span className="truncate">{c}</span>
              </span>
              <span className="flex shrink-0 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startEdit(c)}
                  className="text-xs text-zinc-500 underline dark:text-zinc-400"
                >
                  수정
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(c)}
                  className="text-xs text-red-600 underline"
                >
                  삭제
                </button>
              </span>
            </li>
          )
        )}
      </ul>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="새 카테고리 이름"
          className="w-full min-w-0 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          disabled={busy || !newName.trim()}
          onClick={handleAdd}
          className="shrink-0 rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          추가
        </button>
      </div>

      {historyPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setHistoryPrompt(null)}
        >
          <div
            className="w-full max-w-xs rounded-lg bg-white p-5 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              &quot;{historyPrompt}&quot; 과거 내역이 있는 카테고리입니다. 다른 카테고리로 변경하시겠습니까?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  startEdit(historyPrompt);
                  setHistoryPrompt(null);
                }}
                className="flex-1 rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                변경
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(historyPrompt);
                  setHistoryPrompt(null);
                }}
                className="flex-1 rounded border border-zinc-300 px-4 py-2 text-sm text-red-600 dark:border-zinc-700"
              >
                삭제
              </button>
            </div>
            <button
              type="button"
              onClick={() => setHistoryPrompt(null)}
              className="mt-3 w-full text-center text-xs text-zinc-500 underline dark:text-zinc-400"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-xs rounded-lg bg-white p-5 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              카테고리가 삭제됩니다. 과거 내역은 그대로 유지됩니다.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => confirmFinalDelete(confirmDelete)}
                className="flex-1 rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
