import { AdminTabs } from "@/features/admin/admin-tabs";
import { HomeScreenEditor } from "@/features/admin/home-screen-editor";

export default function AdminHomeScreenPage() {
  return (
    <div>
      <AdminTabs />
      <HomeScreenEditor />
    </div>
  );
}
