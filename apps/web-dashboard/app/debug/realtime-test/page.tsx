"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function RealtimeTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [tenantId, setTenantId] = useState('tenant_demo');
  const [token, setToken] = useState('dev');
  const [table, setTable] = useState('public.test_table');
  const [filter, setFilter] = useState('{}');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [latencySeries, setLatencySeries] = useState<number[]>([]);
  const [subs, setSubs] = useState<{key:string;count:number}[]>([]);
  const [adminToken, setAdminToken] = useState('');
  const reconnectAttemptsRef = useRef(0);
  const heartbeatSentRef = useRef<number>(Date.now());

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/api/v1/realtime?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`;
    const connect = () => {
      const socket = new WebSocket(url);
      socket.onopen = () => {
        setLogs((l) => [...l, 'WebSocket connected']);
        reconnectAttemptsRef.current = 0;
      };
      socket.onmessage = (ev) => {
        setLogs((l) => [...l, `Message: ${ev.data}`]);
        try {
          const parsed = JSON.parse(String(ev.data));
          if (parsed?.type === 'heartbeat') {
            const now = Date.now();
            const diff = now - heartbeatSentRef.current;
            setLatencyMs(diff);
            setLatencySeries(s => {
              const next = [...s, diff];
              return next.slice(-40);
            });
            heartbeatSentRef.current = now;
          }
        } catch {}
      };
      socket.onerror = () => setLogs((l) => [...l, 'WebSocket error']);
      socket.onclose = () => {
        setLogs((l) => [...l, 'WebSocket closed']);
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const delay = Math.min(1000 * Math.pow(2, attempt), 15000);
        setLogs((l) => [...l, `Reconnecting in ${delay}ms (attempt ${attempt})`]);
        setTimeout(connect, delay);
      };
      setWs(socket);
    };
    connect();
    return () => ws?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const resp = await fetch('/api/v1/realtime/subscriptions');
        if (resp.ok) {
          const json = await resp.json();
          setSubs(json.subscriptions || []);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const subscribe = () => {
    if (!ws) return;
    try {
      const f = JSON.parse(filter || '{}');
      ws.send(JSON.stringify({ action: 'subscribe', table, filter: f }));
      setLogs((l) => [...l, `Sent subscribe for ${table}`]);
    } catch (e: any) {
      setLogs((l) => [...l, `Filter JSON error: ${e.message || String(e)}`]);
    }
  };

  const sendMock = async () => {
    try {
      const row = { id: Math.random(), demo: true, ts: new Date().toISOString() };
      const resp = await fetch('/api/v1/realtime/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ tenantId, table, op: 'UPDATE', row })
      });
      if (resp.ok) setLogs((l) => [...l, 'Mock event broadcast']);
      else setLogs((l) => [...l, 'Mock broadcast failed']);
    } catch {
      setLogs((l) => [...l, 'Mock broadcast error']);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Realtime WS Debug</h1>
      <p className="text-sm text-gray-600 flex items-center gap-4"><span>Connects to <code>/api/v1/realtime</code>. Latency: {latencyMs !== null ? `${latencyMs}ms` : 'n/a'}</span>
        <span>
          <svg width="120" height="30" viewBox="0 0 120 30" className="overflow-visible">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              points={latencySeries.map((v,i)=>{
                const x = (i/(Math.max(latencySeries.length-1,1)))*120;
                const max = Math.max(...latencySeries, 50);
                const y = 30 - (v/max)*28 - 1;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 space-y-2">
          <div className="space-y-2">
            <label className="block text-sm">Tenant ID</label>
            <input className="border rounded p-2 w-full" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Token</label>
            <input className="border rounded p-2 w-full" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Table (schema.table)</label>
            <input className="border rounded p-2 w-full" value={table} onChange={(e) => setTable(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Filter (JSON)</label>
            <textarea className="border rounded p-2 w-full h-24 font-mono text-xs" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1 rounded bg-emerald-600 text-white text-sm" onClick={subscribe}>Subscribe</button>
            <button className="px-3 py-1 rounded bg-rose-600 text-white text-sm" onClick={()=>{ if(ws){ ws.send(JSON.stringify({ action:'unsubscribe', table })); setLogs(l=>[...l,'Unsubscribe request sent']); } }}>Unsubscribe</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm" onClick={sendMock}>Send Mock</button>
          </div>
        </div>
        <div className="border rounded p-3 bg-gray-50">
          {logs.map((l, i) => (<div key={i} className="text-xs font-mono">{l}</div>))}
        </div>
      </div>
      <div className="border rounded p-3 bg-white">
        <label className="block text-sm mb-1">Admin Token (for mock endpoint)</label>
        <input className="border rounded p-2 w-full" value={adminToken} onChange={(e)=>setAdminToken(e.target.value)} />
      </div>
      <div className="border rounded p-3 bg-white shadow">
        <h2 className="text-sm font-semibold mb-2">Active Subscriptions</h2>
        {subs.length === 0 && <div className="text-xs text-gray-500">None</div>}
        {subs.map(s => <div key={s.key} className="text-xs font-mono flex items-center justify-between">
          <span>{s.key} (clients: {s.count})</span>
          <button
            className="ml-2 px-2 py-0.5 rounded bg-red-600 text-white"
            onClick={()=>{
              if (!ws) return;
              try { ws.send(JSON.stringify({ action: 'unsubscribe', table: s.key.split(':')[1] })); setLogs(l=>[...l, 'Sent unsubscribe for '+s.key]); } catch {}
            }}>×</button>
        </div>)}
      </div>
    </div>
  );
}
