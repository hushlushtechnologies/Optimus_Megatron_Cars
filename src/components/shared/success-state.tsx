import { CheckCircle2 } from "lucide-react";
import { Illustration } from "@/src/components/shared/illustration";

export function SuccessState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Illustration lottieSrc="/lottie/success.json" fallbackIcon={CheckCircle2} tone="success" />
      <div className="max-w-sm">
        <h3 className="text-h3">{title}</h3>
        {description && <p className="text-body-sm text-text-muted mt-1">{description}</p>}
      </div>
    </div>
  );
}
