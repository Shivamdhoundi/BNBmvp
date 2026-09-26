import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      role,
      organizations!inner (id, name, slug)
    `)
    .limit(1)
    .single();
  console.log("Data:", data);
  console.log("Error:", error);
}
main();
