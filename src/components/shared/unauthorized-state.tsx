import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Illustration } from "@/src/components/shared/illustration";

export function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Illustration
        lottieSrc="/lottie/error.json"
        fallbackIcon={ShieldAlert}
        tone="danger"
      />
      <div className="max-w-sm">
        <h3 className="text-h3">You dont have access to this page</h3>
        <p className="mt-1 text-body-sm text-text-muted">
          Your current role doesnt include permission for this section. Contact
          a Super Admin if you believe this is a mistake.
        </p>
      </div>
      <Link
        href="/admin"
        className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-body text-text-primary transition-colors hover:bg-card-hover"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
