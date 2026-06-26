import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNavbar } from "@/components/layout/app-navbar";
import { PreparedMealsPageContent } from "@/features/nutrition-diary/components/prepared-meals-page-content";

export default function PreparedMealsPage() {
  return (
    <AuthGuard>
      <AppNavbar backHref="/dashboard" backLabel="Wróć do dashboardu" />
      <PreparedMealsPageContent />
    </AuthGuard>
  );
}
