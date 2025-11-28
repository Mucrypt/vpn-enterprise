// Hosting repositories for plans and services
import { supabaseAdmin } from '../client';
import type { HostingPlan, HostedService } from '../types';

export class HostingPlanRepository {
  static async list(type?: string): Promise<HostingPlan[]> {
    try {
      let query = (supabaseAdmin as any).from('hosting_plans').select('*');
      const { data, error } = type ? await query.eq('type', type) : await query;
      if (error) throw error;
      const rows = (data as HostingPlan[]) || [];
      if (rows.length > 0) return rows;
    } catch (_) {
      // ignore and return fallback below
    }
    // Fallback defaults when table is empty or unavailable
    const defaults: HostingPlan[] = [
      {
        id: 'wp-basic',
        name: 'WordPress Basic',
        type: 'wordpress',
        resources: { cpu: 0.5, memory: '512MB', storage: '10GB' },
        price_monthly: 5,
        price_yearly: 50,
        features: ['auto-backups', 'SSL'],
        max_websites: 1,
        storage_gb: 10,
        bandwidth_gb: 50,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mc-std',
        name: 'Minecraft Standard',
        type: 'game_server',
        resources: { cpu: 1.0, memory: '2GB', storage: '20GB' },
        price_monthly: 10,
        price_yearly: 100,
        features: ['daily-backups'],
        max_websites: 0,
        storage_gb: 20,
        bandwidth_gb: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'discord-bot',
        name: 'Discord Bot Starter',
        type: 'discord_bot',
        resources: { cpu: 0.2, memory: '256MB', storage: '1GB' },
        price_monthly: 3,
        price_yearly: 30,
        features: ['uptime-monitoring'],
        max_websites: 0,
        storage_gb: 1,
        bandwidth_gb: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    return type ? defaults.filter(p => p.type === type) : defaults;
  }
}

export class HostedServiceRepository {
  static async create(payload: HostedService): Promise<HostedService> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('hosted_services')
        .insert({
          user_id: payload.user_id,
          plan_id: payload.plan_id,
          name: payload.name,
          domain: payload.domain || null,
          config: (payload as any).config || {},
          status: (payload as any).status || 'creating',
        })
        .select()
        .single();
      if (error) throw error;
      return data as HostedService;
    } catch (_) {
      return { ...payload, id: `svc_${Date.now()}`, created_at: new Date().toISOString() } as HostedService;
    }
  }

  static async listByUser(userId: string): Promise<HostedService[]> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('hosted_services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as HostedService[]) || [];
    } catch (_) {
      return [];
    }
  }

  static async getById(id: string): Promise<HostedService | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('hosted_services')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return (data as HostedService) || null;
    } catch (_) {
      return null;
    }
  }
}
