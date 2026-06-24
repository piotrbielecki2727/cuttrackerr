"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Podaj prawidłowy adres e-mail."),
  password: z.string().min(1, "Podaj hasło."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      if (process.env.NODE_ENV === "development") {
        console.info("[Firebase Auth] Logowanie zakończone sukcesem", {
          uid: credential.user.uid,
          emailVerified: credential.user.emailVerified,
        });
      }

      router.replace("/dashboard");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Firebase Auth] Logowanie nie powiodło się", error);
      }

      setSubmitError(getAuthErrorMessage(error));
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>
          Wróć do swoich posiłków i dziennych celów.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="twoj@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {submitError && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {submitError}
            </p>
          )}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Nie masz jeszcze konta?{" "}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href="/register"
            >
              Zarejestruj się
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
