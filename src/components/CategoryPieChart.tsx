import { PieChart, Pie, Cell, Legend, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { formatWon } from "@/lib/chartColors";

interface CategoryAmount {
  category: string;
  amount: number;
}

export default function CategoryPieChart({
  data,
  colorMap,
  emptyMessage = "해당 기간에 지출 내역이 없습니다.",
}: {
  data: CategoryAmount[];
  colorMap: Record<string, string>;
  emptyMessage?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0 || total === 0) {
    return <p className="app-muted py-8 text-center text-sm">{emptyMessage}</p>;
  }

  const colorFor = (category: string) => colorMap[category] ?? "var(--chart-text-muted)";

  // recharts already computes the label anchor point (x/y/textAnchor) to
  // match where the leader line ends — reuse it as the base so the two
  // never drift apart, but nudge the text a few px further out so the line
  // doesn't run right up against the letters.
  const LABEL_GAP = 6;
  function renderLabel({ x, y, textAnchor, percent, payload }: PieLabelRenderProps) {
    const category = (payload as CategoryAmount).category;
    const baseX = Number(x) || 0;
    const gappedX = textAnchor === "end" ? baseX - LABEL_GAP : textAnchor === "start" ? baseX + LABEL_GAP : baseX;
    return (
      <text x={gappedX} y={y} fill={colorFor(category)} fontSize={10} textAnchor={textAnchor} dominantBaseline="central">
        {`${category} ${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  }

  // Keyed on the dataset's shape so switching period filters forces a clean
  // remount instead of animating between two pies — recharts can otherwise
  // leave stale/missing leader lines when the slice count changes mid-tween.
  const chartKey = data.map((d) => `${d.category}:${d.amount}`).join("|");

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart key={chartKey} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={62}
            isAnimationActive={false}
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={colorFor(entry.category)} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <table className="w-full text-sm">
        <thead>
          <tr className="app-muted text-left" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th className="py-1 font-normal">카테고리</th>
            <th className="py-1 text-right font-normal">금액</th>
            <th className="py-1 text-right font-normal">비율</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.category} style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td className="flex items-center gap-2 py-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorFor(d.category) }}
                />
                {d.category}
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatWon(d.amount)}</td>
              <td className="app-muted py-1.5 text-right tabular-nums">{((d.amount / total) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
