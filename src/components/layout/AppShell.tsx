
"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { Suspense, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"
import { GlobalCallOverlay } from "../GlobalCallOverlay"

/**
 * @fileOverview Viewport-Centric App Shell with Hardware Navigation Stability.
 */

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const mainRef = useRef<HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { 
    setMounted(true) 
  }, [])

  const isChatDetail = pathname === '/chats' && searchParams.has('startWith')
  const isCallScreen = pathname?.startsWith('/call/');
  const showNav = user && ['/home', '/chats', '/profile'].includes(pathname || "") && !isChatDetail && !isCallScreen;

  // Restore scroll position reliably without blocking hardware navigation
  useEffect(() => {
    if (mainRef.current && mounted && pathname) {
      const saved = sessionStorage.getItem(`scroll_${pathname}`);
      if (saved) {
        requestAnimationFrame(() => {
          if (mainRef.current) mainRef.current.scrollTop = parseInt(saved);
        });
      } else {
        mainRef.current.scrollTop = 0;
      }
    }
  }, [pathname, mounted])

  // Capture scroll for restoration
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (pathname) {
      sessionStorage.setItem(`scroll_${pathname}`, e.currentTarget.scrollTop.toString());
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white relative">
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 w-full overflow-y-auto overflow-x-hidden relative z-0 no-scrollbar flex flex-col overscroll-none",
          mounted && showNav ? "pb-16" : "pb-0"
        )}
      >
        <div className={cn("flex-1 flex flex-col", !mounted && "invisible")}>{children}</div>
      </main>
      {mounted && showNav && <BottomNav />}
      {mounted && user && <GlobalCallOverlay />}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}><ShellContent>{children}</ShellContent></Suspense>
}
