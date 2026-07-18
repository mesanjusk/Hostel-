import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Download, Loader2, User, LogOut, Pencil, Share, SquarePlus, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { usePwaInstall } from "@/lib/use-pwa-install";
import { ProfileFields } from "@/features/auth/profile-fields";
import { profileFieldsSchema, type ProfileFieldsInput } from "@/features/auth/profile-fields-schema";
import { PublicProfileSettings } from "@/features/community/public-profile-settings";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">{title}</h2>
      <Card className="gap-0 divide-y divide-border/60 overflow-hidden p-0">{children}</Card>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  action,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function InstallAppAction() {
  const { installed, isIOS, canInstall, promptInstall } = usePwaInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (installed) {
    return (
      <span className="text-muted-foreground text-xs font-medium">Installed</span>
    );
  }

  if (isIOS && !canInstall) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setIosDialogOpen(true)}>
          Install
        </Button>
        <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install Pack with Me</DialogTitle>
              <DialogDescription asChild>
                <p className="flex flex-wrap items-center gap-1 pt-1 text-left">
                  Tap <Share className="mx-0.5 inline size-3.5" aria-hidden /> <strong>Share</strong> in your
                  browser toolbar, then choose <SquarePlus className="mx-0.5 inline size-3.5" aria-hidden />{" "}
                  <strong>"Add to Home Screen"</strong>.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={!canInstall} onClick={() => promptInstall()}>
      Install
    </Button>
  );
}

export function ProfileView() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const initials = (user?.name ?? user?.mobile.slice(-2) ?? "?").slice(0, 2).toUpperCase();

  const form = useForm<ProfileFieldsInput>({
    resolver: zodResolver(profileFieldsSchema),
    defaultValues: {
      name: user?.name ?? "",
      gender: user?.gender ?? undefined,
      college: user?.college ?? "",
      collegeCategoryId: user?.collegeCategoryId ?? "",
      courseId: user?.courseId ?? "",
      city: user?.city ?? "",
      homeTown: user?.homeTown ?? "",
    },
  });

  useEffect(() => {
    if (!editOpen || !user) return;
    form.reset({
      name: user.name ?? "",
      gender: user.gender ?? undefined,
      college: user.college ?? "",
      collegeCategoryId: user.collegeCategoryId ?? "",
      courseId: user.courseId ?? "",
      city: user.city ?? "",
      homeTown: user.homeTown ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, user]);

  async function onSubmit(values: ProfileFieldsInput) {
    setIsSubmitting(true);
    try {
      await api.patch("/api/profile", values);
      await refreshUser();
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/wa-login", { replace: true });
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account, preferences, and app settings" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          </div>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
            </DialogHeader>
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
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <PublicProfileSettings />

        <SettingsSection title="App">
          <SettingsRow
            icon={Download}
            label="Install app"
            description="Add Pack with Me to your home screen"
            action={<InstallAppAction />}
          />
        </SettingsSection>

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
