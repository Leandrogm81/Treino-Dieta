
import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

// Simple hash function for demo purposes. In a real app, use a robust library like bcrypt.
const simpleHash = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

type AuthState = 
  | { status: 'LOADING' }
  | { status: 'NO_USERS' }
  | { status: 'LOGGED_OUT'; users: User[] }
  | { status: 'LOGGED_IN'; currentUser: User; users: User[] }
  | { status: 'FORCE_PASSWORD_CHANGE'; currentUser: User; users: User[] };

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};

export const useAuth = () => {
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [authState, setAuthState] = useState<AuthState>({ status: 'LOADING' });

  useEffect(() => {
    if (currentUser) {
        if(currentUser.forcePasswordChange) {
            setAuthState({ status: 'FORCE_PASSWORD_CHANGE', currentUser, users });
        } else {
            setAuthState({ status: 'LOGGED_IN', currentUser, users });
        }
    } else if (users.length === 0) {
      setAuthState({ status: 'NO_USERS' });
    } else {
      setAuthState({ status: 'LOGGED_OUT', users });
    }
  }, [currentUser, users]);

  const createAdmin = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (users.length > 0) return false;
    const passwordHash = await simpleHash(password);
    const admin: User = { id: crypto.randomUUID(), username, passwordHash, isAdmin: true, forcePasswordChange: false };
    setUsers([admin]);
    setCurrentUser(admin);
    return true;
  }, [users, setUsers, setCurrentUser]);

  const createUser = useCallback(async (username: string, temporaryPass: string): Promise<boolean> => {
     if (users.some(u => u.username === username)) return false;
     const passwordHash = await simpleHash(temporaryPass);
     const newUser: User = { id: crypto.randomUUID(), username, passwordHash, isAdmin: false, forcePasswordChange: true };
     setUsers(prev => [...prev, newUser]);
     return true;
  }, [users, setUsers]);
  
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username === username);
    if (!user) return false;
    const passwordHash = await simpleHash(password);
    if (user.passwordHash === passwordHash) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users, setCurrentUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  const changePassword = useCallback(async (password: string): Promise<boolean> => {
      if(!currentUser) return false;
      const passwordHash = await simpleHash(password);
      const updatedUser = { ...currentUser, passwordHash, forcePasswordChange: false };
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      return true;
  }, [currentUser, setUsers, setCurrentUser]);

  const changeOwnPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Nenhum usuário logado.' };
    
    const currentPasswordHash = await simpleHash(currentPassword);
    if (currentUser.passwordHash !== currentPasswordHash) {
        return { success: false, message: 'A senha atual está incorreta.' };
    }
    
    const newPasswordHash = await simpleHash(newPassword);
    const updatedUser = { ...currentUser, passwordHash: newPasswordHash, forcePasswordChange: false };
    
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    
    return { success: true, message: 'Senha alterada com sucesso!' };
  }, [currentUser, setUsers, setCurrentUser]);

  const resetUserPassword = useCallback(async (userId: string): Promise<{ success: boolean; tempPass?: string }> => {
      const userToReset = users.find(u => u.id === userId);
      if (!userToReset || userToReset.isAdmin) return { success: false };

      const temporaryPass = 'mudar1234';
      const passwordHash = await simpleHash(temporaryPass);
      const updatedUser: User = { ...userToReset, passwordHash, forcePasswordChange: true };
      
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      return { success: true, tempPass: temporaryPass };
  }, [users, setUsers]);

  return { authState, login, logout, createAdmin, createUser, changePassword, changeOwnPassword, resetUserPassword };
};
