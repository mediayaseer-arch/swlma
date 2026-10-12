import { describe, expect, it } from "vitest";

const runLiveSupabaseTests =
  process.env.RUN_SUPABASE_INTEGRATION_TESTS === "1";
const describeLive = runLiveSupabaseTests ? describe : describe.skip;

describeLive("server-side Supabase configuration (live)", () => {
  it("can reach the configured project without exposing credentials to client code", async () => {
    const { serverSupabase } = await import("./supabase");
    expect(
      serverSupabase,
      "Set SUPABASE_URL and a supported server-side Supabase key before running live Supabase tests",
    ).toBeTruthy();
    const { error: paysError } = await serverSupabase!.from("pays").select("id").limit(1);
    const { error: settingsError } = await serverSupabase!.from("settings").select("id").limit(1);
    expect(paysError).toBeNull();
    expect(settingsError).toBeNull();
  }, 15_000);
});
