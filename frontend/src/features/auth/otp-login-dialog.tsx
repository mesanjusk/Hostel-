import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OtpLoginForm } from "@/features/auth/otp-login-form";

/**
 * Popup version of OTP login — used wherever a feature needs a linked mobile number (Chat,
 * Community, Find-a-Roomie/Connections, or an explicit "link mobile number" action) instead of
 * navigating the visitor away to the full /wa-login page. Closes itself on success; the caller's
 * own `user` reactively updates once the mobile is linked, so whatever was gated re-renders in
 * place with no navigation at all.
 */
export function OtpLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Link your mobile number</DialogTitle>
          <DialogDescription>Everything you've already added stays exactly where it is.</DialogDescription>
        </DialogHeader>
        <OtpLoginForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
