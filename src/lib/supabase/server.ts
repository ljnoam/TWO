import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

/**
 * Crée un client Supabase côté serveur.
 * Compatible Next.js 15+ (cookies() & headers() asynchrones)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const headerList = await headers()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options as CookieOptions)
            } catch (e) {
              console.warn("[Supabase] Impossible de set un cookie côté serveur", e)
            }
          })
        },
      },
      headers: headerList,
    }
  )
}

/**
 * Récupère la session serveur active (user connecté).
 */
export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) throw error
  return { session, supabase }
}
