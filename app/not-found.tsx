import Link from "next/link";
import { CarFront } from "lucide-react";

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base p-6 text-center">
      <CarFront className="size-16 text-primary" aria-hidden="true" />
      <div>
        <h1 className="text-h1">404 — Page not found</h1>
        <p className="mt-1 text-body text-text-muted">
          Optimus Megatron Cars — Admin
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-body text-[#0b1220] transition-colors hover:bg-primary-hover"
      >
        Go to Login
      </Link>
    </main>
  );
}
