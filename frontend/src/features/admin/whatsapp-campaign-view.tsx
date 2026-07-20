import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { formatMobileForDisplay } from "@/lib/phone";
import type { AdminWaStatusDTO, WhatsAppCampaignMode, WhatsAppCampaignSettingsDTO } from "@/features/admin/whatsapp-campaign-dto";

/** ISO string -> value for an <input type="datetime-local">, in the browser's local time. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO string (or "" to clear, matching the backend's
 * empty-string-means-no-cutoff convention). */
function localInputToIso(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

interface FormState {
  enabled: boolean;
  mode: WhatsAppCampaignMode;
  intervalMinutes: string;
  quantityThreshold: string;
  skipIfZero: boolean;
  endAt: string;
}

function toFormState(settings: WhatsAppCampaignSettingsDTO): FormState {
  return {
    enabled: settings.enabled,
    mode: settings.mode,
    intervalMinutes: String(settings.intervalMinutes),
    quantityThreshold: String(settings.quantityThreshold),
    skipIfZero: settings.skipIfZero,
    endAt: isoToLocalInput(settings.endAt),
  };
}

function CampaignSettingsCard({ settings }: { settings: WhatsAppCampaignSettingsDTO }) {
  const [form, setForm] = useState<FormState>(() => toFormState(settings));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(toFormState(settings));
  }, [settings]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/api/admin/whatsapp-campaign", {
        enabled: form.enabled,
        mode: form.mode,
        intervalMinutes: Number(form.intervalMinutes) || 1,
        quantityThreshold: Number(form.quantityThreshold) || 1,
        skipIfZero: form.skipIfZero,
        endAt: localInputToIso(form.endAt),
      });
      emitRefresh();
      toast.success("Campaign settings saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save campaign settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign settings</CardTitle>
        <p className="text-muted-foreground text-sm">
          Texts admins whose WhatsApp window is open with the count of new student registrations — not a message per
          signup.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{form.enabled ? "Running" : "Paused"}</p>
            <p className="text-muted-foreground text-xs">Turn the whole campaign on or off</p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))} />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Trigger mode</Label>
          <RadioGroup
            value={form.mode}
            onValueChange={(mode) => setForm((f) => ({ ...f, mode: mode as WhatsAppCampaignMode }))}
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
              <RadioGroupItem value="time" className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">Time-based</p>
                <p className="text-muted-foreground text-xs">Send a count on a fixed schedule, e.g. every 30 minutes</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
              <RadioGroupItem value="quantity" className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">Quantity-based</p>
                <p className="text-muted-foreground text-xs">
                  Send once a set number of new registrations have come in since the last send
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {form.mode === "time" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wa-interval">Check every (minutes)</Label>
              <Input
                id="wa-interval"
                type="number"
                min={1}
                max={1440}
                value={form.intervalMinutes}
                onChange={(e) => setForm((f) => ({ ...f, intervalMinutes: e.target.value }))}
                className="max-w-40"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Skip if zero</p>
                <p className="text-muted-foreground text-xs">
                  Don't send when an interval had no new registrations, instead of texting "0"
                </p>
              </div>
              <Switch
                checked={form.skipIfZero}
                onCheckedChange={(skipIfZero) => setForm((f) => ({ ...f, skipIfZero }))}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-quantity">Send after this many new registrations</Label>
            <Input
              id="wa-quantity"
              type="number"
              min={1}
              max={100000}
              value={form.quantityThreshold}
              onChange={(e) => setForm((f) => ({ ...f, quantityThreshold: e.target.value }))}
              className="max-w-40"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="wa-end-at">End date (optional)</Label>
          <Input
            id="wa-end-at"
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
            className="max-w-64"
          />
          <p className="text-muted-foreground text-xs">Campaign auto-pauses once this passes. Leave blank to run with no cutoff.</p>
        </div>

        <div>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminRosterCard({ admins: initialAdmins }: { admins: AdminWaStatusDTO[] }) {
  const [admins, setAdmins] = useState(initialAdmins);

  useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  async function handleToggle(id: string, waBroadcastEnabled: boolean) {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, waBroadcastEnabled } : a)));
    try {
      await api.patch(`/api/admin/whatsapp-campaign/admins/${id}`, { waBroadcastEnabled });
    } catch (error) {
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, waBroadcastEnabled: !waBroadcastEnabled } : a)));
      toast.error(error instanceof ApiError ? error.message : "Failed to update admin");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admins</CardTitle>
        <p className="text-muted-foreground text-sm">
          An admin opts in by sending any WhatsApp message (e.g. "PACKWITHME") to the business number — that opens a
          ~23h window. Turn "Receiving" off to exclude a specific admin without touching their window.
        </p>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <EmptyState icon={Users} title="No admins yet" description="Promote an account with npm run make-admin." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>WhatsApp window</TableHead>
                <TableHead>Receiving</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name ?? "—"}</TableCell>
                  <TableCell>{formatMobileForDisplay(admin.mobile)}</TableCell>
                  <TableCell>
                    {admin.isWindowOpen ? (
                      <Badge variant="success">Open</Badge>
                    ) : admin.waWindowOpenedAt ? (
                      <Badge variant="outline">Closed</Badge>
                    ) : (
                      <Badge variant="outline">Never opted in</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={admin.waBroadcastEnabled}
                      onCheckedChange={(checked) => handleToggle(admin.id, checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function WhatsAppCampaignView({
  settings,
  admins,
}: {
  settings: WhatsAppCampaignSettingsDTO | null;
  admins: AdminWaStatusDTO[];
}) {
  return (
    <div>
      <PageHeader
        title="WhatsApp Campaign"
        description="Notify admins over WhatsApp with new-registration counts"
      />
      <div className="flex flex-col gap-6">
        {settings ? (
          <CampaignSettingsCard settings={settings} />
        ) : (
          <Card>
            <CardContent className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <MessageCircle className="size-4" />
              Loading...
            </CardContent>
          </Card>
        )}
        <AdminRosterCard admins={admins} />
      </div>
    </div>
  );
}
