import { cn } from "@/lib/utils";

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold", className)}>
      Pack{" "}
      <span className="font-cursive text-primary italic font-normal">with</span> Me
    </span>
  );
}
