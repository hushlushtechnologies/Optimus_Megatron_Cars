import { createClient } from "@/src/lib/supabase/server";

export default async function TestConnectionPage() {
  const supabase = await createClient();

  // auth.getUser() just confirms we can talk to Supabase's Auth service —
  // returning "no user" is expected and correct, since Phase 5 hasn't
  // built login yet.
  const { error } = await supabase.auth.getUser();

  const isConnected = !error || error.message === "Auth session missing!";

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <h1 className="text-h1">Supabase Connection Test</h1>
      <p className="text-body text-text-muted">
        Project URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>
      {isConnected ? (
        <p className="text-body-lg text-emerald-400">
          ✅ Successfully connected to Supabase.
        </p>
      ) : (
        <p className="text-body-lg text-red-400">
          ❌ Connection failed: {error?.message}
        </p>
      )}
    </main>
  );
}
