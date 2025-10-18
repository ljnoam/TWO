export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { cookies as nextCookies, headers } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';

// Configuration des clés VAPID pour Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  // On récupère le corps de la requête
  const { notePreview, bucketTitle, type } = await req.json();

  // Connexion côté serveur à Supabase
  const cookieStore = nextCookies();
  const supabase = createServerClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
   {
     cookies: {
       getAll() {
         return cookieStore.getAll();
       },
       setAll(cookiesToSet) {
         cookiesToSet.forEach(({ name, value, options }) => {
           cookieStore.set(name, value, options as CookieOptions);
         });
       },
     },
     headers,
   }
 );

  // Vérification que l’utilisateur est bien connecté
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // On retrouve le couple du user connecté
  const { data: me } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me?.couple_id) return NextResponse.json({ error: 'no couple' }, { status: 400 });

  // On récupère son/sa partenaire
  const { data: partners } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', me.couple_id)
    .neq('user_id', user.id);

  const partnerId = partners?.[0]?.user_id;
  if (!partnerId) return NextResponse.json({ ok: true });

  // On récupère les abonnements push du partenaire
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', partnerId);

  if (!subs?.length) return NextResponse.json({ ok: true });

  // --- 🔔 Définition du message selon le type ---
  let title = '💌 Nouveau mot doux';
  let body = notePreview ? notePreview.slice(0, 100) : 'Tu as reçu un message !';
  let url = '/notes';

  if (type === 'bucket') {
    title = '🪣 Nouvelle idée ajoutée';
    body = bucketTitle
      ? `« ${bucketTitle} » vient d’être ajoutée à votre bucket list !`
      : 'Une nouvelle idée a été ajoutée à votre bucket list !';
    url = '/bucket';
  }

  const payload = JSON.stringify({ title, body, url });

  // Envoi de la notif à tous les endpoints enregistrés du partenaire
  const results = await Promise.allSettled(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      } as webpush.PushSubscription;

      await webpush.sendNotification(subscription, payload);
      return { ok: true };
    })
  );

  return NextResponse.json({ ok: true, results });
}
