import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { CampusTipsView } from "@/features/campus/campus-tips-view";
import { CollegeQuickPrompt } from "@/features/auth/quick-profile-prompts";

/** Missing city/college no longer sends the visitor off to a full profile-edit form — they're
 * prompted in place for just those fields (see quick-profile-prompts.tsx), which works the same
 * for a still-anonymous visitor as for an identified one. */
export default function KnowYourCampusPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const city = user?.city?.trim() ?? "";
  const college = user?.college?.trim() ?? "";

  return (
    <div>
      <PageHeader
        title="Know Your Campus"
        description={college ? `Share your experience in and around ${college} campus` : "Share your experience in and around campus"}
      />
      {city && college ? <CampusTipsView college={college} /> : <CollegeQuickPrompt />}
    </div>
  );
}
