import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

// Collections that can be accessed and synced in real-time
const PUBLIC_COLLECTIONS = new Set(['cony_food_items', 'cony_orders', 'cony_resto_clients', 'cony_expenses', 'cony_coupons', 'cony_staff_users', 'cony_audit_logs']);
const PUBLIC_DOCUMENTS = new Set(['settings/cony_business_config', 'settings/cony_user_profiles_v3']);

/**
 * Hook to sync an array of objects (that have an `id` field) with a Firestore Collection.
 * Adheres to zero-trust Firestore best practices: only attaches onSnapshot when authenticated
 * or for explicitly public collections.
 */
export function useFirebaseCollection<T extends { id: string }>(
  collectionName: string,
  initialValue: T[]
): [T[], (value: T[] | ((val: T[]) => T[])) => void] {
  const [data, setData] = useState<T[]>(initialValue);
  const dataRef = useRef<T[]>(initialValue);
  const isInitialized = useRef(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const isPublic = PUBLIC_COLLECTIONS.has(collectionName);
    // Only attach listener if collection is public OR user is authenticated
    if (!isPublic && !currentUser) {
      return;
    }

    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty && !isInitialized.current) {
          // Seed initial data if collection is empty and user has write permissions
          if (currentUser) {
            const batch = writeBatch(db);
            initialValue.forEach(item => {
              batch.set(doc(colRef, item.id), item as any);
            });
            batch.commit().catch(() => {});
          }
          isInitialized.current = true;
        } else {
          const docs = snapshot.docs.map(d => d.data() as T);
          
          docs.sort((a: any, b: any) => {
            const hasOrderA = typeof a.order === 'number';
            const hasOrderB = typeof b.order === 'number';
            if (hasOrderA && hasOrderB) {
              return a.order - b.order;
            }
            if (hasOrderA) return -1;
            if (hasOrderB) return 1;
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Descending
            }
            return 0;
          });

          setData(docs);
          dataRef.current = docs;
          isInitialized.current = true;
        }
      },
      (error) => {
        if (error.message.includes('Missing or insufficient permissions')) {
          console.warn(`Firestore permission notice for ${collectionName}:`, error.message);
          // Only throw if authenticated user was expected to have access
          if (currentUser) {
            try {
              handleFirestoreError(error, OperationType.LIST, collectionName);
            } catch (e) {
              console.error(e);
            }
          }
        } else {
          console.warn(`Firestore onSnapshot notice for ${collectionName}:`, error.message);
        }
      }
    );

    return () => unsubscribe();
  }, [collectionName, currentUser]);

  const setCollectionData = useCallback((value: T[] | ((val: T[]) => T[])) => {
    const previousItems = dataRef.current;
    const newValue = typeof value === 'function' ? (value as any)(previousItems) : value;
    
    // Always update local memory optimistically
    setData(newValue);
    dataRef.current = newValue;

    // Only commit to Firestore if user is authenticated or collection is public
    const isPublic = PUBLIC_COLLECTIONS.has(collectionName);
    if (!auth.currentUser && !isPublic) {
      return;
    }

    try {
      const newIds = new Set(newValue.map((item: T) => item.id));
      const toDelete = previousItems.filter((item: T) => !newIds.has(item.id));
      
      const batch = writeBatch(db);
      
      toDelete.forEach(item => {
        batch.delete(doc(db, collectionName, item.id));
      });

      newValue.forEach((item: T) => {
        const oldItem = previousItems.find(old => old.id === item.id);
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
          const cleanedItem = cleanFirestoreData(item);
          batch.set(doc(db, collectionName, item.id), cleanedItem);
        }
      });

      batch.commit().catch((err) => {
        console.warn(`Firestore batch commit warning for ${collectionName}:`, err.message);
      });
    } catch (err) {
      console.warn(`Could not sync batch for ${collectionName}:`, err);
    }
  }, [collectionName]);

  return [data, setCollectionData];
}

/**
 * Hook to sync a single object or primitive with a Firestore Document.
 */
export function useFirebaseDocument<T>(
  docPath: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [data, setData] = useState<T>(initialValue);
  const dataRef = useRef<T>(initialValue);
  const isInitialized = useRef(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const isPublic = PUBLIC_DOCUMENTS.has(docPath);
    if (!isPublic && !currentUser) {
      return;
    }

    const pathSegments = docPath.split('/');
    if (pathSegments.length !== 2) {
      console.error("docPath must be 'collection/documentId'");
      return;
    }
    
    const docRef = doc(db, pathSegments[0], pathSegments[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists() && !isInitialized.current) {
          if (currentUser) {
            setDoc(docRef, { data: initialValue }).catch(() => {});
          }
          isInitialized.current = true;
        } else if (docSnap.exists()) {
          const raw = docSnap.data();
          // Support both wrapped { data: ... } and flat document formats
          const fetchedData = (raw.data !== undefined ? raw.data : raw) as T;
          if (fetchedData && typeof fetchedData === 'object' && !Array.isArray(fetchedData)) {
            setData((prev) => ({ ...(prev as object), ...(fetchedData as object) } as T));
            dataRef.current = { ...(dataRef.current as object), ...(fetchedData as object) } as T;
          } else if (fetchedData !== undefined) {
            setData(fetchedData);
            dataRef.current = fetchedData;
          }
          isInitialized.current = true;
        }
      },
      (error) => {
        console.warn(`Firestore document notice for ${docPath}:`, error.message);
      }
    );

    return () => unsubscribe();
  }, [docPath, currentUser]);

  const setDocData = useCallback((value: T | ((val: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as any)(dataRef.current) : value;
    
    setData(newValue);
    dataRef.current = newValue;

    const isPublic = PUBLIC_DOCUMENTS.has(docPath);
    if (!auth.currentUser && !isPublic) {
      return;
    }

    const pathSegments = docPath.split('/');
    const docRef = doc(db, pathSegments[0], pathSegments[1]);
    
    // Save both wrapped and root properties for 100% compatibility across reads
    const rawDocPayload = typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)
      ? { ...(newValue as object), data: newValue }
      : { data: newValue };
    const docPayload = cleanFirestoreData(rawDocPayload);

    setDoc(docRef, docPayload).catch((err) => {
      console.warn(`Firestore setDoc notice for ${docPath}:`, err.message);
    });
  }, [docPath]);

  return [data, setDocData];
}
