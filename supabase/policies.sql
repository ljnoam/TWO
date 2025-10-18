-- Activer RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.my_couple_status set (security_barrier = on); -- view simple

-- profiles: lecture/écriture propre à soi
create policy "profiles: read self" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: upsert self" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles: update self" on public.profiles
  for update using (id = auth.uid());

-- couples: lecture si membre
create policy "couples: read if member" on public.couples
  for select using (exists (
    select 1 from public.couple_members cm where cm.couple_id = id and cm.user_id = auth.uid()
  ));

-- Interdiction d’insert/update/delete direct côté client (on passe par RPC)
-- => pas de policy d’insert/update/delete sur couples & couple_members

-- couple_members: lecture uniquement de sa propre ligne
create policy "members: read own membership" on public.couple_members
  for select using (user_id = auth.uid());
