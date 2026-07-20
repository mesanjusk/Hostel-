import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { CityCombobox, CollegeFields } from "@/features/auth/profile-fields";
import { communitySetupFieldsSchema, type CommunitySetupFieldsInput } from "@/features/auth/profile-fields-schema";
import { toCityOptionDTO, type CityOptionDTO, type CityOptionRaw } from "@/features/auth/college-taxonomy-dto";

/**
 * Progressive profiling, one field at a time: instead of blocking Explore/Know Your Campus
 * behind the full profile-edit form, each page prompts inline for just the one or two fields
 * it actually needs and saves them straight away via PATCH /api/profile/quick — which works for
 * a still-anonymous visitor exactly as well as an identified one (see profile.routes.ts). This
 * is deliberately not a single big form: a visitor who never opens Explore is never asked for a
 * city at all.
 */

function useCities() {
  const [cities, setCities] = useState<CityOptionDTO[]>([]);
  useEffect(() => {
    api
      .get<{ cities: CityOptionRaw[] }>("/api/cities")
      .then(({ cities: raw }) => setCities(raw.map(toCityOptionDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load cities"));
  }, []);
  return cities;
}

/** Explore only needs a destination city — everything else about the visitor is irrelevant to
 * "places near me". */
export function CityQuickPrompt({ onSaved }: { onSaved?: (city: string) => void }) {
  const { refreshUser } = useAuth();
  const cities = useCities();
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!city.trim()) return;
    setSaving(true);
    try {
      await api.patch("/api/profile/quick", { city });
      await refreshUser();
      onSaved?.(city);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Which city are you exploring?</CardTitle>
        <CardDescription>We'll show places to explore there. You can change this anytime.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CityCombobox cities={cities} value={city} onChange={setCity} placeholder="Select your city" />
        <Button type="button" onClick={handleSave} disabled={!city.trim() || saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

/** Know Your Campus needs the fuller city + category + college trio (same shape the one-time
 * Community profile-setup prompt collects — see community-profile-setup-dialog.tsx) to know
 * which campus's tips to show. */
export function CollegeQuickPrompt({ onSaved }: { onSaved?: (college: string, city: string) => void }) {
  const { refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CommunitySetupFieldsInput>({
    resolver: zodResolver(communitySetupFieldsSchema),
    defaultValues: { college: "", collegeCategoryId: "", city: "" },
  });

  async function onSubmit(values: CommunitySetupFieldsInput) {
    setSubmitting(true);
    try {
      await api.patch("/api/profile/quick", values);
      await refreshUser();
      onSaved?.(values.college, values.city);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't save that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Which campus are you at?</CardTitle>
        <CardDescription>We'll show what students there are sharing. You can change this anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <CollegeFields form={form} />
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
