"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

/**
 * Root Redirector.
 * Pure logic gate to ensure zero-latency routing to the correct entry point.
 */
export default function RootPage() {
  const router = useRouter()
  const { user, loading: authLoading, isInitialized } = useUser()

  useEffect(() => {
    if (!isInitialized || authLoading) return

    if (user) {
      router.replace("/home")
    } else {
      router.replace("/welcome")
    }
  }, [user, isInitialized, authLoading, router])

  return (
    <div className="fixed inset-0 bg-black" />
  )
}
