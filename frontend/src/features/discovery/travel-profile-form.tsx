import { useEffect, useState } from "react";
import { useForm, type DefaultValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { ACCOMMODATION_TYPES, GENDER_OPTIONS } from "@/types";
import { toTravelProfileDTO, type TravelProfileDTO, type TravelProfileRaw } from "@/features/discovery/discovery-dto";

/** A required rupee amount. `z.coerce.number()` alone won't do: an empty input arrives as "",
 * and Number("") is 0 — so a student who skipped the field would silently be saved as
 * budgeting ₹0 rather than being asked for it. Mapping blank to undefined first keeps a
 * deliberate 0 valid while still catching the empty case. */
const budgetField = (message: string) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number({ error: message }).min(0, message));

const travelProfileSchema = z
  .object({
    currentCity: z.string().trim().min(1, "Enter your current city").max(80),
    destinationCity: z.string().trim().min(1, "Enter your destination city").max(80),
    travelMonth: z.string().trim().regex(/^\d{4}-\d{2}$/, "Pick a month"),
    arrivalDate: z.string().optional(),
    college: z.string().trim().max(120).optional(),
    // Required — roommate matching won't show anyone without these (see findRoommates).
    budgetMin: budgetField("Enter your minimum budget"),
    budgetMax: budgetField("Enter your maximum budget"),
    accommodationType: z.string().trim().min(1, "Pick an accommodation type"),
    genderPreference: z.string().trim().min(1, "Pick a gender preference"),
    ageRangeMin: z.coerce.number().min(16).max(100).optional(),
    ageRangeMax: z.coerce.number().min(16).max(100).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    lifestyleTags: z.array(z.string()).optional(),
    hideProfile: z.boolean(),
    onlyShowVerified: z.boolean(),
    onlyShowSameGender: z.boolean(),
  })
  .refine((v) => v.budgetMax >= v.budgetMin, {
    message: "Max budget can't be less than the minimum",
    path: ["budgetMax"],
  });

type FormInput = z.infer<typeof travelProfileSchema>;

function toLines(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export function TravelProfileForm({ onSaved }: { onSaved?: (profile: TravelProfileDTO) => void }) {
  const [profile, setProfile] = useState<TravelProfileDTO | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>("/api/discovery/profile")
      .then(({ profile }) => setProfile(toTravelProfileDTO(profile)))
      .catch(() => setProfile(toTravelProfileDTO(null)))
      .finally(() => setLoaded(true));
  }, []);

  /** DefaultValues, not FormInput: budget is required in the parsed output, but a profile that
   * hasn't set one has to start the field *empty* so the student is asked for it — seeding 0
   * would both look like an answer and quietly pass validation. */
  function buildDefaults(): DefaultValues<FormInput> {
    return {
      currentCity: profile?.currentCity ?? "",
      destinationCity: profile?.destinationCity ?? "",
      travelMonth: profile?.travelMonth ?? "",
      arrivalDate: profile?.arrivalDate?.slice(0, 10) ?? "",
      college: profile?.college ?? "",
      budgetMin: profile?.budgetMin ?? undefined,
      budgetMax: profile?.budgetMax ?? undefined,
      // Empty rather than a sentinel: accommodation type is required now, so an unset one has
      // to fail validation and show the placeholder, not quietly mean "Any".
      accommodationType: profile?.accommodationType ?? "",
      genderPreference: profile?.genderPreference ?? "Any",
      ageRangeMin: profile?.ageRangeMin ?? undefined,
      ageRangeMax: profile?.ageRangeMax ?? undefined,
      interests: profile?.interests ?? [],
      languages: profile?.languages ?? [],
      lifestyleTags: profile?.lifestyleTags ?? [],
      hideProfile: profile?.visibility.hideProfile ?? false,
      onlyShowVerified: profile?.visibility.onlyShowVerified ?? false,
      onlyShowSameGender: profile?.visibility.onlyShowSameGender ?? false,
    };
  }

  const form = useForm<FormInput>({
    resolver: zodResolver(travelProfileSchema) as Resolver<FormInput>,
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    if (loaded) form.reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, profile]);

  async function onSubmit(values: FormInput) {
    setIsSubmitting(true);
    try {
      const { profile: saved } = await api.put<{ profile: TravelProfileRaw }>("/api/discovery/profile", {
        ...values,
        visibility: {
          hideProfile: values.hideProfile,
          onlyShowVerified: values.onlyShowVerified,
          onlyShowSameGender: values.onlyShowSameGender,
        },
      });
      const dto = toTravelProfileDTO(saved);
      setProfile(dto);
      toast.success("Discovery profile saved");
      onSaved?.(dto);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My travel profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="currentCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current city</FormLabel>
                    <FormControl>
                      <Input placeholder="Nagpur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination city</FormLabel>
                    <FormControl>
                      <Input placeholder="Pune" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="travelMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel month</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrivalDate"
                render={({ field }) => (
                  <FormItem>
                    {/* No longer "for roommate matching" — roomie matching ignores dates
                        entirely now. It only shows on your Co-Packer card. */}
                    <FormLabel>Arrival date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="budgetMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget min (₹/mo)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget max (₹/mo)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pick one" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOMMODATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="genderPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender preference</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageRangeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age min</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageRangeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age max</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests (comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        value={field.value?.join(", ") ?? ""}
                        onChange={(e) => field.onChange(toLines(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        value={field.value?.join(", ") ?? ""}
                        onChange={(e) => field.onChange(toLines(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lifestyleTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lifestyle tags</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        value={field.value?.join(", ") ?? ""}
                        onChange={(e) => field.onChange(toLines(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <p className="text-muted-foreground text-sm font-medium">Privacy settings</p>
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="hideProfile"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <FormLabel>Hide my profile from discovery</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="onlyShowVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <FormLabel>Only show my profile to verified users</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="onlyShowSameGender"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                    <FormLabel>Only show my profile to my own gender</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
