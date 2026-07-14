import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { School } from "lucide-react";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { ProfileFieldsInput } from "@/features/auth/profile-fields-schema";

type EducationCategory = { _id: string; name: string };
type EducationCourse = { _id: string; collegeCategoryId: string; name: string };

export function ProfileFields({ form }: { form: UseFormReturn<ProfileFieldsInput> }) {
  const [categories, setCategories] = useState<EducationCategory[]>([]);
  const [courses, setCourses] = useState<EducationCourse[]>([]);
  const selectedCategoryId = form.watch("collegeCategoryId");

  useEffect(() => {
    api.get<{ categories: EducationCategory[]; courses: EducationCourse[] }>("/api/auth/education-options").then((data) => {
      setCategories(data.categories);
      setCourses(data.courses);
    });
  }, []);

  const filteredCourses = useMemo(
    () => courses.filter((course) => !selectedCategoryId || course.collegeCategoryId === selectedCategoryId),
    [courses, selectedCategoryId],
  );

  return (
    <>
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
                  const category = categories.find((c) => c._id === value);
                  field.onChange(value);
                  form.setValue("collegeCategory", category?.name ?? "");
                  form.setValue("course", "");
                  form.setValue("courseId", undefined);
                }}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="courseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const course = courses.find((c) => c._id === value);
                  field.onChange(value);
                  form.setValue("course", course?.name ?? "");
                }}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>{filteredCourses.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
