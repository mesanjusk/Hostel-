import { cn } from "@/lib/utils";
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted relative overflow-hidden rounded-lg", className)}
      {...props}
    >
      <div className="shimmer-bg absolute inset-0" />
    </div>
  );
}

export { Skeleton };
