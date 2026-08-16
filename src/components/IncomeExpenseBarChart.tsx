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

  // recharts centers the Legend over the chart's margin box, but only the
  // left YAxis eats into that box — so the plot (bars/XAxis) sits visibly
  // right of the Legend's center. Margins can't fix this (both the Legend
  // and the plot read off the same margin box), so a second, invisible
  // YAxis on the right nudges the plot back toward that center. It only
  // needs to mirror the left axis's non-text breathing-room gap, not the
  // tick-label text ("100만" etc.) — the right side has no labels to make
  // room for.
  const Y_AXIS_TEXT_WIDTH = 36;
  const Y_AXIS_GAP = 4;
  const Y_AXIS_WIDTH = Y_AXIS_TEXT_WIDTH + Y_AXIS_GAP;
  const MIRROR_AXIS_WIDTH = 12;
  const marginLeft = 8;

  const chart = (
    <BarChart
      data={data}
      margin={{ top: 16, right: marginLeft, left: marginLeft, bottom: 0 }}
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
      <YAxis
        yAxisId="mirror"
        orientation="right"
        width={MIRROR_AXIS_WIDTH}
        tick={false}
        axisLine={false}
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
