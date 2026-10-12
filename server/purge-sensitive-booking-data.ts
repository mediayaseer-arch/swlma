import "dotenv/config";
import { sanitizeBookingData } from "./booking-data";
import { serverSupabase } from "./supabase";

async function main() {
  if (!serverSupabase) {
    throw new Error("Supabase server credentials are required");
  }

  const { data: rows, error } = await serverSupabase.from("pays").select("id, data");
  if (error) throw error;

  let updated = 0;
  for (const row of rows || []) {
    const sanitized = sanitizeBookingData(row.data);
    if (JSON.stringify(sanitized) === JSON.stringify(row.data)) continue;
    const { error: updateError } = await serverSupabase
      .from("pays")
      .upsert({ id: row.id, data: sanitized });
    if (updateError) throw updateError;
    updated += 1;
  }

  console.log(`Removed sensitive legacy payment fields from ${updated} booking record(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});