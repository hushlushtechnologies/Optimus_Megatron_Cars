import { getAddLeadLookups } from "@/src/lib/supabase/lead-lookups";
import { AddLeadForm } from "@/src/components/leads/add-lead-form";

export default async function NewLeadPage() {
  const lookups = await getAddLeadLookups();
  const defaultStage = lookups.stages.find((s) => s.stage_type === "open") ?? lookups.stages[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1">Add Lead</h1>
        <p className="text-body-sm text-text-muted">Create a new sales opportunity for a customer.</p>
      </div>
      <AddLeadForm lookups={lookups} defaultStageId={defaultStage?.id ?? ""} />
    </div>
  );
}
