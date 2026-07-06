import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center"
    >
      <div className="gradient-brand flex size-14 items-center justify-center rounded-2xl opacity-90 shadow-lg shadow-primary/20">
        <Icon className="size-7 text-white" />
      </div>
      <p className="font-display font-semibold">{title}</p>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action}
    </motion.div>
  );
}
