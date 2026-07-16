import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute, AdminRoute, AuthOnlyRoute } from "@/components/protected-route";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { RouteFallback } from "@/components/shared/route-fallback";
import { HOME_ROUTE } from "@/lib/nav-items";
import { useAnalyticsPageViews } from "@/lib/analytics/use-page-view-tracking";

// Lazy, not a static import: DashboardLayout pulls in FabMenu, which statically imports 7 full
// CRUD form dialogs (each with its own react-hook-form + zod schema) — eagerly importing the
// layout meant that weight shipped in the same chunk as this file, loaded by every visitor
// including anonymous users who only ever see /wa-login and never reach the dashboard.
const DashboardLayout = lazy(() =>
  import("@/layouts/dashboard-layout").then((m) => ({ default: m.DashboardLayout })),
);
const AuthLayout = lazy(() => import("@/layouts/auth-layout").then((m) => ({ default: m.AuthLayout })));

const RegisterPage = lazy(() => import("@/pages/register-page"));
const WaLoginPage = lazy(() => import("@/pages/wa-login-page"));
const WaLoginCompletePage = lazy(() => import("@/pages/wa-login-complete-page"));
const WaLoginHomePage = lazy(() => import("@/pages/wa-login-home-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const NotFound = lazy(() => import("@/pages/not-found"));
const WelcomePage = lazy(() => import("@/pages/welcome-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ChecklistPage = lazy(() => import("@/pages/checklist-page"));
const ChecklistCategoryPage = lazy(() => import("@/pages/checklist-category-page"));
const BagsPage = lazy(() => import("@/pages/bags-page"));
const BagDetailPage = lazy(() => import("@/pages/bag-detail-page"));
const BudgetPage = lazy(() => import("@/pages/budget-page"));
const NotesPage = lazy(() => import("@/pages/notes-page"));
const DocumentsPage = lazy(() => import("@/pages/documents-page"));
const ContactsPage = lazy(() => import("@/pages/contacts-page"));
const WishlistPage = lazy(() => import("@/pages/wishlist-page"));
const ShoppingPage = lazy(() => import("@/pages/shopping-page"));
const GuidePage = lazy(() => import("@/pages/guide-page"));
const GuideArticlePage = lazy(() => import("@/pages/guide-article-page"));
const SurvivalGuidePage = lazy(() => import("@/pages/survival-guide-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users-page"));
const AdminProductsPage = lazy(() => import("@/pages/admin-products-page"));
const AdminGuidePage = lazy(() => import("@/pages/admin-guide-page"));
const AdminLayoutPage = lazy(() => import("@/pages/admin-layout-page"));
const AdminNavPage = lazy(() => import("@/pages/admin-nav-page"));
const AdminHomeCardsPage = lazy(() => import("@/pages/admin-home-cards-page"));
const AdminHomeScreenPage = lazy(() => import("@/pages/admin-home-screen-page"));
const AdminCitiesPage = lazy(() => import("@/pages/admin-cities-page"));
const AdminCommunitiesPage = lazy(() => import("@/pages/admin-communities-page"));
const AdminPlacesPage = lazy(() => import("@/pages/admin-places-page"));
const AdminContactsPage = lazy(() => import("@/pages/admin-contacts-page"));
const AdminCollegeCategoriesPage = lazy(() => import("@/pages/admin-college-categories-page"));
const AdminCoursesPage = lazy(() => import("@/pages/admin-courses-page"));
const AdminChecklistTemplatesPage = lazy(() => import("@/pages/admin-checklist-templates-page"));
const AdminDefaultChecklistPage = lazy(() => import("@/pages/admin-default-checklist-page"));
const AdminSuggestedItemsPage = lazy(() => import("@/pages/admin-suggested-items-page"));
const AdminTempUsersPage = lazy(() => import("@/pages/admin-temp-users-page"));
const AdminChecklistHealthPage = lazy(() => import("@/pages/admin-checklist-health-page"));
const DiscoverPage = lazy(() => import("@/pages/discover-page"));
const BookingsPage = lazy(() => import("@/pages/bookings-page"));
const ExplorePage = lazy(() => import("@/pages/explore-page"));
const CommunityPage = lazy(() => import("@/pages/community-page"));
const CommunityDetailPage = lazy(() => import("@/pages/community-detail-page"));
const ChatPage = lazy(() => import("@/pages/chat-page"));
const ChatConversationPage = lazy(() => import("@/pages/chat-conversation-page"));
const UserProfilePage = lazy(() => import("@/pages/user-profile-page"));

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={HOME_ROUTE} replace />;
  return <WelcomePage />;
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
            <Route
              path="/register"
              element={
                <AuthOnlyRoute>
                  <RegisterPage />
                </AuthOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthOnlyRoute>
                  <ForgotPasswordPage />
                </AuthOnlyRoute>
              }
            />
            <Route
              path="/wa-login"
              element={
                <AuthOnlyRoute redirectTo="/wa-login/home">
                  <WaLoginPage />
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
            <Route path="/wa-login/home" element={<WaLoginHomePage />} />
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
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:slug" element={<CommunityDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatConversationPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/guide/survival-guide" element={<SurvivalGuidePage />} />
            <Route path="/guide/:slug" element={<GuideArticlePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
