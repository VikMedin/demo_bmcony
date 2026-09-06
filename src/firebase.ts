import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0363465621",
  appId: "1:1006903136721:web:8546654f17d94e29ac10f0",
  apiKey: "AIzaSyBgoNuaJH7asur_RbneZNfBGa6rlrwqW-M",
  authDomain: "gen-lang-client-0363465621.firebaseapp.com",
  storageBucket: "gen-lang-client-0363465621.firebasestorage.app",
  messagingSenderId: "1006903136721"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-conyorder-3f499f83-4e52-4188-994c-e8926d34b7bb");
export const auth = getAuth(app);
