import type { Metadata } from "next";

import { SearchPageView } from "@/features/search/search-page-view";

export const metadata: Metadata = { title: "Search — Hostel Essentials" };

export default function SearchPage() {
  return <SearchPageView />;
}
