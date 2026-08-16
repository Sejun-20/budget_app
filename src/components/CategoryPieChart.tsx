import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS, formatWon } from "@/lib/chartColors";
import type { ExpenseCategory } from "@/lib/categories";

interface CategoryAmount {
  category: string;
  amount: number;
}

export default function CategoryPieChart({ data }: { data: CategoryAmount[] }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0 || total === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        해당 기간에 지출 내역이 없습니다.
      </p>
    );
  }

  const colorFor = (category: string) =>
    CATEGORY_COLORS[category as ExpenseCategory] ?? "var(--chart-text-muted)";

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ payload, percent }) => `${payload.category} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
          <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-1 font-normal">카테고리</th>
            <th className="py-1 text-right font-normal">금액</th>
            <th className="py-1 text-right font-normal">비율</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.category} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="flex items-center gap-2 py-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorFor(d.category) }}
                />
                {d.category}
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatWon(d.amount)}</td>
              <td className="py-1.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                {((d.amount / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
