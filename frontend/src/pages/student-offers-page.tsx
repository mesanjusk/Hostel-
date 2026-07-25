import { PageHeader } from "@/components/shared/page-header";
import { StudentOffersView } from "@/features/offers/student-offers-view";

/** A curated board of student discounts and free-for-students programs available in India.
 * Static reference content — every card links out to the brand's official page, which stays the
 * source of truth for current terms and eligibility (see student-offers-data.ts). Open to every
 * visitor; it's useful to students and working professionals alike who are still studying or
 * upskilling, so it isn't gated behind occupation. */
export default function StudentOffersPage() {
  return (
    <div>
      <PageHeader
        title="Student Offers"
        description="Discounts and free-for-students programs you can use in India"
      />
      <StudentOffersView />
    </div>
  );
}
