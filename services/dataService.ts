// src/services/dataService.ts
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, updateDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

type BaseDoc = { id?: string; date?: number; [k: string]: any };

// ---------- Helpers ----------
function userCol(uid: string, coll: string) {
  return collection(db, 'users', uid, coll);
}

async function ensureUid(): Promise<string | null> {
  const u = auth.currentUser;
  return u?.uid ?? null;
}

function lsKey(coll: string) { return `__ls_${coll}`; }
function lsRead<T = BaseDoc>(coll: string): T[] {
  try { return JSON.parse(localStorage.getItem(lsKey(coll)) || '[]'); } catch { return []; }
}
function lsWrite<T = BaseDoc>(coll: string, arr: T[]) {
  localStorage.setItem(lsKey(coll), JSON.stringify(arr));
}

// ---------- CRUD genérico por coleção do usuário ----------
export function crudFor<T extends BaseDoc = BaseDoc>(collectionName: string) {
  return {
    async list(): Promise<T[]> {
      const uid = await ensureUid();
      if (!uid) return lsRead<T>(collectionName);
      const q = query(userCol(uid, collectionName), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) })) as T[];
    },
    async add(docBody: Omit<T, 'id'>): Promise<string> {
      const uid = await ensureUid();
      if (!uid) {
        const arr = lsRead<T>(collectionName);
        const id = String(Date.now());
        arr.unshift({ ...(docBody as any), id });
        lsWrite(collectionName, arr);
        return id;
      }
      const ref = await addDoc(userCol(uid, collectionName), { ...docBody, createdAt: serverTimestamp() });
      return ref.id;
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      const uid = await ensureUid();
      if (!uid) {
        const arr = lsRead<T>(collectionName);
        const idx = arr.findIndex((d: any) => d.id === id);
        if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; lsWrite(collectionName, arr); }
        return;
      }
      await updateDoc(doc(db, 'users', uid, collectionName, id), patch as any);
    },
    async remove(id: string): Promise<void> {
      const uid = await ensureUid();
      if (!uid) {
        const arr = lsRead<T>(collectionName);
        lsWrite(collectionName, arr.filter((d: any) => d.id !== id));
        return;
      }
      await deleteDoc(doc(db, 'users', uid, collectionName, id));
    }
  };
}

// ---------- Atalhos prontos ----------
export type Meal = {
  id?: string;
  date: number;      // epoch ms
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export const mealsApi    = crudFor<Meal>('meals');
export const workoutsApi = crudFor('workouts');
export const cardioApi   = crudFor('cardio');

// ---------- Conveniências (se suas telas preferem funções soltas) ----------
export const listMeals   = () => mealsApi.list();
export const addMeal     = (m: Omit<Meal, 'id'>) => mealsApi.add(m);
export const updateMeal  = (id: string, p: Partial<Meal>) => mealsApi.update(id, p);
export const deleteMeal  = (id: string) => mealsApi.remove(id);
