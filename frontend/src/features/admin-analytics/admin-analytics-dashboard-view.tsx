import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, presetRange } from "@/features/admin-analytics/date-range-filter";
import { SummaryTab } from "@/features/admin-analytics/summary-tab";
import { OverviewTab } from "@/features/admin-analytics/overview-tab";
import { AudienceTab } from "@/features/admin-analytics/audience-tab";
import { EngagementTab } from "@/features/admin-analytics/engagement-tab";
import { FunnelTab } from "@/features/admin-analytics/funnel-tab";
import { LoginTab } from "@/features/admin-analytics/login-tab";
import { BehaviorTab } from "@/features/admin-analytics/behavior-tab";
import { RetentionTab } from "@/features/admin-analytics/retention-tab";
import { BusinessTab } from "@/features/admin-analytics/business-tab";
import { RealtimeTab } from "@/features/admin-analytics/realtime-tab";

const SUB_TABS = [
  { value: "summary", label: "Summary" },
  { value: "overview", label: "Overview" },
  { value: "audience", label: "Audience" },
  { value: "engagement", label: "Engagement" },
  { value: "funnel", label: "Registration" },
  { value: "login", label: "Login" },
  { value: "behavior", label: "Behavior" },
  { value: "retention", label: "Retention" },
  { value: "business", label: "Business" },
  { value: "realtime", label: "Real-Time" },
];

export function AdminAnalyticsDashboardView() {
  const [range, setRange] = useState(presetRange(30));
  const [tab, setTab] = useState("summary");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="flex-wrap overflow-x-auto">
          {SUB_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tab !== "summary" && tab !== "retention" && tab !== "realtime" && <DateRangeFilter value={range} onChange={setRange} />}
      </div>

      <TabsContent value="summary">
        <SummaryTab />
      </TabsContent>
      <TabsContent value="overview">
        <OverviewTab range={range} />
      </TabsContent>
      <TabsContent value="audience">
        <AudienceTab range={range} />
      </TabsContent>
      <TabsContent value="engagement">
        <EngagementTab range={range} />
      </TabsContent>
      <TabsContent value="funnel">
        <FunnelTab range={range} />
      </TabsContent>
      <TabsContent value="login">
        <LoginTab range={range} />
      </TabsContent>
      <TabsContent value="behavior">
        <BehaviorTab range={range} />
      </TabsContent>
      <TabsContent value="retention">
        <RetentionTab />
      </TabsContent>
      <TabsContent value="business">
        <BusinessTab range={range} />
      </TabsContent>
      <TabsContent value="realtime">
        <RealtimeTab />
      </TabsContent>
    </Tabs>
  );
}
