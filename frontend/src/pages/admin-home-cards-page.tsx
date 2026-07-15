import { AdminTabs } from "@/features/admin/admin-tabs";
import { HomeCardsEditorView } from "@/features/admin/home-cards-editor-view";

export default function AdminHomeCardsPage() {
  return (
    <div>
      <AdminTabs />
      <HomeCardsEditorView />
    </div>
  );
}
