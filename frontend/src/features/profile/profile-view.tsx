import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, User, School, Building2, DoorOpen, ImageIcon, LogOut } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  hostel: z.string().trim().max(120).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20).optional().or(z.literal("")),
  avatar: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function ProfileView() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = (user?.name ?? user?.mobile.slice(-2) ?? "?").slice(0, 2).toUpperCase();

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name ?? "",
      college: user?.college ?? "",
      hostel: user?.hostel ?? "",
      roomNumber: user?.roomNumber ?? "",
      avatar: user?.avatar ?? "",
    },
  });

  async function onSubmit(values: ProfileUpdateInput) {
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
