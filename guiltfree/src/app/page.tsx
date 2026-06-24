"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [isLoading, router, user]);

  return (
    <main className="grid min-h-dvh place-items-center">
      <p className="text-sm text-muted-foreground">Sprawdzanie sesji...</p>
    </main>
  );
}
