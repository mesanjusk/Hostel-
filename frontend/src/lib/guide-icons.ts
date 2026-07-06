import {
  BookOpen,
  Backpack,
  WashingMachine,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  FileText,
  Siren,
  CalendarDays,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

export const GUIDE_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Backpack,
  WashingMachine,
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  FileText,
  Siren,
  CalendarDays,
  PiggyBank,
};

export function getGuideIcon(name: string): LucideIcon {
  return GUIDE_ICONS[name] ?? BookOpen;
}
