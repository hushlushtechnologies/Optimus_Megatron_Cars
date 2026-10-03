import { EmptyState } from "@/src/components/shared/empty-state";

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon="SearchX"
      title={`No results for "${query}"`}
      description="Try a different keyword, or check the spelling."
    />
  );
}
