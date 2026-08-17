import { useState } from "react";
import CustomPeriodPicker from "./CustomPeriodPicker";
import type { PeriodSelection, QuickPeriod, CustomPeriod } from "@/lib/period";

const QUICK_LABEL: Record<QuickPeriod, string> = { week: "이번 주", month: "이번 달", all: "전체" };

const ACTIVE_STYLE = { background: "var(--color-primary)", color: "#fff" };
const INACTIVE_STYLE = { color: "var(--color-text-muted)" };

/**
 * Period selector shared by the category-breakdown, weekly, and monthly
 * dashboard sections. With `quickOptions` it renders 이번주/이번달/전체 plus
 * "기간 설정"; without it (weekly/monthly), it renders a single
 * `defaultLabel` button plus "기간 설정" — `selection: null` means "use
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
      <div className="field flex gap-1 p-0.5">
        {quickOptions ? (
          quickOptions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setCustomOpen(false);
                onChange({ kind: "quick", value: q });
              }}
              className="min-w-0 flex-1 rounded px-1 py-1 text-center text-xs font-medium"
              style={selection?.kind === "quick" && selection.value === q ? ACTIVE_STYLE : INACTIVE_STYLE}
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
            className="min-w-0 flex-1 rounded px-1 py-1 text-center text-xs font-medium"
            style={selection === null ? ACTIVE_STYLE : INACTIVE_STYLE}
          >
            {defaultLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="min-w-0 flex-1 rounded px-1 py-1 text-center text-xs font-medium"
          style={isCustomActive ? ACTIVE_STYLE : INACTIVE_STYLE}
        >
          기간 설정
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
