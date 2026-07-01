"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "accent" | "destructive";
  delay?: number;
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "primary", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="gap-3 p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-sm">{label}</p>
          {hint && <p className="text-muted-foreground/80 mt-1 text-xs">{hint}</p>}
        </div>
      </Card>
    </motion.div>
  );
}
