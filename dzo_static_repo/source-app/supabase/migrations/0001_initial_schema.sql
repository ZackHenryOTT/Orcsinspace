create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  leader_member_id uuid null,
  status text not null default 'active' check (status in ('active','archived')),
  current_mission_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('dm','leader','player','observer')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  unique (campaign_id, user_id)
);

create table if not exists public.campaign_saves (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  revision integer not null,
  saved_by uuid not null references auth.users(id) on delete cascade,
  save_state jsonb not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, revision)
);

create table if not exists public.campaign_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  mission_id text not null,
  result text not null check (result in ('success','partial','failure')),
  alert integer not null default 0,
  pressure integer not null default 0,
  notes text null,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  invited_email text not null,
  invited_role text not null check (invited_role in ('dm','leader','player','observer')),
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_saves enable row level security;
alter table public.campaign_runs enable row level security;
alter table public.campaign_invites enable row level security;

create policy "members can read campaigns"
  on public.campaigns
  for select
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaigns.id
      and m.user_id = auth.uid()
    )
  );

create policy "members can read membership"
  on public.campaign_members
  for select
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_members.campaign_id
      and m.user_id = auth.uid()
    )
  );

create policy "members can read saves"
  on public.campaign_saves
  for select
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_saves.campaign_id
      and m.user_id = auth.uid()
    )
  );

create policy "members can read runs"
  on public.campaign_runs
  for select
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_runs.campaign_id
      and m.user_id = auth.uid()
    )
  );

create policy "members can read invites"
  on public.campaign_invites
  for select
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_invites.campaign_id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );

create policy "dm can insert campaign"
  on public.campaigns
  for insert
  with check (created_by = auth.uid());

create policy "dm can update campaign"
  on public.campaigns
  for update
  using (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaigns.id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );

create policy "dm can insert members"
  on public.campaign_members
  for insert
  with check (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_members.campaign_id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );

create policy "dm can insert saves"
  on public.campaign_saves
  for insert
  with check (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_saves.campaign_id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );

create policy "dm can insert runs"
  on public.campaign_runs
  for insert
  with check (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_runs.campaign_id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );

create policy "dm can insert invites"
  on public.campaign_invites
  for insert
  with check (
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = campaign_invites.campaign_id
      and m.user_id = auth.uid()
      and m.role = 'dm'
    )
  );
