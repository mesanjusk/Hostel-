import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute, AdminRoute, AuthOnlyRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { RouteFallback } from "@/components/shared/route-fallback";
import { HOME_ROUTE } from "@/lib/nav-items";

const LoginPage = lazy(() => import("@/pages/login-page"));
const RegisterPage = lazy(() => import("@/pages/register-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page"));
const OnboardingPage = lazy(() => import("@/pages/onboarding-page"));
const NotFound = lazy(() => import("@/pages/not-found"));
const WelcomePage = lazy(() => import("@/pages/welcome-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ChecklistPage = lazy(() => import("@/pages/checklist-page"));
const ChecklistCategoryPage = lazy(() => import("@/pages/checklist-category-page"));
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
const AdminHomeScreenPage = lazy(() => import("@/pages/admin-home-screen-page"));

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={HOME_ROUTE} replace />;
  return <WelcomePage />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RootRoute />} />

          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <AuthOnlyRoute>
                  <LoginPage />
                </AuthOnlyRoute>
              }
            />
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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/checklist/:category" element={<ChecklistCategoryPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
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
              path="/admin/home-screen"
              element={
                <AdminRoute>
                  <AdminHomeScreenPage />
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
