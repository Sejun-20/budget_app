import { useState } from "react";
import CustomPeriodPicker from "./CustomPeriodPicker";
import type { PeriodSelection, QuickPeriod, CustomPeriod } from "@/lib/period";

const QUICK_LABEL: Record<QuickPeriod, string> = { week: "이번 주", month: "이번 달", all: "전체" };

/**
 * Period selector shared by the category-breakdown, weekly, and monthly
 * dashboard sections. With `quickOptions` it renders 이번주/이번달/전체 plus
 * "세부 기간 설정"; without it (weekly/monthly), it renders a single
 * `defaultLabel` button plus "세부 기간 설정" — `selection: null` means "use
 * the section's own default window" (e.g. recent 8 weeks).
 */
export default function PeriodFilter({
  quickOptions,
  defaultLabel = "기본",
  selection,
  onChange,
  allowWeekSelection = true,
}: {
  quickOptions?: QuickPeriod[];
  defaultLabel?: string;
  selection: PeriodSelection | null;
  onChange: (s: PeriodSelection | null) => void;
  allowWeekSelection?: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<CustomPeriod>(
    selection?.kind === "custom" ? selection.value : { year: new Date().getFullYear() }
  );

  const isCustomActive = selection?.kind === "custom";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 rounded border border-zinc-300 p-0.5 dark:border-zinc-700">
        {quickOptions ? (
          quickOptions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setCustomOpen(false);
                onChange({ kind: "quick", value: q });
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                selection?.kind === "quick" && selection.value === q
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {QUICK_LABEL[q]}
            </button>
          ))
        ) : (
          <button
            type="button"
            onClick={() => {
              setCustomOpen(false);
              onChange(null);
            }}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              selection === null
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {defaultLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className={`rounded px-2.5 py-1 text-xs font-medium ${
            isCustomActive ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          세부 기간 설정
        </button>
      </div>

      {customOpen && (
        <CustomPeriodPicker
          value={draft}
          onChange={(c) => {
            setDraft(c);
            onChange({ kind: "custom", value: c });
          }}
          showWeek={allowWeekSelection}
        />
      )}
    </div>
  );
}
