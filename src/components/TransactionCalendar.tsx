import { formatCompactWon } from "@/lib/money";
import { daysInMonth } from "@/lib/period";
import type { Transaction } from "@/lib/transactions";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function TransactionCalendar({
  year,
  month,
  transactions,
}: {
  year: number;
  month: number; // 1-12
  /** Already filtered to this year/month. */
  transactions: Transaction[];
}) {
  const totalDays = daysInMonth(year, month);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const byDay = new Map<number, { income: number; expense: number }>();
  for (const t of transactions) {
    const day = Number(t.date.slice(8, 10));
    const bucket = byDay.get(day) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
    byDay.set(day, bucket);
  }

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="app-muted text-center text-[10px] font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const bucket = byDay.get(day);
          return (
            <div
              key={i}
              className="flex min-h-[52px] flex-col items-center gap-0.5 rounded-lg py-1"
              style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-border)" }}
            >
              <span className="text-[11px]">{day}</span>
              {!!bucket?.income && (
                <span className="text-[8px] leading-tight font-medium" style={{ color: "var(--color-blue)" }}>
                  +{formatCompactWon(bucket.income)}
                </span>
              )}
              {!!bucket?.expense && (
                <span className="text-[8px] leading-tight font-medium" style={{ color: "var(--color-red)" }}>
                  -{formatCompactWon(bucket.expense)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
