"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Pencil, PiggyBank, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EntryFormDialog } from "@/features/budget/entry-form-dialog";
import { deleteBudgetEntryAction } from "@/actions/budget";
import type { BudgetEntryDTO } from "@/features/budget/budget-dto";
import type { BudgetEntryType } from "@/types";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface BudgetSummary {
  planned: number;
  spent: number;
  remaining: number;
  byCategory: Record<string, number>;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

type FilterValue = "all" | BudgetEntryType;

export function BudgetView({
  initialEntries,
  summary,
}: {
  initialEntries: BudgetEntryDTO[];
  summary: BudgetSummary;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<FilterValue>("all");

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  const chartData = useMemo(
    () =>
      Object.entries(summary.byCategory).map(([category, amount]) => ({
        category,
        amount,
      })),
    [summary.byCategory],
  );

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const result = await deleteBudgetEntryAction(id);
    if (!result.success) toast.error(result.error);
  }

  const summaryCards = [
    {
      label: "Planned Budget",
      value: formatCurrency(summary.planned),
      valueClassName: "",
    },
    {
      label: "Spent",
      value: formatCurrency(summary.spent),
      valueClassName: "",
    },
    {
      label: "Remaining",
      value: formatCurrency(summary.remaining),
      valueClassName: summary.remaining < 0 ? "text-destructive" : "text-success",
    },
    {
      label: "Entries",
      value: entries.length.toLocaleString("en-IN"),
      valueClassName: "",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Budget & Expenses"
        description="Track what you planned to spend versus what you actually spent"
        action={<EntryFormDialog />}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budget entries yet"
          description="Add a planned budget or log an expense to start tracking your spending."
          action={<EntryFormDialog />}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="gap-2 p-5">
                  <p className="text-muted-foreground text-sm">{card.label}</p>
                  <p className={`font-display text-2xl font-bold ${card.valueClassName}`}>
                    {card.value}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <EmptyState
                  icon={PiggyBank}
                  title="No expenses logged yet"
                  description="Log an expense to see your spending breakdown by category."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={entry.category}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
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
              )}
            </CardContent>
          </Card>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="p-0">
            {filteredEntries.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Wallet} title="No entries in this view" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.type === "planned" ? "secondary" : "accent"}>
                          {entry.type === "planned" ? "Planned" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>{format(new Date(entry.date), "d MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <EntryFormDialog
                            entry={entry}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-7">
                                <Pencil className="size-3.5" />
                              </Button>
                            }
                          />
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="size-7">
                                <Trash2 className="size-3.5" />
                              </Button>
                            }
                            title="Delete this entry?"
                            description="This can't be undone."
                            onConfirm={() => handleDelete(entry.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
