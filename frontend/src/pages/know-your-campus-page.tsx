import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { CampusTipsView } from "@/features/campus/campus-tips-view";

export default function KnowYourCampusPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const city = user?.city?.trim() ?? "";
  const college = user?.college?.trim() ?? "";

  return (
    <div>
      <PageHeader title="Know Your Campus" description="Share your experience in and around campus" />
      {city && college ? (
        <CampusTipsView city={city} college={college} />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Set your college"
          description="Add your city and college in your profile and we'll show what students there are sharing."
          action={
            <Button asChild size="sm">
              <Link to="/profile">Complete profile</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
