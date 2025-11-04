"use client"

import { AppShell } from "@/components/layout/AppShell"
import InstallBanner from "@/components/layout/InstallBanner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InstallBanner />
      <AppShell>{children}</AppShell>
    </>
  )
}
