"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";

import { loginSchema, type LoginFormValues } from "@/src/lib/validation/auth";

import { login } from "./actions";

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

/* =========================================================
   LOGIN FORM

   useSearchParams() lives here so it is inside Suspense.
========================================================= */

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    const result = await login(values);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    /*
     * Example:
     *
     * /login?redirectTo=/admin/customers
     *
     * After login:
     * → /admin/customers
     */

    const requestedRedirect = searchParams.get("redirectTo");

    /*
     * Only allow internal application paths.
     *
     * This prevents values such as:
     * https://example.com
     * //example.com
     */

    const redirectTo =
      requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : "/admin";

    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-base flex min-h-screen items-center justify-center p-4"
    >
      <Card variant="elevated" padding="lg" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-h2">Optimus Megatron Cars</h1>

          <p className="text-body-sm text-text-muted">Admin sign in</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            leftIcon={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            leftIcon={<Lock className="size-4" />}
            error={errors.password?.message}
            {...register("password")}
          />

          {formError && (
            <p role="alert" className="text-body-sm text-red-400">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
            Sign In
          </Button>
        </form>
      </Card>
    </main>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function LoginLoading() {
  return (
    <main className="bg-base flex min-h-screen items-center justify-center p-4" aria-busy="true">
      <Card variant="elevated" padding="lg" className="w-full max-w-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-h2">Optimus Megatron Cars</h1>

          <p className="text-body-sm text-text-muted">Admin sign in</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card-hover h-10 animate-pulse rounded-md" />
          <div className="bg-card-hover h-10 animate-pulse rounded-md" />
          <div className="bg-card-hover mt-2 h-12 animate-pulse rounded-lg" />
        </div>
      </Card>
    </main>
  );
}
