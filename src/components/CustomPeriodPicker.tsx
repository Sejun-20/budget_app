import { weeksInMonth, type CustomPeriod } from "@/lib/period";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const SELECT_CLASS = "field min-w-0 flex-1 px-1 py-0.5 text-[10px]";

function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (dt: Date) => `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  return `${fmt(monday)}~${fmt(sunday)}`;
}

export default function CustomPeriodPicker({
  value,
  onChange,
  showWeek = true,
}: {
  value: CustomPeriod;
  onChange: (c: CustomPeriod) => void;
  showWeek?: boolean;
}) {
  return (
    <div className="field flex flex-nowrap items-center gap-1 p-1.5">
      <select value={value.year} onChange={(e) => onChange({ year: Number(e.target.value) })} className={SELECT_CLASS}>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>

      <select
        value={value.month ?? ""}
        onChange={(e) => onChange({ year: value.year, month: e.target.value ? Number(e.target.value) : undefined })}
        className={SELECT_CLASS}
      >
        <option value="">전체</option>
        {MONTH_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>

      {showWeek && value.month && (
        <select
          value={value.week ?? ""}
          onChange={(e) => onChange({ year: value.year, month: value.month, week: e.target.value || undefined })}
          className={SELECT_CLASS}
        >
          <option value="">전체</option>
          {weeksInMonth(value.year, value.month).map((w) => (
            <option key={w} value={w}>
              {formatWeekLabel(w)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
