import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to sync an array of objects (that have an `id` field) with a Firestore Collection.
 */
export function useFirebaseCollection<T extends { id: string }>(
  collectionName: string,
  initialValue: T[]
): [T[], (value: T[] | ((val: T[]) => T[])) => void] {
  const [data, setData] = useState<T[]>(initialValue);
  const dataRef = useRef<T[]>(initialValue);
  const isInitialized = useRef(false);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty && !isInitialized.current) {
          // Seed initial data if collection is empty
          const batch = writeBatch(db);
          initialValue.forEach(item => {
            batch.set(doc(colRef, item.id), item as any);
          });
          batch.commit().catch(() => {
            // Ignore if write permission not granted (e.g. unauthenticated)
          });
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
        // Gracefully handle permission or network errors
        console.warn(`Firestore onSnapshot notice for ${collectionName}:`, error.message);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  const setCollectionData = useCallback((value: T[] | ((val: T[]) => T[])) => {
    const newValue = typeof value === 'function' ? (value as any)(dataRef.current) : value;
    
    // Identify deletions
    const newIds = new Set(newValue.map((item: T) => item.id));
    const toDelete = dataRef.current.filter((item: T) => !newIds.has(item.id));
    
    // Execute deletions and updates in a batch for efficiency
    const batch = writeBatch(db);
    
    toDelete.forEach(item => {
      batch.delete(doc(db, collectionName, item.id));
    });

    newValue.forEach((item: T) => {
      const oldItem = dataRef.current.find(old => old.id === item.id);
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        batch.set(doc(db, collectionName, item.id), item as any);
      }
    });

    batch.commit().catch(console.error);

    // Optimistic local update
    setData(newValue);
    dataRef.current = newValue;
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

  useEffect(() => {
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
          setDoc(docRef, { data: initialValue }).catch(() => {});
          isInitialized.current = true;
        } else if (docSnap.exists()) {
          const fetchedData = docSnap.data().data as T;
          setData(fetchedData);
          dataRef.current = fetchedData;
          isInitialized.current = true;
        }
      },
      (error) => {
        console.warn(`Firestore document notice for ${docPath}:`, error.message);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docPath]);

  const setDocData = useCallback((value: T | ((val: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as any)(dataRef.current) : value;
    
    const pathSegments = docPath.split('/');
    const docRef = doc(db, pathSegments[0], pathSegments[1]);
    
    setDoc(docRef, { data: newValue }).catch(console.error);
    
    setData(newValue);
    dataRef.current = newValue;
  }, [docPath]);

  return [data, setDocData];
}
