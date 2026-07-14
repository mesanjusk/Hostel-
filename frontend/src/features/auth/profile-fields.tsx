import type { UseFormReturn } from "react-hook-form";
import { School } from "lucide-react";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";
import type { ProfileFieldsInput } from "@/features/auth/profile-fields-schema";

/** Gender + college name + college category — shared by the onboarding form and the
 * profile-edit form so both stay in sync and short/quick to fill. */
export function ProfileFields({ form }: { form: UseFormReturn<ProfileFieldsInput> }) {
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
        name="collegeCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>College category</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {COLLEGE_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
