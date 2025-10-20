-- Idempotent migration: RLS for couple_events, indexes, realtime publication
-- Safe to re-run.

-- Ensure RLS enabled on key tables
alter table if exists public.love_notes enable row level security;
alter table if exists public.bucket_items enable row level security;
alter table if exists public.couple_events enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.push_subscriptions enable row level security;
alter table if exists public.couples enable row level security;
alter table if exists public.couple_members enable row level security;

-- Couple events policies (CRUD for couple members; insert requires author_id = auth.uid())
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='couple_events' and policyname='events: select in couple'
  ) then
    execute $$create policy "events: select in couple" on public.couple_events
      for select using (
        exists (
          select 1 from public.couple_members cm
          where cm.couple_id = couple_events.couple_id
            and cm.user_id   = auth.uid()
        )
      );$$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='couple_events' and policyname='events: insert by member'
  ) then
    execute $$create policy "events: insert by member" on public.couple_events
      for insert with check (
        exists (
          select 1 from public.couple_members cm
          where cm.couple_id = couple_events.couple_id
            and cm.user_id   = auth.uid()
        ) and author_id = auth.uid()
      );$$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='couple_events' and policyname='events: update by member'
  ) then
    execute $$create policy "events: update by member" on public.couple_events
      for update using (
        exists (
          select 1 from public.couple_members cm
          where cm.couple_id = couple_events.couple_id
            and cm.user_id   = auth.uid()
        )
      );$$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='couple_events' and policyname='events: delete by member'
  ) then
    execute $$create policy "events: delete by member" on public.couple_events
      for delete using (
        exists (
          select 1 from public.couple_members cm
          where cm.couple_id = couple_events.couple_id
            and cm.user_id   = auth.uid()
        )
      );$$;
  end if;
end $$;

-- Useful indexes
create index if not exists idx_love_notes_couple_created_at on public.love_notes (couple_id, created_at desc);
create index if not exists idx_bucket_items_couple_done_created_at on public.bucket_items (couple_id, is_done, created_at desc);
create index if not exists idx_couple_events_couple_starts_at on public.couple_events (couple_id, starts_at);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions (user_id);

-- Ensure tables are part of the supabase_realtime publication
do $$
declare
  pub_oid oid;
  rel_oid oid;
begin
  select oid into pub_oid from pg_publication where pubname = 'supabase_realtime';
  if pub_oid is not null then
    -- love_notes
    select c.oid into rel_oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where c.relname='love_notes' and n.nspname='public';
    if rel_oid is not null and not exists (
      select 1 from pg_publication_rel where prpubid = pub_oid and prrelid = rel_oid
    ) then
      execute 'alter publication supabase_realtime add table public.love_notes';
    end if;

    -- bucket_items
    select c.oid into rel_oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where c.relname='bucket_items' and n.nspname='public';
    if rel_oid is not null and not exists (
      select 1 from pg_publication_rel where prpubid = pub_oid and prrelid = rel_oid
    ) then
      execute 'alter publication supabase_realtime add table public.bucket_items';
    end if;

    -- couple_events
    select c.oid into rel_oid from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where c.relname='couple_events' and n.nspname='public';
    if rel_oid is not null and not exists (
      select 1 from pg_publication_rel where prpubid = pub_oid and prrelid = rel_oid
    ) then
      execute 'alter publication supabase_realtime add table public.couple_events';
    end if;
  end if;
end $$;

