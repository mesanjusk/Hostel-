import { connectDB } from "@/db";
import { UiLayout } from "@/models/UiLayout";

export interface WidgetConfig {
  id: string;
  visible: boolean;
}

const DASHBOARD_PAGE = "dashboard";
const NAV_PAGE = "nav";
const HOME_PAGE = "home";

async function getLayout(page: string): Promise<WidgetConfig[] | null> {
  await connectDB();
  const doc = await UiLayout.findOne({ page }).lean();
  return doc?.widgets ?? null;
}

async function saveLayout(page: string, widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  await connectDB();
  await UiLayout.findOneAndUpdate({ page }, { widgets }, { upsert: true });
  return widgets;
}

export function getDashboardLayout(): Promise<WidgetConfig[] | null> {
  return getLayout(DASHBOARD_PAGE);
}

/** Admin-only: persists the widget order/visibility that every student's dashboard renders. */
export function saveDashboardLayout(widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  return saveLayout(DASHBOARD_PAGE, widgets);
}

export function getNavLayout(): Promise<WidgetConfig[] | null> {
  return getLayout(NAV_PAGE);
}

/** Admin-only: persists which nav items are hidden/shown for every student. */
export function saveNavLayout(widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  return saveLayout(NAV_PAGE, widgets);
}

export function getHomeLayout(): Promise<WidgetConfig[] | null> {
  return getLayout(HOME_PAGE);
}

/** Admin-only: persists which cards are hidden/shown on the post-login home hub. */
export function saveHomeLayout(widgets: WidgetConfig[]): Promise<WidgetConfig[]> {
  return saveLayout(HOME_PAGE, widgets);
}
