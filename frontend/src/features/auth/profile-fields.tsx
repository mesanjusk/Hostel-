import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import { Check, ChevronsUpDown, MapPin, School } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { GENDER_OPTIONS, type Gender } from "@/types";
import type { ProfileFieldsInput } from "@/features/auth/profile-fields-schema";
import {
  toCityOptionDTO,
  toCollegeCategoryDTO,
  toCollegeDTO,
  toCourseDTO,
  type CityOptionDTO,
  type CityOptionRaw,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
  type CollegeDTO,
  type CollegeRaw,
  type CourseDTO,
  type CourseRaw,
} from "@/features/auth/college-taxonomy-dto";

const OTHER_COLLEGE = "__other__";

/** cmdk's default `filter` is a fuzzy subsequence match (via `command-score`), not a substring
 * match — against the ~1000-entry city catalog (plain names plus a district-level import like
 * "Nagpur, Maharashtra") it happily surfaces cities whose letters merely appear in the right
 * order somewhere in the name, not ones that actually contain what was typed. Plain
 * case-insensitive "contains" is what a search box is expected to do here. */
const cityFilter: NonNullable<ComponentProps<typeof Command>["filter"]> = (value, search) =>
  value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;

/** Searchable city picker — the plain `Select` doesn't scale to the full Indian-city catalog,
 * so this swaps in a filterable command palette inside a popover instead. */
function CityCombobox({
  cities,
  value,
  onChange,
  placeholder,
}: {
  cities: CityOptionDTO[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Narrowing the search re-renders the list with fewer, shorter results, but the scrollable
  // list div keeps whatever scrollTop it already had — which the browser then clamps to the new,
  // much smaller scrollHeight, landing the view partway or fully down a list that should read
  // from the top. Reset on every keystroke and on open so it always starts at the top.
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: 0 });
  }, [open, search]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Clears the search alongside the close, not just the scroll position — cmdk's own
        // uncontrolled input used to reset itself for free by unmounting with the popover;
        // controlling it for the scroll fix above means this list would otherwise reopen
        // pre-filtered to whatever was last typed instead of the full list.
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="text-muted-foreground size-4 shrink-0" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command filter={cityFilter}>
          <CommandInput placeholder="Search city..." value={search} onValueChange={setSearch} />
          <CommandList ref={listRef}>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {cities.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value === c.name ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Gender selector — shared by the onboarding form (the only field it collects besides name)
 * and the full profile-edit form. Generic so both forms' distinct value types work without a
 * cast at the call site. */
export function GenderField<T extends { gender: Gender }>({ form }: { form: UseFormReturn<T> }) {
  const name = "gender" as FieldPath<T>;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Gender</FormLabel>
          <FormControl>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => field.onChange(g)}
                  className={cn(
                    "flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                    field.value === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary/50 bg-transparent",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** City + college category + college name, with the college shortlist cascading off city and
 * category. Shared by the full profile-edit form and the one-time Community profile-setup
 * dialog (where these fields are deferred from onboarding to first Community visit) — generic
 * over the host form's value type so each caller keeps its own narrower schema. */
export function CollegeFields<T extends { city: string; collegeCategoryId: string; college: string }>({
  form,
}: {
  form: UseFormReturn<T>;
}) {
  const cityName = "city" as FieldPath<T>;
  const collegeCategoryIdName = "collegeCategoryId" as FieldPath<T>;
  const collegeName = "college" as FieldPath<T>;

  const [categories, setCategories] = useState<CollegeCategoryDTO[]>([]);
  const [cities, setCities] = useState<CityOptionDTO[]>([]);
  const [colleges, setColleges] = useState<CollegeDTO[]>([]);
  const [collegesLoaded, setCollegesLoaded] = useState(false);
  const [collegeIsOther, setCollegeIsOther] = useState(false);
  const city = form.watch(cityName) as unknown as string;
  const collegeCategoryId = form.watch(collegeCategoryIdName) as unknown as string;

  useEffect(() => {
    api
      .get<{ collegeCategories: CollegeCategoryRaw[] }>("/api/college-categories")
      .then(({ collegeCategories }) => setCategories(collegeCategories.map(toCollegeCategoryDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load college categories"));
  }, []);

  useEffect(() => {
    api
      .get<{ cities: CityOptionRaw[] }>("/api/cities")
      .then(({ cities: raw }) => setCities(raw.map(toCityOptionDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load cities"));
  }, []);

  useEffect(() => {
    if (!city || !collegeCategoryId) {
      setColleges([]);
      setCollegesLoaded(false);
      return;
    }
    setCollegesLoaded(false);
    api
      .get<{ colleges: CollegeRaw[] }>(
        `/api/colleges?city=${encodeURIComponent(city)}&collegeCategoryId=${collegeCategoryId}`,
      )
      .then(({ colleges: raw }) => setColleges(raw.map(toCollegeDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load colleges"))
      .finally(() => setCollegesLoaded(true));
  }, [city, collegeCategoryId]);

  /** Reconciles the "Other" text-input toggle whenever the fetched shortlist changes — covers
   * both a fresh city/category pick (college gets cleared, so this resolves to "not other") and
   * loading an existing profile whose saved college isn't in the curated shortlist (resolves to
   * "other", pre-filling the text input instead of silently losing the value). Deliberately
   * doesn't depend on the college value itself, so it never fights the user while they're typing
   * a custom name or picking "Other" from the dropdown. */
  useEffect(() => {
    if (!collegesLoaded) return;
    const value = form.getValues(collegeName) as unknown as string;
    setCollegeIsOther(Boolean(value) && !colleges.some((c) => c.name === value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegesLoaded, colleges]);

  return (
    <>
      <FormField
        control={form.control}
        name={cityName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Destination City (Where you are moving)</FormLabel>
            <FormControl>
              <CityCombobox
                cities={cities}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  form.setValue(collegeName, "" as never);
                }}
                placeholder="Select your destination city"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={collegeCategoryIdName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>College category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue(collegeName, "" as never);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={collegeName}
        render={({ field }) => {
          const selectValue = !field.value ? "" : collegeIsOther ? OTHER_COLLEGE : field.value;
          const disabled = !city || !collegeCategoryId;
          return (
            <FormItem>
              <FormLabel>College name</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <Select
                    value={selectValue}
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === OTHER_COLLEGE) {
                        setCollegeIsOther(true);
                        field.onChange("");
                      } else {
                        setCollegeIsOther(false);
                        field.onChange(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <School className="text-muted-foreground size-4" />
                      <SelectValue
                        placeholder={disabled ? "Pick a city and category first" : "Select your college"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={OTHER_COLLEGE}>Other (not listed)</SelectItem>
                    </SelectContent>
                  </Select>
                  {collegeIsOther && (
                    <div className="relative">
                      <School className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                      <Input className="pl-11" placeholder="Enter your college name" {...field} />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </>
  );
}

/** Full profile-edit field set: gender, city/category/college, plus the voluntary course and
 * home town fields that only ever appear on the profile-edit form (see profile-view.tsx). */
export function ProfileFields({ form }: { form: UseFormReturn<ProfileFieldsInput> }) {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [cities, setCities] = useState<CityOptionDTO[]>([]);
  const collegeCategoryId = form.watch("collegeCategoryId");

  useEffect(() => {
    if (!collegeCategoryId) {
      setCourses([]);
      return;
    }
    api
      .get<{ courses: CourseRaw[] }>(`/api/courses?collegeCategoryId=${collegeCategoryId}`)
      .then(({ courses: raw }) => setCourses(raw.map(toCourseDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load courses"));
  }, [collegeCategoryId]);

  useEffect(() => {
    api
      .get<{ cities: CityOptionRaw[] }>("/api/cities")
      .then(({ cities: raw }) => setCities(raw.map(toCityOptionDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load cities"));
  }, []);

  return (
    <>
      <GenderField form={form} />
      <CollegeFields form={form} />
      <FormField
        control={form.control}
        name="courseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} disabled={!collegeCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={collegeCategoryId ? "Select a course" : "Pick a category first"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="homeTown"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Home town</FormLabel>
            <FormControl>
              <CityCombobox
                cities={cities}
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Select your home town"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
