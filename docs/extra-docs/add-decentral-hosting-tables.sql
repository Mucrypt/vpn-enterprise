-- Decentralized Hosting Tables (Run in Supabase SQL editor)

-- 1) hosting_nodes
create table if not exists public.hosting_nodes (
  id text primary key,
  name text not null,
  region text not null,
  capabilities text[] not null default '{}',
  public_key text,
  status text not null default 'healthy' check (status in ('healthy','degraded','down')),
  last_heartbeat_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2) service_attestations
create table if not exists public.service_attestations (
  id text primary key,
  service_id uuid not null references public.hosted_services(id) on delete cascade,
  type text not null check (type in ('attest','deploy','backup','scale')),
  hash text not null,
  signer text,
  tx_ref text,
  created_at timestamp with time zone default now()
);

-- 3) edge_distributions
create table if not exists public.edge_distributions (
  id text primary key,
  service_id uuid not null references public.hosted_services(id) on delete cascade,
  target_regions text[] not null,
  artifact_hash text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.hosting_nodes enable row level security;
alter table public.service_attestations enable row level security;
alter table public.edge_distributions enable row level security;

-- Policies (example):
-- Nodes: read for authenticated, write for admins (adjust roles accordingly)
-- NOTE: PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY
-- Use DROP POLICY IF EXISTS + CREATE POLICY instead
drop policy if exists "hosting_nodes_read" on public.hosting_nodes;
create policy "hosting_nodes_read" on public.hosting_nodes
for select to authenticated using (true);

-- Attestations & distributions: owner or admin
drop policy if exists "attestations_read_owner" on public.service_attestations;
create policy "attestations_read_owner" on public.service_attestations
for select to authenticated using (
  exists (
    select 1 from public.hosted_services hs
    where hs.id = service_attestations.service_id
      and hs.user_id = auth.uid()
  )
);

drop policy if exists "edge_distributions_read_owner" on public.edge_distributions;
create policy "edge_distributions_read_owner" on public.edge_distributions
for select to authenticated using (
  exists (
    select 1 from public.hosted_services hs
    where hs.id = edge_distributions.service_id
      and hs.user_id = auth.uid()
  )
);

-- Optional: Seed a few edge nodes for local testing (idempotent)
insert into public.hosting_nodes (id, name, region, capabilities, public_key, status)
values
  ('edge-us-east', 'US East', 'us-east', array['static','compute'], null, 'healthy'),
  ('edge-eu-west', 'EU West', 'eu-west', array['static'], null, 'healthy'),
  ('edge-af-south', 'Africa South', 'af-south', array['static'], null, 'degraded')
on conflict (id) do update set
  name = excluded.name,
  region = excluded.region,
  capabilities = excluded.capabilities,
  status = excluded.status,
  last_heartbeat_at = now();
