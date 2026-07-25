import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  STUDENT_OFFERS,
  STUDENT_OFFER_CATEGORIES,
  type StudentOfferCategory,
} from "@/features/offers/student-offers-data";

type Filter = StudentOfferCategory | "All";

const FILTERS: Filter[] = ["All", ...STUDENT_OFFER_CATEGORIES];

export function StudentOffersView() {
  const [filter, setFilter] = useState<Filter>("All");

  const offers = useMemo(
    () => (filter === "All" ? STUDENT_OFFERS : STUDENT_OFFERS.filter((o) => o.category === filter)),
    [filter],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        {FILTERS.map((option) => {
          const active = option === filter;
          const Icon = option === "All" ? undefined : CATEGORY_ICONS[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {option}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <a
            key={offer.id}
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card text-card-foreground border-border/60 hover:border-primary/40 flex flex-col gap-3 rounded-xl border p-5 shadow-sm shadow-black/[0.02] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <offer.icon className="size-5" />
              </div>
              <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-display leading-tight font-semibold">{offer.brand}</h3>
              <p className="text-muted-foreground text-sm">{offer.offer}</p>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-1">
              <Badge variant="outline" className="w-fit">
                {offer.category}
              </Badge>
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <BadgeCheck className="text-success mt-px size-3.5 shrink-0" />
                <span>{offer.verification}</span>
              </p>
            </div>
          </a>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Offers, discounts and eligibility change over time — always confirm the current terms on
        the brand's own page. Listing here isn't an endorsement.
      </p>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://www.myunidays.com/IN/en-IN"
            target="_blank"
            rel="noopener noreferrer"
          >
            Browse more on UNiDAYS
          </a>
        </Button>
      </div>
    </div>
  );
}
