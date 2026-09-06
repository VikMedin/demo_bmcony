import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreCollection<T>(collectionName: string, orderByField?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, collectionName);
    if (orderByField) {
      q = query(q, orderBy(orderByField, 'desc')) as any;
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, orderByField]);

  const add = async (item: Omit<T, 'id'>) => {
    await addDoc(collection(db, collectionName), item as any);
  };

  const update = async (id: string, partial: Partial<T>) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, partial as any);
  };

  const remove = async (id: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  };

  return { data, loading, add, update, remove };
}

export function useFirestoreDocument<T>(collectionName: string, docId: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as T);
      } else {
        // Initialize doc if it doesn't exist
        setDoc(docRef, initialData as any, { merge: true });
        setData(initialData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId]);

  const update = async (partial: Partial<T>) => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, partial as any);
  };

  return { data, loading, update, set: (newData: T) => setDoc(doc(db, collectionName, docId), newData as any) };
}
