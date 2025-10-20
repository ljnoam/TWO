export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'missing JSON body' }, { status: 400 });
  }
  const { endpoint } = body || {};
  if (!endpoint) return NextResponse.json({ error: 'missing endpoint' }, { status: 400 });

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

  // On supprime seulement l’abonnement de CE user pour cet endpoint
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
