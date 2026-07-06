import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, User, School, Building2, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  hostel: z.string().trim().max(120).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

type OnboardingInput = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: "", college: "", hostel: "", roomNumber: "" },
  });

  async function onSubmit(values: OnboardingInput) {
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
          <FormField
            control={form.control}
            name="college"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College</FormLabel>
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hostel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostel</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                      <Input className="pl-11" placeholder="Hostel 7" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DoorOpen className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                      <Input className="pl-11" placeholder="212" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Enter Pack with Me
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
