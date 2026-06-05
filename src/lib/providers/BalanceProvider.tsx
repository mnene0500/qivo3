
'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { supabase } from '@/lib/supabase';

const BalanceContext = createContext({ coins: 0, diamonds: 0 });

/**
 * @fileOverview Global Balance Provider.
 * Optimized to be event-driven. Fetches once, then listens for targeted row changes only.
 * Minimized bandwidth and DB read units.
 */
export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [balances, setBalances] = useState({ coins: 0, diamonds: 0 });

  useEffect(() => {
    if (!user?.id) {
      setBalances({ coins: 0, diamonds: 0 });
      return;
    }

    let balanceChannel: any;

    const fetchAndSubscribe = async () => {
      // 1. Initial Fetch - Strictly selecting necessary columns
      const { data, error } = await supabase
        .from('balances')
        .select('coins, diamonds')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("[Balance Sync Error]:", error.message);
      } else if (data) {
        setBalances({ 
          coins: Number(data.coins) || 0, 
          diamonds: Number(data.diamonds) || 0 
        });
      }

      // 2. Realtime Listener - Strictly filtered to the current user's UID to prevent cost leakage
      balanceChannel = supabase
        .channel(`bal-realtime-${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'balances', 
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            if (payload.new) {
              const updated = payload.new as any;
              setBalances({
                coins: Number(updated.coins) || 0,
                diamonds: Number(updated.diamonds) || 0,
              });
            } else if (payload.eventType === 'DELETE') {
              setBalances({ coins: 0, diamonds: 0 });
            }
          }
        )
        .subscribe();
    };

    fetchAndSubscribe();

    return () => {
      if (balanceChannel) {
        supabase.removeChannel(balanceChannel);
      }
    };
  }, [user?.id]);

  return (
    <BalanceContext.Provider value={balances}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
