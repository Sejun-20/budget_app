import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList, ResponsiveContainer } from "recharts";
import { INCOME_COLOR, EXPENSE_COLOR, GRID_COLOR, AXIS_COLOR, MUTED_TEXT_COLOR } from "@/lib/chartColors";

export interface BarPoint {
  label: string;
  income: number;
  expense: number;
}

function formatAxisTick(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}만`;
  return String(value);
}

function formatBarLabel(value: number): string {
  if (!value) return "";
  if (Math.abs(value) >= 10000) {
    const man = value / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function IncomeExpenseBarChart({ data }: { data: BarPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        데이터가 없습니다.
      </p>
    );
  }

  const isWide = data.length > 14;
  const chartWidth = isWide ? data.length * 44 : undefined;

  const chart = (
    <BarChart
      data={data}
      margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
      {...(chartWidth ? { width: chartWidth, height: 260 } : {})}
    >
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" stroke={AXIS_COLOR} tick={{ fill: MUTED_TEXT_COLOR, fontSize: 12 }} tickLine={false} />
      <YAxis
        stroke={AXIS_COLOR}
        tick={{ fill: MUTED_TEXT_COLOR, fontSize: 12 }}
        tickFormatter={formatAxisTick}
        width={44}
        tickLine={false}
      />
      <Legend />
      <Bar dataKey="income" name="수입" fill={INCOME_COLOR} radius={[3, 3, 0, 0]}>
        <LabelList dataKey="income" position="top" formatter={(v) => formatBarLabel(Number(v))} fontSize={10} fill={MUTED_TEXT_COLOR} />
      </Bar>
      <Bar dataKey="expense" name="지출" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]}>
        <LabelList dataKey="expense" position="top" formatter={(v) => formatBarLabel(Number(v))} fontSize={10} fill={MUTED_TEXT_COLOR} />
      </Bar>
    </BarChart>
  );

  if (isWide) {
    return <div className="overflow-x-auto">{chart}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      {chart}
    </ResponsiveContainer>
  );
}
