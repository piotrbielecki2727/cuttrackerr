"use client";

import { useAuth } from "@/components/providers/auth-provider";

import { PreparedMealsManager } from "./prepared-meals-manager";

export function PreparedMealsPageContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <PreparedMealsManager userId={user.uid} />;
}
