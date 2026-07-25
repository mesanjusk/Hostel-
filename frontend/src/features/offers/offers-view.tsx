import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  OFFER_AUDIENCES,
  defaultAudienceForOccupation,
  type Audience,
} from "@/features/offers/offers-data";

const AUDIENCE_ORDER: Audience[] = ["student", "professional"];

export function OffersView() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience>(() =>
    defaultAudienceForOccupation(user?.occupation),
  );
  const [category, setCategory] = useState<string | "All">("All");

  const config = OFFER_AUDIENCES[audience];

  const offers = useMemo(
    () => (category === "All" ? config.offers : config.offers.filter((o) => o.category === category)),
    [config, category],
  );

  const filters: (string | "All")[] = ["All", ...config.categories];

  const selectAudience = (next: Audience) => {
    setAudience(next);
    // A category from the previous audience won't exist in the new one — reset so the grid
    // doesn't silently render empty.
    setCategory("All");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Audience toggle — defaults to the viewer's occupation, but either can browse the other. */}
      <div className="bg-muted flex w-fit gap-1 rounded-full p-1">
        {AUDIENCE_ORDER.map((option) => {
          const active = option === audience;
          return (
            <button
              key={option}
              type="button"
              onClick={() => selectAudience(option)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {OFFER_AUDIENCES[option].label}
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground -mt-2 text-sm">{config.description}</p>

      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        {filters.map((option) => {
          const active = option === category;
          const Icon = option === "All" ? undefined : CATEGORY_ICONS[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
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
                <span>{offer.access}</span>
              </p>
            </div>
          </a>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Offers, perks and eligibility change over time — always confirm the current terms on the
        brand's own page. Listing here isn't an endorsement.
      </p>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" asChild>
          <a
            href={
              audience === "student"
                ? "https://www.myunidays.com/IN/en-IN"
                : "https://www.linkedin.com/learning/"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {audience === "student" ? "Browse more on UNiDAYS" : "Explore more on LinkedIn Learning"}
          </a>
        </Button>
      </div>
    </div>
  );
}
