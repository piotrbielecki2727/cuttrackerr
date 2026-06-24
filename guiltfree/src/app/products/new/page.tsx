import { AuthGuard } from "@/components/auth/auth-guard";
import { ProductForm } from "@/features/products/components/product-form";

export default function NewProductPage() {
  return (
    <AuthGuard>
      <ProductForm />
    </AuthGuard>
  );
}