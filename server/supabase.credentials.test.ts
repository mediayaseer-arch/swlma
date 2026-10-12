import { describe, expect, it } from "vitest";

const runLiveSupabaseTests =
  process.env.RUN_SUPABASE_INTEGRATION_TESTS === "1";
const describeLive = runLiveSupabaseTests ? describe : describe.skip;

describeLive("configured server-side Supabase credentials (live)", () => {
  it("can reach the public settings table without exposing credentials", async () => {
    const { serverSupabase } = await import("./supabase");
    expect(
      serverSupabase,
      "Set SUPABASE_URL and a supported server-side Supabase key before running live Supabase tests",
    ).toBeTruthy();
    const { error } = await serverSupabase!.from("settings").select("id").limit(1);
    expect(error).toBeNull();
  }, 15_000);
});
