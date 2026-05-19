'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useMemo } from 'react';

/**
 * Idempotent initialization of Firebase services.
 * Returns null for services if the configuration is missing to prevent hard crashes.
 */
export function initializeFirebase() {
  const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined');
  
  if (!isConfigValid) {
    if (typeof window !== 'undefined') {
      console.warn("QIVO: Firebase configuration is missing. Please set your NEXT_PUBLIC_FIREBASE_* environment variables in Vercel.");
    }
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth, 
      database: null as unknown as Database 
    };
  }

  let app: FirebaseApp;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const database = getDatabase(app);

  return { firebaseApp: app, firestore, auth, database };
}

// Re-export provider and hooks
export * from './provider';
export { FirebaseClientProvider } from './client-provider';

/**
 * Memoize Firebase references to prevent unnecessary re-renders.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}

export { useUser, useCollection, useDoc };