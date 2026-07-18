import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute, AdminRoute, AuthOnlyRoute } from "@/components/protected-route";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { RouteFallback } from "@/components/shared/route-fallback";
import { HOME_ROUTE } from "@/lib/nav-items";
import { hasSelectedGender } from "@/lib/onboarding-gender";
import { useAnalyticsPageViews } from "@/lib/analytics/use-page-view-tracking";
import { lazyRetry } from "@/lib/lazy-retry";

// Lazy, not a static import: DashboardLayout pulls in FabMenu, which statically imports 7 full
// CRUD form dialogs (each with its own react-hook-form + zod schema) — eagerly importing the
// layout meant that weight shipped in the same chunk as this file, loaded by every visitor
// including anonymous users who only ever see /wa-login and never reach the dashboard.
const DashboardLayout = lazyRetry(() =>
  import("@/layouts/dashboard-layout").then((m) => ({ default: m.DashboardLayout })),
);
const AuthLayout = lazyRetry(() => import("@/layouts/auth-layout").then((m) => ({ default: m.AuthLayout })));

// Passwordless MSG91 OTP login is the single auth entry point now (mobile + OTP). The old
// WhatsApp-OTP register / forgot-code pages and the mobile+PIN wa-login page are superseded
// and their routes redirect here; the page files remain for reference/history.
const LandingPage = lazyRetry(() => import("@/pages/landing-page"));
const OtpLoginPage = lazyRetry(() => import("@/pages/otp-login-page"));
const WaLoginCompletePage = lazyRetry(() => import("@/pages/wa-login-complete-page"));
const WaLoginHomePage = lazyRetry(() => import("@/pages/wa-login-home-page"));
const OnboardingPage = lazyRetry(() => import("@/pages/onboarding-page"));
const NotFound = lazyRetry(() => import("@/pages/not-found"));
const DashboardPage = lazyRetry(() => import("@/pages/dashboard-page"));
const ChecklistPage = lazyRetry(() => import("@/pages/checklist-page"));
const ChecklistCategoryPage = lazyRetry(() => import("@/pages/checklist-category-page"));
const BagsPage = lazyRetry(() => import("@/pages/bags-page"));
const BagDetailPage = lazyRetry(() => import("@/pages/bag-detail-page"));
const BudgetPage = lazyRetry(() => import("@/pages/budget-page"));
const NotesPage = lazyRetry(() => import("@/pages/notes-page"));
const DocumentsPage = lazyRetry(() => import("@/pages/documents-page"));
const ContactsPage = lazyRetry(() => import("@/pages/contacts-page"));
const WishlistPage = lazyRetry(() => import("@/pages/wishlist-page"));
const ShoppingPage = lazyRetry(() => import("@/pages/shopping-page"));
const GuidePage = lazyRetry(() => import("@/pages/guide-page"));
const GuideArticlePage = lazyRetry(() => import("@/pages/guide-article-page"));
const SurvivalGuidePage = lazyRetry(() => import("@/pages/survival-guide-page"));
const ProfilePage = lazyRetry(() => import("@/pages/profile-page"));
const AdminPage = lazyRetry(() => import("@/pages/admin-page"));
const AdminUsersPage = lazyRetry(() => import("@/pages/admin-users-page"));
const AdminProductsPage = lazyRetry(() => import("@/pages/admin-products-page"));
const AdminGuidePage = lazyRetry(() => import("@/pages/admin-guide-page"));
const AdminLayoutPage = lazyRetry(() => import("@/pages/admin-layout-page"));
const AdminNavPage = lazyRetry(() => import("@/pages/admin-nav-page"));
const AdminHomeCardsPage = lazyRetry(() => import("@/pages/admin-home-cards-page"));
const AdminHomeScreenPage = lazyRetry(() => import("@/pages/admin-home-screen-page"));
const AdminGuideScreenPage = lazyRetry(() => import("@/pages/admin-guide-screen-page"));
const AdminCitiesPage = lazyRetry(() => import("@/pages/admin-cities-page"));
const AdminCommunitiesPage = lazyRetry(() => import("@/pages/admin-communities-page"));
const AdminPlacesPage = lazyRetry(() => import("@/pages/admin-places-page"));
const AdminContactsPage = lazyRetry(() => import("@/pages/admin-contacts-page"));
const AdminCollegeCategoriesPage = lazyRetry(() => import("@/pages/admin-college-categories-page"));
const AdminCoursesPage = lazyRetry(() => import("@/pages/admin-courses-page"));
const AdminCollegesPage = lazyRetry(() => import("@/pages/admin-colleges-page"));
const AdminChecklistTemplatesPage = lazyRetry(() => import("@/pages/admin-checklist-templates-page"));
const AdminDefaultChecklistPage = lazyRetry(() => import("@/pages/admin-default-checklist-page"));
const AdminSuggestedItemsPage = lazyRetry(() => import("@/pages/admin-suggested-items-page"));
const AdminTempUsersPage = lazyRetry(() => import("@/pages/admin-temp-users-page"));
const AdminChecklistHealthPage = lazyRetry(() => import("@/pages/admin-checklist-health-page"));
const DiscoverPage = lazyRetry(() => import("@/pages/discover-page"));
const FindARoomiePage = lazyRetry(() => import("@/pages/find-a-roomie-page"));
const BookingsPage = lazyRetry(() => import("@/pages/bookings-page"));
const ExplorePage = lazyRetry(() => import("@/pages/explore-page"));
const KnowYourCampusPage = lazyRetry(() => import("@/pages/know-your-campus-page"));
const CommunityPage = lazyRetry(() => import("@/pages/community-page"));
const CommunityDetailPage = lazyRetry(() => import("@/pages/community-detail-page"));
const ChatPage = lazyRetry(() => import("@/pages/chat-page"));
const ChatConversationPage = lazyRetry(() => import("@/pages/chat-conversation-page"));
const UserProfilePage = lazyRetry(() => import("@/pages/user-profile-page"));

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={HOME_ROUTE} replace />;
  // First-time visitors get the cute gender-pick landing page; anyone who's already been
  // through it (even without finishing signup) skips straight to login.
  return <Navigate to={hasSelectedGender() ? "/wa-login" : "/welcome"} replace />;
}

export default function App() {
  useAnalyticsPageViews();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRoute />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Navigate to="/wa-login" replace />} />
            {/* Superseded by passwordless OTP — the new login page both signs in and registers. */}
            <Route path="/register" element={<Navigate to="/wa-login" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/wa-login" replace />} />
            <Route
              path="/welcome"
              element={
                <AuthOnlyRoute redirectTo={HOME_ROUTE}>
                  <LandingPage />
                </AuthOnlyRoute>
              }
            />
            <Route
              path="/wa-login"
              element={
                <AuthOnlyRoute redirectTo={HOME_ROUTE} requireSelectedGender>
                  <OtpLoginPage />
                </AuthOnlyRoute>
              }
            />
            {/* Ungated: the WhatsApp bot's confirmation link must work regardless of
                whatever session is already active in this browser — it adopts the new
                session itself once the handshake behind it is done. */}
            <Route path="/wa-login/complete" element={<WaLoginCompletePage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<WaLoginHomePage />} />
            {/* Legacy path from when this hub lived under the WA-login flow; kept as a
                redirect for old bookmarks/links (see HOME_ROUTE in lib/routes.ts). */}
            <Route path="/wa-login/home" element={<Navigate to={HOME_ROUTE} replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/checklist/:category" element={<ChecklistCategoryPage />} />
            <Route path="/bags" element={<BagsPage />} />
            <Route path="/bags/:id" element={<BagDetailPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/find-a-roomie" element={<FindARoomiePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/know-your-campus" element={<KnowYourCampusPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:slug" element={<CommunityDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatConversationPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/guide/survival-guide" element={<SurvivalGuidePage />} />
            <Route path="/guide/:slug" element={<GuideArticlePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route path="/admin/analytics-pro" element={<Navigate to="/admin" replace />} />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/guide"
              element={
                <AdminRoute>
                  <AdminGuidePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/layout"
              element={
                <AdminRoute>
                  <AdminLayoutPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/nav"
              element={
                <AdminRoute>
                  <AdminNavPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/home-cards"
              element={
                <AdminRoute>
                  <AdminHomeCardsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/home-screen"
              element={
                <AdminRoute>
                  <AdminHomeScreenPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/guide-screen"
              element={
                <AdminRoute>
                  <AdminGuideScreenPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/cities"
              element={
                <AdminRoute>
                  <AdminCitiesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/communities"
              element={
                <AdminRoute>
                  <AdminCommunitiesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/places"
              element={
                <AdminRoute>
                  <AdminPlacesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reported-contacts"
              element={
                <AdminRoute>
                  <AdminContactsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/college-categories"
              element={
                <AdminRoute>
                  <AdminCollegeCategoriesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <AdminRoute>
                  <AdminCoursesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/colleges"
              element={
                <AdminRoute>
                  <AdminCollegesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/checklist-templates"
              element={
                <AdminRoute>
                  <AdminChecklistTemplatesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/checklist-health"
              element={
                <AdminRoute>
                  <AdminChecklistHealthPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/default-checklist"
              element={
                <AdminRoute>
                  <AdminDefaultChecklistPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/suggested-items"
              element={
                <AdminRoute>
                  <AdminSuggestedItemsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/pending-registrations"
              element={
                <AdminRoute>
                  <AdminTempUsersPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
