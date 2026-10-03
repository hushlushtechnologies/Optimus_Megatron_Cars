import Link from "next/link";
import { CarFront } from "lucide-react";

export default function RootNotFound() {
  return (
    <main className="bg-base flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <CarFront className="text-primary size-16" aria-hidden="true" />
      <div>
        <h1 className="text-h1">404 — Page not found</h1>
        <p className="text-body text-text-muted mt-1">Optimus Megatron Cars — Admin</p>
      </div>
      <Link
        href="/login"
        className="bg-primary text-body hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-[#0b1220] transition-colors"
      >
        Go to Login
      </Link>
    </main>
  );
}
