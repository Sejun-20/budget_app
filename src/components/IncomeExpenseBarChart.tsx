import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList, ResponsiveContainer } from "recharts";
import { INCOME_COLOR, EXPENSE_COLOR, GRID_COLOR, AXIS_COLOR, MUTED_TEXT_COLOR } from "@/lib/chartColors";
import { formatCompactWon } from "@/lib/money";

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

export default function IncomeExpenseBarChart({ data }: { data: BarPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <p className="app-muted py-8 text-center text-sm">
        데이터가 없습니다.
      </p>
    );
  }

  const isWide = data.length > 14;
  const chartWidth = isWide ? data.length * 44 : undefined;

  // The YAxis's own width already reserves enough room for its tick text
  // ("140만" etc.), so margin.left can drop to 0 without clipping it.
  // margin.right goes back to its original (pre-centering) value.
  const Y_AXIS_TEXT_WIDTH = 36;
  const Y_AXIS_GAP = 4;
  const Y_AXIS_WIDTH = Y_AXIS_TEXT_WIDTH + Y_AXIS_GAP;

  const chart = (
    <BarChart
      data={data}
      margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
      {...(chartWidth ? { width: chartWidth, height: 260 } : {})}
    >
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis
        dataKey="label"
        stroke={AXIS_COLOR}
        tick={{ fill: MUTED_TEXT_COLOR, fontSize: 12 }}
        tickLine={false}
        interval={0}
      />
      <YAxis
        stroke={AXIS_COLOR}
        tick={{ fill: MUTED_TEXT_COLOR, fontSize: 12 }}
        tickFormatter={formatAxisTick}
        width={Y_AXIS_WIDTH}
        tickLine={false}
      />
      <Legend />
      <Bar dataKey="income" name="수입" fill={INCOME_COLOR} radius={[3, 3, 0, 0]}>
        <LabelList dataKey="income" position="top" formatter={(v) => formatCompactWon(Number(v))} fontSize={10} fill={MUTED_TEXT_COLOR} />
      </Bar>
      <Bar dataKey="expense" name="지출" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]}>
        <LabelList dataKey="expense" position="top" formatter={(v) => formatCompactWon(Number(v))} fontSize={10} fill={MUTED_TEXT_COLOR} />
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
