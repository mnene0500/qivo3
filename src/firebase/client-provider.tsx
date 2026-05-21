
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

/**
 * A client-side provider that ensures Firebase is initialized only once.
 * Composes the base FirebaseProvider with initialized instances.
 * Note: Firebase Auth is removed.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use useMemo to ensure initialization only happens once per client lifecycle
  const { firebaseApp, firestore, database } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      database={database}
    >
      {children}
    </FirebaseProvider>
  );
}
