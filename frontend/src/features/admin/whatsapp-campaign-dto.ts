export type WhatsAppCampaignMode = "time" | "quantity";

export interface WhatsAppCampaignSettingsDTO {
  enabled: boolean;
  mode: WhatsAppCampaignMode;
  intervalMinutes: number;
  quantityThreshold: number;
  skipIfZero: boolean;
  endAt: string | null;
  lastBroadcastAt: string | null;
}

export interface AdminWaStatusDTO {
  id: string;
  name: string | null;
  mobile: string;
  waWindowOpenedAt: string | null;
  isWindowOpen: boolean;
  waBroadcastEnabled: boolean;
}
