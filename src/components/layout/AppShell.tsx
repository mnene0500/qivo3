"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense } from "react"

/**
 * @fileOverview Signaling Shell.
 * Calling features removed.
 */
function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const isVisible = ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail

  return (
    <div className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {isVisible && <BottomNav />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex-1 bg-white" />}>
      <ShellContent>
        {children}
      </ShellContent>
    </Suspense>
  )
}
