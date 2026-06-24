import { AuthGuard } from "@/components/auth/auth-guard";
import { ProductsBrowser } from "@/features/products/components/products-browser";

export default function ProductsPage() {
  return (
    <AuthGuard>
      <ProductsBrowser />
    </AuthGuard>
  );
}