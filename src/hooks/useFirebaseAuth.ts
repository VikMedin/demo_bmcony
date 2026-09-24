import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'cocina' | 'mensajero' | 'esperando';
  avatar: string;
  fontSizePreference?: 'normal' | 'large';
  createdAt: string;
}

export function useFirebaseAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const isOwner = (user.email?.toLowerCase() === 'vmedin@gmail.com');
        try {
          const docRef = doc(db, 'cony_staff_users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (isOwner && data.role !== 'superadmin') {
              data.role = 'superadmin';
              await updateDoc(docRef, { role: 'superadmin' }).catch(() => {});
            }
            setProfile(data);
          } else {
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              name: user.displayName || (user.email ? user.email.split('@')[0] : 'Colaborador'),
              phone: '',
              role: isOwner ? 'superadmin' : 'esperando', 
              avatar: user.photoURL || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, newProfile).catch(() => {});
            setProfile(newProfile);
          }
        } catch (error) {
          console.warn('Could not read user profile from firestore:', error);
          // Fallback profile so user can still proceed
          setProfile({
            id: user.uid,
            email: user.email || '',
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'Colaborador'),
            phone: '',
            role: isOwner ? 'superadmin' : 'esperando',
            avatar: user.photoURL || '',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { firebaseUser, profile, setProfile, loading };
}
