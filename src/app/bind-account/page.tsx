
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * @fileOverview This page has been removed as it relied on Firebase Auth credential linking.
 * Supabase handles account management differently.
 */
export default function BindAccountRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/profile")
  }, [router])

  return null
}
