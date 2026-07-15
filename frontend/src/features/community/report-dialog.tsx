import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { reportContent } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";

const REASONS: Array<{ value: string; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "violence", label: "Violence" },
  { value: "scam", label: "Scam or fraud" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export function ReportDialog({
  targetType,
  targetId,
  trigger,
}: {
  targetType: "message" | "user" | "community";
  targetId: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await reportContent({ targetType, targetId, reason, note });
      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setNote("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Flag className="size-3.5" /> Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`}>{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any extra detail (optional)"
          className="min-h-20"
        />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
