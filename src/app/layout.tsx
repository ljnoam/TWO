import "../styles/globals.css"
import Providers from "./providers"
import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
}

export const metadata = {
  title: "TWO",
  description: "App de couple",
  manifest: "/manifest.json?v=20251023",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Nous",
    statusBarStyle: "black-translucent",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 🔐 Auth côté serveur (Supabase)
  const cookieStore = await cookies()
  const hdrs = await headers()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as any)
          ),
      },
      headers: hdrs,
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const hasSession = !!session

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`
          min-h-screen
          bg-white text-neutral-900
          dark:bg-neutral-950 dark:text-neutral-50
          font-sans antialiased
        `}
        data-has-session={hasSession ? "1" : "0"}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
