// packages/database/src/repositories/hosting-nodes.ts
import { supabaseAdmin } from '../client';
import type { HostingNode } from '../types';

export class HostingNodeRepository {
  static async list(): Promise<HostingNode[]> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('hosting_nodes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as HostingNode[]) || [];
    } catch (_) {
      return [];
    }
  }

  static async upsert(node: Partial<HostingNode> & { id: string }): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('hosting_nodes')
        .upsert(node, { onConflict: 'id' });
      if (error) throw error;
    } catch (_) {
      // swallow for scaffold
    }
  }

  static async heartbeat(id: string, status: HostingNode['status'] = 'healthy'): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('hosting_nodes')
        .update({ status, last_heartbeat_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (_) {
      // swallow
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('hosting_nodes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (_) {
      // swallow
    }
  }
}
