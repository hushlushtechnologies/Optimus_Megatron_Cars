import { Spinner } from "@/src/components/ui/spinner";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-body-sm text-text-muted">{label}...</p>
    </div>
  );
}
