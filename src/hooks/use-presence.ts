"use client"
import { useState, useEffect } from 'react'
import { ref, onValue, off, onDisconnect, set, serverTimestamp } from 'firebase/database'
import { useDatabase, useUser } from '@/firebase'

/**
 * Hook to manage current user's online/offline status in Realtime Database.
 */
export function usePresence() {
  const { user } = useUser()
  const db = useDatabase()

  useEffect(() => {
    if (!user?.uid) return
    
    const myPresenceRef = ref(db, `presence/${user.uid}`)
    const connectedRef = ref(db, '.info/connected')

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When disconnected, set state to offline
        onDisconnect(myPresenceRef).set({
          state: 'offline',
          lastChanged: serverTimestamp()
        })
        
        // Set state to online when connected
        set(myPresenceRef, {
          state: 'online',
          lastChanged: serverTimestamp()
        })
      }
    })

    return () => unsubscribe()
  }, [db, user?.uid])
}

/**
 * Hook to watch another user's presence status.
 */
export function useUserPresence(userId?: string) {
  const [presence, setPresence] = useState<{ state: string; lastChanged: number } | null>(null)
  const db = useDatabase()

  useEffect(() => {
    if (!userId) return
    const presenceRef = ref(db, `presence/${userId}`)
    const unsubscribe = onValue(presenceRef, (snap) => {
      if (snap.exists()) {
        setPresence(snap.val())
      } else {
        setPresence({ state: 'offline', lastChanged: Date.now() })
      }
    })
    return () => off(presenceRef, 'value', unsubscribe)
  }, [db, userId])

  return presence
}