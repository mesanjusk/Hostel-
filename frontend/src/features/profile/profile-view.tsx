import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, User, LogOut } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { ProfileFields } from "@/features/auth/profile-fields";
import { profileFieldsSchema, type ProfileFieldsInput } from "@/features/auth/profile-fields-schema";

export function ProfileView() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = (user?.name ?? user?.mobile.slice(-2) ?? "?").slice(0, 2).toUpperCase();

  const form = useForm<ProfileFieldsInput>({
    resolver: zodResolver(profileFieldsSchema),
    defaultValues: {
      name: user?.name ?? "",
      gender: user?.gender ?? undefined,
      college: user?.college ?? "",
      collegeCategoryId: user?.collegeCategoryId ?? "",
      courseId: user?.courseId ?? "",
    },
  });

  async function onSubmit(values: ProfileFieldsInput) {
    setIsSubmitting(true);
    try {
      await api.patch("/api/profile", values);
      await refreshUser();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

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
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name ?? "Profile"} />}
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-xl font-semibold">{user.name ?? "Student"}</p>
                {user.role === "admin" && <Badge variant="accent">Admin</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">+{user.mobile}</p>
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
                <ProfileFields form={form} />
                <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 self-start">
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="self-start"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </motion.div>
    </div>
  );
}
