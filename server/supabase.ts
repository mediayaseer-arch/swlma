import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = 
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

class InMemorySupabaseMock {
  private tables = new Map<string, Map<string, any>>();

  constructor() {
    this.tables.set("pays", new Map());
    this.tables.set("settings", new Map());
    this.tables.set("blocked_bins", new Map());
  }

  private getTable(name: string) {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map());
    }
    return this.tables.get(name)!;
  }

  from(table: string) {
    const tableMap = this.getTable(table);
    let filterCol: string | null = null;
    let filterVal: any = null;

    const queryBuilder = {
      select: (_columns?: string) => queryBuilder,
      eq: (col: string, val: any) => {
        filterCol = col;
        filterVal = val;
        return queryBuilder;
      },
      maybeSingle: async () => {
        const rows = queryBuilder.execute();
        return { data: rows[0] || null, error: null };
      },
      then: (resolve: any, reject: any) => {
        try {
          resolve({ data: queryBuilder.execute(), error: null });
        } catch (err) {
          reject(err);
        }
      },
      execute: () => {
        const results: any[] = [];
        tableMap.forEach((record) => {
          if (filterCol && filterVal !== undefined) {
            if (record[filterCol] === filterVal) {
              results.push(record);
            }
          } else {
            results.push(record);
          }
        });
        return results;
      },
      upsert: async (record: any) => {
        const pk = record.id || record.bin || Object.keys(record)[0];
        const existing = tableMap.get(pk) || {};
        const merged = { ...existing, ...record };
        tableMap.set(pk, merged);
        return { error: null };
      },
      delete: () => {
        const delBuilder = {
          eq: async (col: string, val: any) => {
            const keysToDelete: string[] = [];
            tableMap.forEach((record, key) => {
              if (record[col] === val || key === val) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach((k) => tableMap.delete(k));
            return { error: null };
          }
        };
        return delBuilder;
      }
    };
    return queryBuilder;
  }

  auth = {
    getUser: async (_token: string) => {
      return {
        data: {
          user: {
            id: "mock_admin_user",
            email: "admin@diriyah.gov.sa",
            app_metadata: { role: "admin" }
          }
        },
        error: null
      };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      return {
        data: {
          session: { access_token: "mock_token_123" },
          user: {
            id: "mock_admin_user",
            email: email || "admin@diriyah.gov.sa",
            app_metadata: { role: "admin" }
          }
        },
        error: null
      };
    }
  };
}

export const serverSupabase = 
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        db: { schema: "public" },
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : (new InMemorySupabaseMock() as any);

if (!supabaseUrl || !supabaseKey) {
  console.warn("Server Supabase client not initialized (missing environment variables) — using in-memory mock storage fallback.");
}

