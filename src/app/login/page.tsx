"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * @fileOverview Redirects legacy /login attempts to the unified /auth page.
 */
export default function LoginRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/auth")
  }, [router])

  return null
}