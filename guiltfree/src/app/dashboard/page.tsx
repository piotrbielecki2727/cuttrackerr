import { AuthGuard } from "@/components/auth/auth-guard";
import { NutritionDiaryDashboard } from "@/features/nutrition-diary/components/nutrition-diary-dashboard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <NutritionDiaryDashboard />
    </AuthGuard>
  );
}
