"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  Calculator,
  Menu,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Plus,
  Ruler,
  Sandwich,
  Utensils,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { auth } from "@/lib/firebase/client";

type AppNavbarProps = {
  backHref?: string;
  backLabel?: string;
};

export function AppNavbar({
  backHref,
  backLabel = "Wróć",
}: AppNavbarProps) {
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/calculator",
      label: "Kalkulator",
      icon: Calculator,
    },
    {
      href: "/measurements",
      label: "Pomiary",
      icon: Ruler,
    },
    {
      href: "/products",
      label: "Produkty",
      icon: PackageOpen,
    },
    {
      href: "/prepared-meals",
      label: "Gotowe posiłki",
      icon: Sandwich,
    },
    {
      href: "/products/new",
      label: "Dodaj produkt",
      icon: Plus,
    },
  ] as const;

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-background/90 backdrop-blur-xl dark:border-white/8">
      <div className="mx-auto flex min-h-14 w-full max-w-[1500px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950">
          <Utensils className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">GuiltFree</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.displayName || user?.email}
          </p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Otwórz menu"
              className="sm:hidden"
              size="icon"
              variant="ghost"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[320px] gap-0 p-0" showCloseButton>
            <SheetHeader className="border-b border-border/60 px-4 py-4">
              <SheetTitle>GuiltFree</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Nawigacja i szybkie akcje
              </p>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-2 px-4 py-4">
              {backHref && (
                <SheetClose asChild>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href={backHref}>
                      <ArrowLeft className="size-4" />
                      {backLabel}
                    </Link>
                  </Button>
                </SheetClose>
              )}

              {navItems.map(({ href, label, icon: Icon }) => (
                <SheetClose asChild key={href}>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href={href}>
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </Button>
                </SheetClose>
              ))}
            </div>

            <div className="mt-auto border-t border-border/60 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Motyw</p>
                  <p className="text-xs text-muted-foreground">
                    Przełącz jasny / ciemny
                  </p>
                </div>
                <ThemeToggle />
              </div>

              <Button
                aria-label="Wyloguj się"
                className="mt-4 w-full justify-start"
                onClick={handleLogout}
                variant="ghost"
              >
                <LogOut className="size-4" />
                Wyloguj się
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {backHref && (
          <>
            <Button asChild className="hidden md:inline-flex" variant="ghost">
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
            </Button>

            <Button asChild className="md:hidden" size="icon" variant="ghost">
              <Link aria-label={backLabel} href={backHref}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </>
        )}

        <Button asChild className="hidden sm:inline-flex" variant="ghost">
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>

        <Button asChild className="hidden xl:inline-flex" variant="ghost">
          <Link href="/calculator">
            <Calculator className="size-4" />
            Kalkulator
          </Link>
        </Button>

        <Button asChild className="hidden xl:inline-flex" variant="ghost">
          <Link href="/measurements">
            <Ruler className="size-4" />
            Pomiary
          </Link>
        </Button>

        <Button asChild className="hidden sm:inline-flex" variant="outline">
          <Link href="/products">
            <PackageOpen className="size-4" />
            Produkty
          </Link>
        </Button>

        <Button asChild className="hidden lg:inline-flex" variant="outline">
          <Link href="/prepared-meals">
            <Sandwich className="size-4" />
            Gotowe posiłki
          </Link>
        </Button>

        <Button asChild className="hidden sm:inline-flex">
          <Link href="/products/new">
            <Plus className="size-4" />
            Dodaj produkt
          </Link>
        </Button>

        <Button asChild className="sm:hidden" size="icon" variant="outline">
          <Link aria-label="Dodaj produkt" href="/products/new">
            <Plus className="size-4" />
          </Link>
        </Button>

        <ThemeToggle />

        <Button
          aria-label="Wyloguj się"
          className="size-11"
          onClick={handleLogout}
          size="icon"
          variant="ghost"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
