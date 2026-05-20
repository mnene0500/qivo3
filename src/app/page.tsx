"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"

/**
 * Root Redirector with Cinematic Splash Screen.
 * Checks auth status and redirects automatically if a session exists.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading: authLoading, isInitialized } = useUser()
  const db = useFirestore()
  const { data: profile, loading: profileLoading } = useDoc<any>(user?.uid && db ? doc(db, "users", user.uid) : null)

  useEffect(() => {
    if (!isInitialized || authLoading) return

    const timer = setTimeout(() => {
      if (user) {
        if (!profileLoading && profile) {
          if (profile.onboardingComplete) {
            router.replace("/home")
          } else {
            router.replace(user.isAnonymous ? "/fastonboard" : "/onboarding")
          }
        } else if (!profileLoading && !profile) {
          // No profile found but user exists
          router.replace("/onboarding")
        }
      } else {
        router.replace("/welcome")
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, isInitialized, authLoading, profile, profileLoading, router])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A2FF]/20 rounded-full blur-[100px] animate-pulse-slow" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="text-7xl font-logo text-white tracking-tight drop-shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
          QIVO
        </h1>
      </div>

      {/* Subtle loader at the bottom */}
      <div className="absolute bottom-16 inset-x-0 flex justify-center">
        <div className="flex gap-1.5">
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#00A2FF] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}
