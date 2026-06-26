import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNavbar } from "@/components/layout/app-navbar";
import { BodyMeasurementsPageContent } from "@/features/body-measurements/components/body-measurements-page-content";

export default function MeasurementsPage() {
  return (
    <AuthGuard>
      <AppNavbar backHref="/dashboard" backLabel="Wróć do dashboardu" />
      <BodyMeasurementsPageContent />
    </AuthGuard>
  );
}
