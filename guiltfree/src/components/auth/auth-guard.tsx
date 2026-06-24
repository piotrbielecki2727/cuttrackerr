"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p className="text-sm text-muted-foreground">
          Sprawdzanie sesji...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}