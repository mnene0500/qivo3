"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"

/**
 * List of paths where the Bottom Navigation MUST be visible.
 * All other paths (details, settings, forms, calls) will have the nav hidden.
 */
const SHOW_NAV_PATHS = [
  '/home',
  '/chats',
  '/profile'
]

/**
 * @fileOverview Global App Shell that keeps the BottomNav persistent and stable.
 * Only shows the navigation bar on core top-level screens.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Only show nav if current path matches our allowed core screens
  const isVisible = SHOW_NAV_PATHS.includes(pathname || "")

  return (
    <div className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {isVisible && <BottomNav />}
    </div>
  )
}
