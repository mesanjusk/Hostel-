import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, KeyRound, Loader2, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMobileForDisplay, normalizeMobile } from "@/lib/phone";
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
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { AdminUserDTO } from "@/features/admin/user-dto";

const mobileSchema = z
  .string()
  .trim()
  .min(1, "Enter a mobile number")
  .transform((val, ctx) => {
    const normalized = normalizeMobile(val);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return normalized;
  });

const createUserSchema = z.object({ mobile: mobileSchema });
const updateUserSchema = z.object({ mobile: mobileSchema, role: z.enum(["student", "admin"]) });

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

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
        Save this now — it won&apos;t be shown again. Share it with +{mobile} so they can log in with their
        mobile number and this code.
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
  trigger?: ReactNode;
}

export function UserFormDialog({ user, trigger }: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [revealedMobile, setRevealedMobile] = useState<string | null>(null);
  const isEdit = Boolean(user);

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { mobile: "" },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { mobile: user?.mobile ?? "", role: user?.role ?? "student" },
  });

  useEffect(() => {
    if (open) {
      setRevealedPin(null);
      setRevealedMobile(null);
      createForm.reset({ mobile: "" });
      editForm.reset({ mobile: user?.mobile ?? "", role: user?.role ?? "student" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  async function onCreateSubmit(values: CreateUserInput) {
    setIsSubmitting(true);
    try {
      const result = await api.post<{ mobile: string; pin: string }>("/api/admin/users", values);
      toast.success("User created");
      emitRefresh();
      setRevealedMobile(result.mobile);
      setRevealedPin(result.pin);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onEditSubmit(values: UpdateUserInput) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/api/admin/users/${user.id}`, values);
      toast.success("User updated");
      emitRefresh();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegenerate() {
    if (!user) return;
    setIsRegenerating(true);
    try {
      const result = await api.post<{ pin: string }>(`/api/admin/users/${user.id}/regenerate-pin`);
      emitRefresh();
      setRevealedMobile(user.mobile);
      setRevealedPin(result.pin);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsRegenerating(false);
    }
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

        {revealedPin && revealedMobile ? (
          <PinRevealPanel mobile={revealedMobile} pin={revealedPin} onDone={() => setOpen(false)} />
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

              <Button type="button" variant="outline" onClick={handleRegenerate} disabled={isRegenerating}>
                {isRegenerating ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
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
