import { EmptyState } from "@/src/components/shared/empty-state";

export default function AdminNotFound() {
  return (
    <EmptyState
      icon="Search"
      title="This admin page doesn't exist"
      description="The page you're looking for hasn't been built yet, or the link is incorrect."
      action={{
        label: "Back to Dashboard",
        href: "/admin",
      }}
    />
  );
}
