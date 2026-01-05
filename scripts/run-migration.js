// Load environment variables FIRST before anything else
require("dotenv").config({ path: ".env.local" });

// Now run the migration
require("./migrate-to-supabase.ts");
