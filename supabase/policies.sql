[
  {
    "schema": "public",
    "table_name": "bucket_items",
    "policy_name": "bucket: delete by member",
    "command": "d",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = bucket_items.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "bucket_items",
    "policy_name": "bucket: insert by member",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "((EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = bucket_items.couple_id) AND (cm.user_id = auth.uid())))) AND (author_id = auth.uid()))",
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "bucket_items",
    "policy_name": "bucket: select in couple",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = bucket_items.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "bucket_items",
    "policy_name": "bucket: update by member",
    "command": "w",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = bucket_items.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couple_members",
    "policy_name": "members: read own membership",
    "command": "r",
    "using_expression": "(user_id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couples",
    "policy_name": "couples: read if member",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = couples.id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "love_notes",
    "policy_name": "notes: delete by couple member",
    "command": "d",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = love_notes.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "love_notes",
    "policy_name": "notes: insert by couple member",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "((EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = love_notes.couple_id) AND (cm.user_id = auth.uid())))) AND (author_id = auth.uid()))",
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "love_notes",
    "policy_name": "notes: select if same couple",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = love_notes.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: read self",
    "command": "r",
    "using_expression": "(id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: select own",
    "command": "r",
    "using_expression": "(id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: select same couple",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM (couple_members cm1\n     JOIN couple_members cm2 ON ((cm1.couple_id = cm2.couple_id)))\n  WHERE ((cm1.user_id = auth.uid()) AND (cm2.user_id = profiles.id))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: update own",
    "command": "w",
    "using_expression": "(id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: update self",
    "command": "w",
    "using_expression": "(id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "profiles",
    "policy_name": "profiles: upsert self",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "(id = auth.uid())",
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "push_subscriptions",
    "policy_name": "push: delete own",
    "command": "d",
    "using_expression": "(user_id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "push_subscriptions",
    "policy_name": "push: insert own",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "(user_id = auth.uid())",
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "push_subscriptions",
    "policy_name": "push: select in same couple",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM (couple_members cm1\n     JOIN couple_members cm2 ON ((cm1.couple_id = cm2.couple_id)))\n  WHERE ((cm1.user_id = auth.uid()) AND (cm2.user_id = push_subscriptions.user_id) AND (cm1.user_id <> cm2.user_id))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "push_subscriptions",
    "policy_name": "push: select own",
    "command": "r",
    "using_expression": "(user_id = auth.uid())",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "storage",
    "table_name": "objects",
    "policy_name": "avatars: public read",
    "command": "r",
    "using_expression": "(bucket_id = 'avatars'::text)",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "storage",
    "table_name": "objects",
    "policy_name": "avatars: user can insert own",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
    "roles": [
      0
    ]
  },
  {
    "schema": "storage",
    "table_name": "objects",
    "policy_name": "avatars: user delete own",
    "command": "d",
    "using_expression": "((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "storage",
    "table_name": "objects",
    "policy_name": "avatars: user update own",
    "command": "w",
    "using_expression": "((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couple_events",
    "policy_name": "events: select in couple",
    "command": "r",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = couple_events.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couple_events",
    "policy_name": "events: insert by member",
    "command": "a",
    "using_expression": null,
    "with_check_expression": "((EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = couple_events.couple_id) AND (cm.user_id = auth.uid())))) AND (author_id = auth.uid()))",
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couple_events",
    "policy_name": "events: update by member",
    "command": "w",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = couple_events.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  },
  {
    "schema": "public",
    "table_name": "couple_events",
    "policy_name": "events: delete by member",
    "command": "d",
    "using_expression": "(EXISTS ( SELECT 1\n   FROM couple_members cm\n  WHERE ((cm.couple_id = couple_events.couple_id) AND (cm.user_id = auth.uid()))))",
    "with_check_expression": null,
    "roles": [
      0
    ]
  }
]



[
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_couple_members_limit()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nbegin\r\n  if (select count(*) from couple_members where couple_id = new.couple_id) >= 2 then\r\n    raise exception 'Ce couple est déjà complet (maximum 2 membres)';\r\n  end if;\r\n  return new;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_couple(p_started_at date)\n RETURNS TABLE(couple_id uuid, join_code text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  uid uuid := auth.uid();\r\n  new_cpl uuid;\r\n  code text;\r\nbegin\r\n  if uid is null then\r\n    raise exception 'Non authentifié';\r\n  end if;\r\n\r\n  if exists (select 1 from public.couple_members cm where cm.user_id = uid) then\r\n    raise exception 'Déjà dans un couple';\r\n  end if;\r\n\r\n  code := upper(substr(md5(gen_random_uuid()::text), 1, 6));\r\n\r\n  insert into public.couples(id, join_code, started_at, created_by)\r\n  values (gen_random_uuid(), code, p_started_at, uid)\r\n  returning id into new_cpl;\r\n\r\n  insert into public.couple_members(user_id, couple_id)\r\n  values (uid, new_cpl);\r\n\r\n  return query select new_cpl as couple_id, code as join_code;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.enforce_max_two_members()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\ndeclare cnt int;\r\nbegin\r\n  select count(*) into cnt\r\n  from public.couple_members cm\r\n  where cm.couple_id = NEW.couple_id;\r\n\r\n  if cnt >= 2 then\r\n    raise exception 'Ce couple a déjà 2 membres';\r\n  end if;\r\n\r\n  return NEW;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.ensure_max_two_members()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  member_count int;\r\nbegin\r\n  select count(*) into member_count\r\n  from public.couple_members\r\n  where couple_id = new.couple_id;\r\n\r\n  if member_count >= 2 then\r\n    raise exception 'Ce couple a déjà 2 membres.';\r\n  end if;\r\n\r\n  return new;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.gen_join_code()\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\r\ndeclare\r\n  code text;\r\nbegin\r\n  loop\r\n    -- code court, lisible, 6 chars\r\n    code := upper(substr(md5(gen_random_uuid()::text), 1, 6));\r\n    exit when not exists (select 1 from public.couples where join_code = code);\r\n  end loop;\r\n  return code;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_new_user()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nbegin\r\n  insert into public.profiles (id, created_at, display_name)\r\n  values (new.id, now(), split_part(new.email, '@', 1))\r\n  on conflict (id) do nothing;\r\n  return new;\r\nend;\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.is_member_of_couple(_couple_id uuid)\n RETURNS boolean\n LANGUAGE sql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  select exists (\r\n    select 1\r\n    from public.couple_members\r\n    where couple_id = _couple_id\r\n      and user_id   = auth.uid()\r\n  );\r\n$function$\n"
  },
  {
    "function_definition": "CREATE OR REPLACE FUNCTION public.join_couple(p_join_code text)\n RETURNS TABLE(couple_id uuid)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\ndeclare\r\n  uid uuid := auth.uid();\r\n  target uuid;\r\n  members int;\r\nbegin\r\n  if uid is null then\r\n    raise exception 'Non authentifié';\r\n  end if;\r\n\r\n  if exists (select 1 from public.couple_members cm where cm.user_id = uid) then\r\n    raise exception 'Déjà dans un couple';\r\n  end if;\r\n\r\n  select c.id into target\r\n  from public.couples c\r\n  where c.join_code = upper(p_join_code);\r\n\r\n  if target is null then\r\n    raise exception 'Code invalide';\r\n  end if;\r\n\r\n  select count(*) into members\r\n  from public.couple_members cm\r\n  where cm.couple_id = target;\r\n\r\n  if members >= 2 then\r\n    raise exception 'Ce couple est complet';\r\n  end if;\r\n\r\n  insert into public.couple_members(user_id, couple_id)\r\n  values (uid, target);\r\n\r\n  return query select target as couple_id;\r\nend;\r\n$function$\n"
  }
]
