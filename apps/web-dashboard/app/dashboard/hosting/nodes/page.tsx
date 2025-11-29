// apps/web-dashboard/app/dashboard/hosting/nodes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Server, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface HostingNode {
  id: string;
  name: string;
  region: string;
  capabilities: string[];
  status: 'healthy' | 'degraded' | 'down';
}

export default function HostingNodesPage() {
  const [nodes, setNodes] = useState<HostingNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [form, setForm] = useState<{ id: string; name: string; region: string; capabilities: string; public_key?: string; status: 'healthy'|'degraded'|'down' }>({ id: '', name: '', region: '', capabilities: '', public_key: '', status: 'healthy' });

  useEffect(() => {
    loadNodes();
  }, []);

  async function loadNodes() {
    try {
      setLoading(true);
      const list = await api.getHostingNodes();
      setNodes(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load hosting nodes');
    } finally {
      setLoading(false);
    }
  }

  async function upsertNode() {
    try {
      if (!form.id || !form.name || !form.region) {
        toast.error('id, name, and region are required');
        return;
      }
      const capabilities = form.capabilities.split(',').map(s => s.trim()).filter(Boolean);
      await api.upsertHostingNode({ id: form.id, name: form.name, region: form.region, capabilities, public_key: form.public_key, status: form.status });
      toast.success('Node saved');
      setForm({ id: '', name: '', region: '', capabilities: '', public_key: '', status: 'healthy' });
      loadNodes();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save node');
    }
  }

  async function deleteNode(id: string) {
    try {
      await api.deleteHostingNode(id);
      toast.success('Node deleted');
      loadNodes();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete node');
    }
  }

  function statusStyles(s: HostingNode['status']) {
    switch (s) {
      case 'healthy': return 'text-green-700 bg-green-100 border-green-200';
      case 'degraded': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'down': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }

  return (
    <div className="space-y-6 relative z-[100]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hosting Nodes</h1>
          <p className="text-gray-600 mt-1">Edge nodes and regions available for decentralized hosting</p>
        </div>
        <Button onClick={loadNodes} variant="outline">
          <Activity className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">Edge Registry</CardTitle>
          <CardDescription className="text-gray-700">Discovered nodes with capabilities and health</CardDescription>
        </CardHeader>
        <CardContent className="relative z-50 bg-white">
          {isAdmin && (
            <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
              <h3 className="font-semibold mb-3 text-gray-900">Admin: Add / Update Node</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input className="border rounded px-3 py-2 bg-white text-gray-900" placeholder="id (unique)" value={form.id} onChange={e=>setForm({...form, id: e.target.value})} />
                <input className="border rounded px-3 py-2 bg-white text-gray-900" placeholder="name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                <input className="border rounded px-3 py-2 bg-white text-gray-900" placeholder="region (e.g., us-east)" value={form.region} onChange={e=>setForm({...form, region: e.target.value})} />
                <input className="border rounded px-3 py-2 md:col-span-2 bg-white text-gray-900" placeholder="capabilities (comma-separated)" value={form.capabilities} onChange={e=>setForm({...form, capabilities: e.target.value})} />
                <select className="border rounded px-3 py-2 bg-white text-gray-900" value={form.status} onChange={e=>setForm({...form, status: e.target.value as any})}>
                  <option value="healthy">healthy</option>
                  <option value="degraded">degraded</option>
                  <option value="down">down</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={upsertNode}>Save Node</Button>
                <Button variant="outline" className="bg-black text-white hover:bg-gray-800" onClick={()=>setForm({ id: '', name: '', region: '', capabilities: '', public_key: '', status: 'healthy' })}>Clear</Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading nodes...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No nodes discovered</h3>
              <p className="text-gray-600">Start by configuring edge providers and enabling decentralized hosting.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Network className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{n.name}</span>
                      <Badge className={statusStyles(n.status)}>{n.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Region: {n.region}</p>
                    <p className="text-xs text-gray-500">Capabilities: {n.capabilities.join(', ')}</p>
                  </div>
                  {isAdmin && (
                    <div>
                      <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700" onClick={() => deleteNode(n.id)}>Delete</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
