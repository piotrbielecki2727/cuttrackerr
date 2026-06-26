import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNavbar } from "@/components/layout/app-navbar";
import { CalorieCalculatorPageContent } from "@/features/calorie-calculator/components/calorie-calculator-page-content";

export default function CalculatorPage() {
  return (
    <AuthGuard>
      <AppNavbar backHref="/dashboard" backLabel="Wróć do dashboardu" />
      <CalorieCalculatorPageContent />
    </AuthGuard>
  );
}
