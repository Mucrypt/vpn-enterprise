"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type AssocResponse = {
  userId: string;
  tenants: Array<{ tenant_id: string; name?: string | null }>;
};

export default function TenantAssociationsPage() {
  const [data, setData] = useState<AssocResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/tenants/me/associations`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed (${res.status})`);
        }
        const json = (await res.json()) as AssocResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Tenant Associations</h1>
        <p className="text-sm text-muted-foreground">Select a tenant to open the SQL editor scoped to it.</p>
      </div>

      {loading && <div>Loading associations…</div>}
      {error && (
        <div className="text-red-600">Error: {error}</div>
      )}

      {!!data && (
        <ul className="divide-y rounded-md border">
          {data.tenants.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">No tenant associations found.</li>
          )}
          {data.tenants.map((t) => {
            const name = t.name || t.tenant_id;
            const href = `/dashboard/databases?tenantId=${encodeURIComponent(t.tenant_id)}`;
            return (
              <li key={t.tenant_id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">tenant_id: {t.tenant_id}</div>
                </div>
                <Link className="text-primary hover:underline" href={href}>
                  Open SQL Editor
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
