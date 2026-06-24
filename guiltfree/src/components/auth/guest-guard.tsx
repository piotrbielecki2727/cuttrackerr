"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

type GuestGuardProps = {
  children: ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="text-sm text-muted-foreground">Sprawdzanie sesji...</p>
      </main>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
