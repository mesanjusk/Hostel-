import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { MapPin, School } from "lucide-react";
import { toast } from "sonner";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { GENDER_OPTIONS } from "@/types";
import type { ProfileFieldsInput } from "@/features/auth/profile-fields-schema";
import {
  toCityOptionDTO,
  toCollegeCategoryDTO,
  toCourseDTO,
  type CityOptionDTO,
  type CityOptionRaw,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
  type CourseDTO,
  type CourseRaw,
} from "@/features/auth/college-taxonomy-dto";

/** Gender + college name + college category + city (+ course/home town on the profile-edit
 * form) — shared by the onboarding form and the profile-edit form so both stay in sync.
 * Category/course/city all come from admin-managed catalogs (no hardcoded lists) and course
 * cascades off category. Course isn't collected at registration — it's a voluntary field the
 * user fills in later from their profile — so it (and home town) only render when
 * `variant="profile"`. */
export function ProfileFields({
  form,
  variant = "onboarding",
}: {
  form: UseFormReturn<ProfileFieldsInput>;
  variant?: "onboarding" | "profile";
}) {
  const [categories, setCategories] = useState<CollegeCategoryDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [cities, setCities] = useState<CityOptionDTO[]>([]);
  const collegeCategoryId = form.watch("collegeCategoryId");
  const showCourse = variant === "profile";

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
    if (!showCourse || !collegeCategoryId) {
      setCourses([]);
      return;
    }
    api
      .get<{ courses: CourseRaw[] }>(`/api/courses?collegeCategoryId=${collegeCategoryId}`)
      .then(({ courses: raw }) => setCourses(raw.map(toCourseDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load courses"));
  }, [showCourse, collegeCategoryId]);

  return (
    <>
      <FormField
        control={form.control}
        name="gender"
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
      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <MapPin className="text-muted-foreground size-4" />
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
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
        name="college"
        render={({ field }) => (
          <FormItem>
            <FormLabel>College name</FormLabel>
            <FormControl>
              <div className="relative">
                <School className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                <Input className="pl-11" placeholder="IIT Bombay" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="collegeCategoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>College category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("courseId", "");
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
      {showCourse && (
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
      )}
      {variant === "profile" && (
        <FormField
          control={form.control}
          name="homeTown"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home town</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <MapPin className="text-muted-foreground size-4" />
                    <SelectValue placeholder="Select your home town" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
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
      )}
    </>
  );
}
