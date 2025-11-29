// packages/database/src/repositories/edge-distributions.ts
import { supabaseAdmin } from '../client';
import type { EdgeDistribution } from '../types';

export class EdgeDistributionRepository {
  static async create(dist: Omit<EdgeDistribution, 'created_at'>): Promise<EdgeDistribution | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('edge_distributions')
        .insert(dist)
        .select('*')
        .single();
      if (error) throw error;
      return data as EdgeDistribution;
    } catch (_) {
      return null;
    }
  }

  static async listByService(serviceId: string): Promise<EdgeDistribution[]> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('edge_distributions')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as EdgeDistribution[]) || [];
    } catch (_) {
      return [];
    }
  }
}
