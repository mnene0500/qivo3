"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/firebase/auth/use-user'

/**
 * Hook to manage user presence via Supabase Channels and Heartbeat.
 */
export function usePresence() {
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    // Standard Heartbeat to the database to help with ranking
    const updateActivity = async () => {
      await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('uid', user.id);
    }

    updateActivity();
    const interval = setInterval(updateActivity, 60000 * 3); // Every 3 mins

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        // Sync complete
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => { 
      clearInterval(interval);
      channel.unsubscribe();
    }
  }, [user?.id])
}

export function useUserPresence(userId?: string) {
  const [presence, setPresence] = useState({ state: 'offline' });

  useEffect(() => {
    if (!userId) return;

    const fetchPresence = async () => {
      const channel = supabase.channel('online-users');
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (state[userId]) {
          setPresence({ state: 'online' });
        } else {
          setPresence({ state: 'offline' });
        }
      }).subscribe();
      
      return () => channel.unsubscribe();
    }

    fetchPresence();
  }, [userId]);

  return presence;
}
