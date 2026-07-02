"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, KeyRound, Loader2, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMobileForDisplay } from "@/lib/phone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserByAdminSchema,
  updateUserByAdminSchema,
  type CreateUserByAdminInput,
  type UpdateUserByAdminInput,
} from "@/lib/validations/admin";
import {
  createUserByAdminAction,
  regeneratePinAction,
  updateUserByAdminAction,
} from "@/actions/admin";
import type { AdminUserDTO } from "@/features/admin/user-dto";

function PinRevealPanel({ mobile, pin, onDone }: { mobile: string; pin: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleShareOnWhatsApp() {
    const message = [
      "Hi! Here's your Pack with Me login:",
      `Mobile: ${formatMobileForDisplay(mobile)}`,
      `Code: ${pin}`,
      "",
      `Log in at ${window.location.origin}/login`,
    ].join("\n");
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-warning/10 text-warning rounded-xl px-4 py-3 text-sm font-medium">
        Save this now — it won&apos;t be shown again. Share it with +{mobile} so they can log in
        with their mobile number and this code.
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
        <span className="font-display text-2xl font-bold tracking-[0.3em]">{pin}</span>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Button type="button" variant="outline" onClick={handleShareOnWhatsApp}>
        <MessageCircle className="size-4" />
        Share via WhatsApp
      </Button>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

interface UserFormDialogProps {
  user?: AdminUserDTO;
  trigger?: React.ReactNode;
}

export function UserFormDialog({ user, trigger }: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const isEdit = Boolean(user);

  const createForm = useForm<CreateUserByAdminInput>({
    resolver: zodResolver(createUserByAdminSchema),
    defaultValues: { mobile: "" },
  });

  const editForm = useForm<UpdateUserByAdminInput>({
    resolver: zodResolver(updateUserByAdminSchema),
    defaultValues: { id: user?.id ?? "", mobile: user?.mobile ?? "", role: user?.role ?? "student" },
  });

  useEffect(() => {
    if (open) {
      setRevealedPin(null);
      createForm.reset({ mobile: "" });
      editForm.reset({ id: user?.id ?? "", mobile: user?.mobile ?? "", role: user?.role ?? "student" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  async function onCreateSubmit(values: CreateUserByAdminInput) {
    setIsSubmitting(true);
    const result = await createUserByAdminAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("User created");
    setRevealedPin(result.pin);
  }

  async function onEditSubmit(values: UpdateUserByAdminInput) {
    setIsSubmitting(true);
    const result = await updateUserByAdminAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("User updated");
    setOpen(false);
  }

  async function handleRegenerate() {
    if (!user) return;
    setIsRegenerating(true);
    const result = await regeneratePinAction({ id: user.id });
    setIsRegenerating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setRevealedPin(result.pin);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add user
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          {!isEdit && !revealedPin && (
            <DialogDescription>
              Enter their mobile number — a 7-digit login code is generated automatically.
            </DialogDescription>
          )}
        </DialogHeader>

        {revealedPin ? (
          <PinRevealPanel
            mobile={isEdit ? user!.mobile : createForm.getValues("mobile")}
            pin={revealedPin}
            onDone={() => setOpen(false)}
          />
        ) : isEdit ? (
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
              <FormField
                control={editForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input placeholder="98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Regenerate login code
              </Button>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
              <FormField
                control={createForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input placeholder="98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Create user
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
