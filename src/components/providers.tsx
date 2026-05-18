'use client';

import React from 'react';
import { initializeFirebase, FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Toaster } from "@/components/ui/toaster";
import { usePresence } from '@/hooks/use-presence';
import { InstallPrompt } from '@/components/layout/InstallPrompt';

const { firebaseApp, firestore, auth, database } = initializeFirebase();

/**
 * Handles global user presence heartbeat.
 */
function PresenceManager({ children }: { children: React.ReactNode }) {
  usePresence();
  return <>{children}</>;
}

/**
 * Root providers wrapper for the application.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider 
      firebaseApp={firebaseApp} 
      firestore={firestore} 
      auth={auth} 
      database={database}
    >
      <FirebaseErrorListener />
      <PresenceManager>
        <div className="native-page-transition flex-1 flex flex-col min-h-screen">
          {children}
        </div>
        <Toaster />
        <InstallPrompt />
      </PresenceManager>
    </FirebaseClientProvider>
  );
}