import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore with auto-detected long-polling to prevent WebChannel timeout/unavailable errors in iframe environments
export const db: Firestore = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  appletConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

// Attempt non-blocking anonymous sign-in so request.auth is populated when supported
if (!auth.currentUser) {
  signInAnonymously(auth).catch(() => {
    // Non-blocking fallback: public firestore.rules allow unauthenticated read/write
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('the client is offline') ||
        (error as { code?: string }).code === 'unavailable' ||
        error.message.includes('unavailable')
      ) {
        // Expected during initial network handshake or offline mode; Firestore seamlessly syncs in background
        console.warn('Firestore is connecting in offline-supported mode.');
      } else {
        console.error('Firestore connection check:', error.message);
      }
    }
  }
}
testConnection();

export { app };

