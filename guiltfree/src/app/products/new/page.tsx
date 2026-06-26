import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNavbar } from "@/components/layout/app-navbar";
import { ProductForm } from "@/features/products/components/product-form";

export default function NewProductPage() {
  return (
    <AuthGuard>
      <AppNavbar backHref="/products" backLabel="Wróć do produktów" />
      <ProductForm />
    </AuthGuard>
  );
}
