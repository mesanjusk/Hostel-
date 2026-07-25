import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemePicker } from "@/components/settings/theme-picker";
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
import { AvatarUploadField } from "@/features/auth/avatar-upload-field";
import { onboardingNameSchema, type OnboardingNameInput } from "@/features/auth/profile-fields-schema";

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatar, setAvatar] = useState("");

  const form = useForm<OnboardingNameInput>({
    resolver: zodResolver(onboardingNameSchema),
    defaultValues: {
      name: defaultName ?? "",
    },
  });

  async function onSubmit(values: OnboardingNameInput) {
    // Gender is intentionally not collected here anymore — it's asked lazily the first time the
    // student opens a gender-personalized page (Checklist / Survival Guide / Find a Roomie), see
    // RequireGenderRoute. Onboarding is now just name (+ optional avatar and color theme).
    setIsSubmitting(true);
    try {
      await completeOnboarding({ ...values, avatar: avatar || undefined });
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
      className="glass w-full max-w-md rounded-[2rem] p-8 shadow-[0_25px_60px_-20px_var(--shadow-brand)]"
    >
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold">What should we call you?</h1>
        <p className="text-muted-foreground mt-1 text-sm">Just your name to get started — you can fill in the rest later</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <AvatarUploadField
            value={avatar}
            onChange={setAvatar}
            fallback={(form.watch("name") || defaultName || "?").slice(0, 1).toUpperCase()}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                    <Input className="pl-11" placeholder="Enter your name" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional "Pick your vibe" — the color theme is a purely cosmetic, reversible choice
              (stored per-device, changeable anytime in Settings), so it lives inline here rather
              than gating the flow. Selecting a card repaints the app instantly; skipping it just
              keeps the default (Blossom). No gender is collected or implied by this. */}
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-sm leading-none font-medium">Pick your vibe</span>
              <p className="text-muted-foreground mt-1 text-xs">
                Choose a color theme — totally optional, change it anytime in Settings.
              </p>
            </div>
            <ThemePicker className="mt-1" />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Enter Pack with Me ✨
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
