// src/hooks/useAuth.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppUser = {
  id: string;
  username: string;       // email
  isAdmin: boolean;
  forcePasswordChange?: boolean;
};

type Status = 'LOGGED_OUT' | 'LOGGED_IN' | 'LOADING';
type AuthState = { status: Status; currentUser: AppUser | null };

type Ctx = {
  authState: AuthState;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signup(email: string, password: string): Promise<void>;
  changePassword(newPassword: string): Promise<void>;
  // Criar/listar usuários de Auth só com Admin SDK (backend). Aqui focamos no básico.
  createUser(email: string, isAdmin?: boolean): Promise<void>;
  getAllUsers(): Promise<AppUser[]>; // retorna ao menos o próprio usuário
};

const AuthCtx = createContext<Ctx>({} as Ctx);

async function toAppUser(fbUser: FirebaseUser | null): Promise<AppUser | null> {
  if (!fbUser) return null;
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const base: AppUser = {
    id: fbUser.uid,
    username: fbUser.email ?? 'sem-email',
    isAdmin: false,
  };
  if (!snap.exists()) {
    await setDoc(ref, { username: base.username, isAdmin: false, createdAt: Date.now() });
    return base;
  }
  const data = snap.data() as Partial<AppUser>;
  return { ...base, ...data, id: fbUser.uid };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ status: 'LOADING', currentUser: null });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return setAuthState({ status: 'LOGGED_OUT', currentUser: null });
      const appUser = await toAppUser(fbUser);
      setAuthState({ status: 'LOGGED_IN', currentUser: appUser });
    });
    return () => unsub();
  }, []);

  const api = useMemo<Ctx>(() => ({
    authState,
    async login(email, password) { await signInWithEmailAndPassword(auth, email, password); },
    async logout() { await signOut(auth); },
    async signup(email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), { username: email, isAdmin: false, createdAt: Date.now() });
    },
    async changePassword(newPassword) {
      if (!auth.currentUser) throw new Error('Não autenticado');
      await updatePassword(auth.currentUser, newPassword);
    },
    async createUser() {
      throw new Error('Criar usuários via app requer backend (Admin SDK). Use o Firebase Console.');
    },
    async getAllUsers() {
      return authState.currentUser ? [authState.currentUser] : [];
    },
  }), [authState]);

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
