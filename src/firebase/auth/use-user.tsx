
"use client"

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, isInitialized };
}
