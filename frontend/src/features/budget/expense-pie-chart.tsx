import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Loaded lazily from budget-view: recharts is ~94 KB gzip, so keeping this component (the
// only recharts consumer on the page) in its own chunk lets the budget page shell render
// while the chart library streams in behind it.

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function ExpensePieChart({ data }: { data: Array<{ category: string; amount: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value?: number | string | ReadonlyArray<number | string>) =>
            formatCurrency(Number(value ?? 0))
          }
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
