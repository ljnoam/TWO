export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';

// VAPID configuration for Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  // Parse body once
  let bodyJson: any = {};
  try { bodyJson = await req.json(); } catch {}
  const { type, notePreview, bucketTitle, eventTitle, starts_at } = bodyJson || {};

  const cookieStore = await nextCookies();
  const hdrs = await nextHeaders();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // cookieStore.getAll est OK une fois cookies() awaited
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // CookieOptions vient de @supabase/ssr
            cookieStore.set(name, value, options as CookieOptions);
          });
        },
      },
      headers: hdrs,
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Fetch partner subscriptions using RLS "same couple" policy
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 400 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true });

  // Compose payload
  let title = 'Nouveau mot doux';
  let message = notePreview ? String(notePreview).slice(0, 100) : 'Tu as reçu un message !';
  let url = '/notes';

  if (type === 'bucket') {
    title = 'Nouvelle idée ajoutée';
    message = bucketTitle
      ? `${bucketTitle} vient d’être ajoutée à votre bucket list !`
      : 'Une nouvelle idée a été ajoutée à votre bucket list !';
    url = '/bucket';
  } else if (type === 'event') {
    title = 'Nouvel évènement';
    const when = starts_at ? new Date(starts_at).toLocaleString('fr-FR') : '';
    message = eventTitle ? `${eventTitle}${when ? ' · ' + when : ''}` : (when || 'Un évènement a été planifié');
    url = '/calendar';
  }

  const payload = JSON.stringify({ title, body: message, url });

  // Send notifications; prune invalid endpoints (410/404)
  const results = await Promise.allSettled(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      } as webpush.PushSubscription;
      try {
        await webpush.sendNotification(subscription, payload);
        return { ok: true };
      } catch (err: any) {
        const code = err?.statusCode;
        if (code === 404 || code === 410) {
          // Silently remove stale endpoint
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
        return { ok: false, error: code || err?.message };
      }
    })
  );

  return NextResponse.json({ ok: true, results });
}

