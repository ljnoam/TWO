import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import InstallBanner from "@/components/layout/InstallBanner"
import { AppShell } from "@/components/layout/AppShell"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: ReactNode }) {
  // ✅ Il faut await ici
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("[supabase] session error", error)
    throw error
  }

  if (!session) {
    redirect("/login")
  }

  return (
    <>
      <InstallBanner />
      <AppShell>{children}</AppShell>
    </>
  )
}
