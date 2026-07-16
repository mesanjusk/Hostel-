import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Pencil, PiggyBank, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import {
  toBudgetEntryDTO,
  type BudgetEntryDTO,
  type BudgetEntryRaw,
  type BudgetSummary,
} from "@/features/budget/budget-dto";
import type { BudgetEntryType } from "@/types";

// Deferred: recharts is ~94 KB gzip and only powers the breakdown chart — splitting it out
// lets the page shell (summary cards, entries table) render while the chart streams in.
const ExpensePieChart = lazy(() =>
  import("@/features/budget/expense-pie-chart").then((m) => ({ default: m.ExpensePieChart })),
);

const EMPTY_SUMMARY: BudgetSummary = { planned: 0, spent: 0, remaining: 0, byCategory: {} };

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

type FilterValue = "all" | BudgetEntryType;

export function BudgetView() {
  const [entries, setEntries] = useState<BudgetEntryDTO[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  async function fetchData() {
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        api.get<{ entries: BudgetEntryRaw[] }>("/api/budget"),
        api.get<{ summary: BudgetSummary }>("/api/budget/summary"),
      ]);
      setEntries(entriesRes.entries.map(toBudgetEntryDTO));
      setSummary(summaryRes.summary);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load budget");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

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
    try {
      await api.delete(`/api/budget/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete entry");
      fetchData();
    }
  }

  const summaryCards = [
    { label: "Planned Budget", value: formatCurrency(summary.planned), valueClassName: "" },
    { label: "Spent", value: formatCurrency(summary.spent), valueClassName: "" },
    {
      label: "Remaining",
      value: formatCurrency(summary.remaining),
      valueClassName: summary.remaining < 0 ? "text-destructive" : "text-success",
    },
    { label: "Entries", value: entries.length.toLocaleString("en-IN"), valueClassName: "" },
  ];

  return (
    <div>
      <PageHeader
        title="Budget & Expenses"
        description="Track what you planned to spend versus what you actually spent"
      />

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budget entries yet"
          description="Tap the + button below to add a planned budget or log an expense."
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
                <Suspense fallback={<Skeleton className="h-[280px] w-full rounded-xl" />}>
                  <ExpensePieChart data={chartData} />
                </Suspense>
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
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Edit entry">
                                <Pencil className="size-3.5" />
                              </Button>
                            }
                          />
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Delete entry">
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
