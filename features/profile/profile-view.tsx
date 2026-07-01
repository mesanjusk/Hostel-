"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Loader2,
  User,
  School,
  Building2,
  DoorOpen,
  ImageIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/profile";
import { setNotificationPreferenceAction, updateProfileAction } from "@/actions/profile";
import type { ProfileDTO } from "@/app/(dashboard)/profile/page";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ProfileView({ profile }: { profile: ProfileDTO }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.notificationsEnabled,
  );

  useEffect(() => setMounted(true), []);

  const initials = (profile.name ?? profile.mobile.slice(-2)).slice(0, 2).toUpperCase();

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name ?? "",
      college: profile.college ?? "",
      hostel: profile.hostel ?? "",
      roomNumber: profile.roomNumber ?? "",
      avatar: profile.avatar ?? "",
    },
  });

  async function onSubmit(values: ProfileUpdateInput) {
    setIsSubmitting(true);
    const result = await updateProfileAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  async function handleNotificationToggle(checked: boolean) {
    setNotificationsEnabled(checked);
    const result = await setNotificationPreferenceAction(checked);

    if (!result.success) {
      setNotificationsEnabled(!checked);
      toast.error(result.error);
      return;
    }

    toast.success(checked ? "Notifications enabled" : "Notifications disabled");
  }

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account and preferences" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-20">
              {profile.avatar && (
                <AvatarImage src={profile.avatar} alt={profile.name ?? "Profile"} />
              )}
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-xl font-semibold">
                  {profile.name ?? "Student"}
                </p>
                {profile.role === "admin" && <Badge variant="accent">Admin</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">+{profile.mobile}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
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
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ImageIcon className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                          <Input
                            className="pl-11"
                            placeholder="https://example.com/avatar.png"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <p className="text-muted-foreground text-sm">Paste an image URL</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 self-start">
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="mb-3 text-sm font-medium">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = mounted && theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "gradient-brand text-white border-transparent shadow-md shadow-primary/20"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="text-muted-foreground size-4" />
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-muted-foreground text-sm">
                    Get reminders and updates from Hostel Essentials
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="self-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </motion.div>
    </div>
  );
}
