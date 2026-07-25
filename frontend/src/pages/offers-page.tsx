import { PageHeader } from "@/components/shared/page-header";
import { OffersView } from "@/features/offers/offers-view";

/** A curated board of discounts and perks available in India, split by audience: student offers
 * and working-professional perks. Static reference content — every card links out to the brand's
 * official page, which stays the source of truth for current terms and eligibility (see
 * offers-data.ts). Open to everyone; the view defaults to the viewer's occupation but lets either
 * browse the other, so it's no longer gated behind occupation. */
export default function OffersPage() {
  return (
    <div>
      <PageHeader
        title="Offers & Perks"
        description="Discounts, free tools and perks you can actually use in India"
      />
      <OffersView />
    </div>
  );
}
