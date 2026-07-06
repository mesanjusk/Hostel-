import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { ProtectedRoute, AdminRoute, AuthOnlyRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { HOME_ROUTE } from "@/lib/nav-items";

import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import OnboardingPage from "@/pages/onboarding-page";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome-page";
import DashboardPage from "@/pages/dashboard-page";
import ChecklistPage from "@/pages/checklist-page";
import ChecklistCategoryPage from "@/pages/checklist-category-page";
import BudgetPage from "@/pages/budget-page";
import NotesPage from "@/pages/notes-page";
import DocumentsPage from "@/pages/documents-page";
import ContactsPage from "@/pages/contacts-page";
import WishlistPage from "@/pages/wishlist-page";
import ShoppingPage from "@/pages/shopping-page";
import GuidePage from "@/pages/guide-page";
import GuideArticlePage from "@/pages/guide-article-page";
import SurvivalGuidePage from "@/pages/survival-guide-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import AdminPage from "@/pages/admin-page";
import AdminUsersPage from "@/pages/admin-users-page";
import AdminProductsPage from "@/pages/admin-products-page";
import AdminGuidePage from "@/pages/admin-guide-page";

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={HOME_ROUTE} replace />;
  return <WelcomePage />;
}

export default function App() {
  return (
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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
