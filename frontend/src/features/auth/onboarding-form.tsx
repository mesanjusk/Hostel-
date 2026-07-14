import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { HOME_ROUTE } from "@/lib/nav-items";
import { ProfileFields } from "@/features/auth/profile-fields";
import { profileFieldsSchema, type ProfileFieldsInput } from "@/features/auth/profile-fields-schema";

export function OnboardingForm() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFieldsInput>({
    resolver: zodResolver(profileFieldsSchema),
    defaultValues: { name: "", gender: undefined, college: "", collegeCategory: undefined },
  });

  async function onSubmit(values: ProfileFieldsInput) {
    setIsSubmitting(true);
    try {
      await completeOnboarding(values);
      toast.success("Welcome to Pack with Me!");
      navigate(HOME_ROUTE, { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl"
    >
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold">Let&apos;s set you up</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Just a couple of details to personalize your dashboard
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                    <Input className="pl-11" placeholder="Aditi Sharma" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ProfileFields form={form} />
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Enter Pack with Me
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
