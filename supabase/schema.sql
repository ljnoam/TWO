-- Extensions utiles
create extension if not exists pgcrypto;

-- profils alignés sur auth.users (on garde simple)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- couples
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,          -- code partage
  started_at date not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- membership: 1 user -> 1 couple (unique), 2 membres max par couple (via trigger)
create table public.couple_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  role text default 'partner',
  joined_at timestamptz default now()
);

-- 🔒 1 user = 1 couple
create unique index on public.couple_members(user_id);

-- helper pour status rapide
create view public.my_couple_status as
select
  cm.user_id,
  c.id as couple_id,
  c.join_code,
  c.started_at,
  (select count(*) from public.couple_members cm2 where cm2.couple_id = c.id) as members_count
from public.couple_members cm
join public.couples c on c.id = cm.couple_id;

-- ==== Génération de code court (6 alphanum) ====
create or replace function public.gen_join_code()
returns text language plpgsql as $$
declare code text;
begin
  loop
    code := upper(substr(encode(digest(gen_random_uuid()::text, 'sha1'), 'hex'), 1, 6));
    exit when not exists (select 1 from public.couples where join_code = code);
  end loop;
  return code;
end;
$$;

-- ==== Trigger: max 2 membres par couple ====
create or replace function public.enforce_max_two_members()
returns trigger language plpgsql as $$
declare cnt int;
begin
  select count(*) into cnt from public.couple_members where couple_id = new.couple_id;
  if cnt >= 2 then
    raise exception 'Ce couple a déjà 2 membres';
  end if;
  return new;
end;
$$;

create trigger trg_max_two_members
before insert on public.couple_members
for each row execute function public.enforce_max_two_members();

-- ==== RPC sécurisées (SECURITY DEFINER) ====

-- Créer un couple + ajouter l’utilisateur courant
create or replace function public.create_couple(p_started_at date)
returns table (couple_id uuid, join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
declare new_couple_id uuid;
declare code text;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  -- refuse si déjà membre d’un couple
  if exists (select 1 from public.couple_members where user_id = uid) then
    raise exception 'Déjà dans un couple';
  end if;

  code := public.gen_join_code();

  insert into public.couples(id, join_code, started_at, created_by)
  values (gen_random_uuid(), code, p_started_at, uid)
  returning id into new_couple_id;

  insert into public.couple_members(user_id, couple_id) values (uid, new_couple_id);

  return query select new_couple_id, code;
end;
$$;

-- Rejoindre un couple via code
create or replace function public.join_couple(p_join_code text)
returns table (couple_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
declare target uuid;
declare members int;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  if exists (select 1 from public.couple_members where user_id = uid) then
    raise exception 'Déjà dans un couple';
  end if;

  select id into target from public.couples where join_code = upper(p_join_code);
  if target is null then
    raise exception 'Code invalide';
  end if;

  select count(*) into members from public.couple_members where couple_id = target;
  if members >= 2 then
    raise exception 'Ce couple est complet';
  end if;

  insert into public.couple_members(user_id, couple_id) values (uid, target);

  return query select target;
end;
$$;
