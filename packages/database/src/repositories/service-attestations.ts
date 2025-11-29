// packages/database/src/repositories/service-attestations.ts
import { supabaseAdmin } from '../client';
import type { ServiceAttestation } from '../types';

export class ServiceAttestationRepository {
  static async create(att: Omit<ServiceAttestation, 'created_at'>): Promise<ServiceAttestation | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('service_attestations')
        .insert(att)
        .select('*')
        .single();
      if (error) throw error;
      return data as ServiceAttestation;
    } catch (_) {
      return null;
    }
  }

  static async listByService(serviceId: string): Promise<ServiceAttestation[]> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('service_attestations')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as ServiceAttestation[]) || [];
    } catch (_) {
      return [];
    }
  }
}
