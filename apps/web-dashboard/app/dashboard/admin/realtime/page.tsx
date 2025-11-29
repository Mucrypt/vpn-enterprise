"use client";
import React, { useEffect, useState } from 'react';

export default function AdminRealtimePage() {
  const [subs, setSubs] = useState<{key:string;count:number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [tenantId, setTenantId] = useState('tenant_demo');
  const [table, setTable] = useState('public.test_table');
  const [op, setOp] = useState<'UPDATE'|'INSERT'|'DELETE'>('UPDATE');
  const [adminToken, setAdminToken] = useState('');

  async function load() {
    setLoading(true); setError(null);
    try {
      const resp = await fetch('/api/v1/realtime/subscriptions');
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed');
      setSubs(json.subscriptions || []);
    } catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); const id=setInterval(load,5000); return ()=>clearInterval(id); },[]);

  async function sendMock() {
    try {
      const resp = await fetch('/api/v1/realtime/mock', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body: JSON.stringify({ tenantId, table, op, row:{ id: Math.random(), demo:true, ts: new Date().toISOString() } })
      });
      if (!resp.ok) alert('Mock failed');
    } catch(e:any){ alert(e.message); }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Realtime Subscriptions</h1>
        <p className="text-sm text-gray-600">Admin view of active websocket subscriptions with mock broadcast controls.</p>
      </div>
      <div className="border rounded p-4 bg-white space-y-3">
        <h2 className="text-lg font-medium">Mock Broadcast</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Tenant ID" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="schema.table" value={table} onChange={e=>setTable(e.target.value)} />
          <select className="border rounded px-2 py-1" value={op} onChange={e=>setOp(e.target.value as any)}>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="Admin Token" value={adminToken} onChange={e=>setAdminToken(e.target.value)} />
          <button onClick={sendMock} className="px-3 py-1 bg-indigo-600 text-white rounded">Send Mock</button>
        </div>
      </div>
      <div className="border rounded p-4 bg-white">
        <h2 className="text-lg font-medium mb-2">Active Subscriptions</h2>
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {subs.length === 0 && !loading && <div className="text-xs text-gray-500">None</div>}
        <div className="space-y-1 max-h-64 overflow-auto">
          {subs.map(s=> (
            <div key={s.key} className="text-xs font-mono flex items-center justify-between border rounded px-2 py-1">
              <span>{s.key}</span>
              <span className="text-gray-500">clients:{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
