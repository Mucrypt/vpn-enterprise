import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@vpn-enterprise/database/src/types';

export class SupabaseDatabase {
  private static instance: SupabaseClient<Database>;
  private static serviceInstance: SupabaseClient<Database>;

  /**
   * Get Supabase client instance (Singleton pattern)
   */
  public static getClient(): SupabaseClient<Database> {
    if (!SupabaseDatabase.instance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
        );
      }

      SupabaseDatabase.instance = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      });
    }

    return SupabaseDatabase.instance;
  }

  /**
   * Create a new client with service role key (for admin operations)
   */
  public static getServiceClient(): SupabaseClient<Database> {
    if (!SupabaseDatabase.serviceInstance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
          'Missing Supabase service credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        );
      }

      SupabaseDatabase.serviceInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return SupabaseDatabase.serviceInstance;
  }

  /**
   * Get untyped client (for operations with type inference issues)
   */
  public static getUntypedClient(): any {
    return SupabaseDatabase.getClient() as any;
  }

  /**
   * Get untyped admin client (for operations with type inference issues)
   */
  public static getUntypedAdminClient(): any {
    return SupabaseDatabase.getServiceClient() as any;
  }
}

// Helper getters for lazy initialization
export const getSupabase = () => SupabaseDatabase.getClient();
export const getSupabaseAdmin = () => SupabaseDatabase.getServiceClient();
export const getSupabaseUntyped = () => SupabaseDatabase.getUntypedClient();
export const getSupabaseAdminUntyped = () => SupabaseDatabase.getUntypedAdminClient();

// Lazy-loaded exports
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (target, prop) => {
    const client = getSupabase();
    return (client as any)[prop];
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get: (target, prop) => {
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  }
});

export const supabaseUntyped = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getSupabaseUntyped();
    return client[prop];
  }
});

export const supabaseAdminUntyped = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getSupabaseAdminUntyped();
    return client[prop];
  }
});
