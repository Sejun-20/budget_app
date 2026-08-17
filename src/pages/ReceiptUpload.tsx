import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExpenseCategoryNames } from "@/lib/categories";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { prepareImageForClaude } from "@/lib/image";
import { extractReceipt } from "@/lib/claude";
import { insertTransaction } from "@/lib/transactions";
import { hasApiKey } from "@/lib/apiKey";
import HomeLink from "@/components/HomeLink";

interface Draft {
  filename: string;
  previewUrl: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  memo: string;
}

interface Failure {
  filename: string;
  error: string;
}

type Phase = "idle" | "uploading" | "reviewing" | "done";

export default function ReceiptUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [queue, setQueue] = useState<Draft[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [saving, setSaving] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  useEffect(() => {
    getExpenseCategoryNames().then(setExpenseCategories);
    return () => {
      for (const d of queue) URL.revokeObjectURL(d.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    if (!hasApiKey()) {
      setUploadError("Claude API 키가 설정되지 않았습니다. 설정에서 먼저 입력해주세요.");
      return;
    }

    setUploadError(null);
    setPhase("uploading");

    const files = Array.from(fileList);
    setProgress({ done: 0, total: files.length });

    const nextQueue: Draft[] = [];
    const nextFailures: Failure[] = [];

    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      try {
        const { base64, mediaType } = await prepareImageForClaude(file);
        const draft = await extractReceipt(base64, mediaType);
        // Claude extracts a memo from the receipt's item list, but that's
        // often noisy — leave the field empty and let the user type one in
        // only if they want to.
        nextQueue.push({ filename: file.name, previewUrl, ...draft, memo: "" });
      } catch (err) {
        nextFailures.push({
          filename: file.name,
          error: err instanceof Error ? err.message : "추출 실패",
        });
        URL.revokeObjectURL(previewUrl);
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    setQueue(nextQueue);
    setFailures(nextFailures);
    setSavedCount(0);
    setPhase(nextQueue.length > 0 ? "reviewing" : "done");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateCurrentDraft(patch: Partial<Draft>) {
    setQueue((prev) => {
      const next = [...prev];
      next[0] = { ...next[0], ...patch };
      return next;
    });
  }

  async function saveCurrentDraft() {
    const current = queue[0];
    if (!current) return;
    setSaving(true);
    try {
      await insertTransaction({
        type: "expense",
        source: "receipt",
        category: current.category,
        amount: current.amount,
        date: current.date,
        merchant: current.merchant || null,
        memo: current.memo || null,
      });
      setSavedCount((c) => c + 1);
      advanceQueue();
    } catch {
      setUploadError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function skipCurrentDraft() {
    advanceQueue();
  }

  function advanceQueue() {
    setQueue((prev) => {
      URL.revokeObjectURL(prev[0].previewUrl);
      const next = prev.slice(1);
      if (next.length === 0) setPhase("done");
      return next;
    });
  }

  function reset() {
    setPhase("idle");
    setQueue([]);
    setFailures([]);
    setSavedCount(0);
    setUploadError(null);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6" style={{ background: "var(--color-page-bg)" }}>
      <div className="flex items-center justify-between">
        <h1 className="app-title text-xl font-bold">영수증 업로드</h1>
        <HomeLink />
      </div>

      {phase === "idle" && (
        <div className="flex flex-col gap-4">
          <p className="app-muted text-sm">영수증 사진을 촬영하거나 갤러리에서 여러 장 선택하세요.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="app-card p-4 text-sm font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            파일 선택
          </button>
          {uploadError && <p className="text-sm" style={{ color: "var(--color-red)" }}>{uploadError}</p>}
        </div>
      )}

      {phase === "uploading" && (
        <p className="app-muted text-sm">
          이미지를 분석하는 중입니다... ({progress.done}/{progress.total})
        </p>
      )}

      {phase === "reviewing" && queue[0] && (
        <div className="flex flex-col gap-4">
          <p className="app-muted text-sm">
            {queue[0].filename} — 남은 확인: {queue.length}장
          </p>

          <button
            type="button"
            onClick={() => setFullscreenUrl(queue[0].previewUrl)}
            className="app-card flex h-64 w-full items-center justify-center overflow-hidden"
          >
            <img src={queue[0].previewUrl} alt={queue[0].filename} className="h-full w-full object-contain" />
          </button>
          <p className="app-muted -mt-3 text-center text-xs">탭하면 전체화면으로 볼 수 있어요</p>

          <label className="flex flex-col gap-1 text-sm">
            상호명
            <input
              type="text"
              value={queue[0].merchant}
              onChange={(e) => updateCurrentDraft({ merchant: e.target.value })}
              className="field px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            날짜
            <input
              type="date"
              value={queue[0].date}
              onChange={(e) => updateCurrentDraft({ date: e.target.value })}
              className="field px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            금액 (원)
            <input
              type="text"
              inputMode="numeric"
              value={formatAmountInput(queue[0].amount)}
              onChange={(e) => updateCurrentDraft({ amount: parseAmountInput(e.target.value) })}
              className="field px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            카테고리
            <select
              value={queue[0].category}
              onChange={(e) => updateCurrentDraft({ category: e.target.value })}
              className="field px-3 py-2"
            >
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            메모
            <input
              type="text"
              value={queue[0].memo}
              onChange={(e) => updateCurrentDraft({ memo: e.target.value })}
              className="field px-3 py-2"
            />
          </label>

          {uploadError && <p className="text-sm" style={{ color: "var(--color-red)" }}>{uploadError}</p>}

          <div className="flex gap-2">
            <button onClick={saveCurrentDraft} disabled={saving} className="btn-primary flex-1 px-4 py-2 text-sm">
              저장
            </button>
            <button onClick={skipCurrentDraft} disabled={saving} className="btn-outline px-4 py-2 text-sm">
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            {savedCount}건 저장 완료{failures.length > 0 && `, ${failures.length}건 추출 실패`}
          </p>
          {failures.length > 0 && (
            <ul className="list-inside list-disc text-sm" style={{ color: "var(--color-red)" }}>
              {failures.map((f) => (
                <li key={f.filename}>
                  {f.filename}: {f.error}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="btn-primary flex-1 px-4 py-2 text-sm">
              더 업로드하기
            </button>
            <button onClick={() => navigate("/")} className="btn-outline px-4 py-2 text-center text-sm">
              홈으로
            </button>
          </div>
        </div>
      )}

      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            type="button"
            onClick={() => setFullscreenUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white"
          >
            닫기 ✕
          </button>
          <img src={fullscreenUrl} alt="영수증 원본" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
