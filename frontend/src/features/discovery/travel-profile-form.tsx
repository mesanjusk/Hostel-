import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, type DefaultValues, type Resolver, type UseFormReturn } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
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
    // Optional — only destination city is required to be discoverable (see findCoPackers,
    // which widens to a destination-only match once this is unset).
    currentCity: z.string().trim().max(80).optional(),
    destinationCity: z.string().trim().min(1, "Enter your destination city").max(80),
    college: z.string().trim().max(120).optional(),
    // Required — roommate matching won't show anyone without these (see findRoommates).
    budgetMin: budgetField("Enter your minimum budget"),
    budgetMax: budgetField("Enter your maximum budget"),
    // Both default to "Any", so neither can actually arrive empty — these guard against a
    // hand-rolled request, not against the form.
    accommodationType: z.string().trim().min(1, "Pick an accommodation type"),
    genderPreference: z.string().trim().min(1, "Pick a gender preference"),
    ageRangeMin: z.coerce.number().min(16).max(100).optional(),
    ageRangeMax: z.coerce.number().min(16).max(100).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    lifestyleTags: z.array(z.string()).optional(),
    hideProfile: z.boolean(),
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

/** A field this form only displays — the value always comes from the account profile (Profile
 * page) and can't be edited here, so there's nothing to type. Used for destinationCity,
 * currentCity ("Hometown") and college, all three of which used to be freely editable here and
 * could drift from the account's actual profile. */
function FrozenProfileField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<FormInput>;
  name: "destinationCity" | "currentCity" | "college";
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} disabled />
          </FormControl>
          <p className="text-muted-foreground text-xs">
            {field.value ? "Set from your account profile." : "Not set yet."}{" "}
            <Link to="/profile" className="text-primary underline">
              Change it in Profile
            </Link>
            .
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** @param divided - Draws a rule above the heading. Skip it on the first section, where there's
 * nothing to divide from. */
function SectionHeading({ title, hint, divided }: { title: string; hint: string; divided?: boolean }) {
  return (
    <div className={divided ? "border-border/60 mt-2 flex flex-col gap-0.5 border-t pt-5" : "flex flex-col gap-0.5"}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

/** DefaultValues, not FormInput: budget is required in the parsed output, but a profile that
 * hasn't set one has to start the field *empty* so the student is asked for it — seeding 0
 * would both look like an answer and quietly pass validation.
 *
 * @param registeredCity - The account's destination city (`User.city`, set on the Profile page).
 * @param registeredCollege - The account's registered college (`User.college`).
 * @param registeredHomeTown - The account's home town (`User.homeTown`) — shown here as
 * "Hometown".
 *
 * All three always win over whatever's on the saved travel profile: destinationCity, college
 * and currentCity/"Hometown" are frozen fields here, only editable on the Profile page, so a
 * stale value saved on an old travel profile can never linger after the account changes. */
function buildDefaults(
  profile: TravelProfileDTO | null,
  registeredCity: string | null,
  registeredCollege: string | null,
  registeredHomeTown: string | null,
): DefaultValues<FormInput> {
  return {
    currentCity: registeredHomeTown ?? "",
    destinationCity: registeredCity ?? "",
    college: registeredCollege ?? "",
    budgetMin: profile?.budgetMin ?? undefined,
    budgetMax: profile?.budgetMax ?? undefined,
    // "Any" rather than blank, matching genderPreference below and the model's own default:
    // not stating a preference is itself an answer here, and the commonest one.
    accommodationType: profile?.accommodationType ?? "Any",
    genderPreference: profile?.genderPreference ?? "Any",
    ageRangeMin: profile?.ageRangeMin ?? undefined,
    ageRangeMax: profile?.ageRangeMax ?? undefined,
    interests: profile?.interests ?? [],
    languages: profile?.languages ?? [],
    lifestyleTags: profile?.lifestyleTags ?? [],
    hideProfile: profile?.visibility.hideProfile ?? false,
    onlyShowSameGender: profile?.visibility.onlyShowSameGender ?? false,
  };
}

/** Fetches first and only then mounts the form, so `useForm` is seeded with the real profile
 * once and never reset underneath a live field.
 *
 * That split is load-bearing, not tidiness. Mounting on placeholders and calling `form.reset`
 * when the fetch lands silently wiped whichever Select the reset actually changed: Radix
 * responds to a changed value by force-setting its hidden native <select> and dispatching a
 * change event, and if the option list hasn't registered yet the select falls back to "" —
 * which the event then writes straight back into the form. Gender preference survived only
 * because its placeholder and its saved value were both "Any", so nothing ever changed. */
export function TravelProfileForm({ onSaved }: { onSaved?: (profile: TravelProfileDTO) => void }) {
  const [profile, setProfile] = useState<TravelProfileDTO | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>("/api/discovery/profile")
      .then(({ profile }) => setProfile(toTravelProfileDTO(profile)))
      .catch(() => setProfile(toTravelProfileDTO(null)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;
  return <TravelProfileFields profile={profile} onSaved={onSaved} />;
}

function TravelProfileFields({
  profile,
  onSaved,
}: {
  profile: TravelProfileDTO | null;
  onSaved?: (profile: TravelProfileDTO) => void;
}) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(travelProfileSchema) as Resolver<FormInput>,
    defaultValues: buildDefaults(profile, user?.city ?? null, user?.college ?? null, user?.homeTown ?? null),
  });

  // Keeps the three frozen fields current if the account changes (Profile page) while this
  // form is already mounted, rather than only picking it up on the next fresh load.
  useEffect(() => {
    form.setValue("destinationCity", user?.city ?? "");
    form.setValue("currentCity", user?.homeTown ?? "");
    form.setValue("college", user?.college ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.homeTown, user?.college]);

  async function onSubmit(values: FormInput) {
    setIsSubmitting(true);
    try {
      const { profile: saved } = await api.put<{ profile: TravelProfileRaw }>("/api/discovery/profile", {
        ...values,
        visibility: {
          hideProfile: values.hideProfile,
          onlyShowSameGender: values.onlyShowSameGender,
        },
      });
      toast.success("Discovery profile saved");
      onSaved?.(toTravelProfileDTO(saved));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <SectionHeading
              title="Required"
              hint="Roomie matching only suggests people you line up with on every one of these."
            />

            <FrozenProfileField form={form} name="destinationCity" label="Destination city" />

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="accommodationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accommodation type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Any">Any</SelectItem>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SectionHeading
              title="Optional"
              hint="Used to rank your matches and narrow them down. Leave anything blank if you'd rather not say."
              divided
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FrozenProfileField form={form} name="currentCity" label="Hometown" />
              <FrozenProfileField form={form} name="college" label="College" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

            <SectionHeading
              title="Privacy"
              hint="Who gets to see your profile in Find a Roomie and Discover."
              divided
            />
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
