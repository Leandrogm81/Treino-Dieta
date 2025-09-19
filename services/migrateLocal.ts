// src/services/migrateLocal.ts
import { addMeal } from './dataService';

export async function migrateLocalToFirestore() {
  try {
    const raw = localStorage.getItem('__ls_meals') || localStorage.getItem('meals');
    if (!raw) return;
    const meals = JSON.parse(raw);
    if (!Array.isArray(meals)) return;

    for (const m of meals) {
      await addMeal({
        date: typeof m.date === 'number' ? m.date : Date.now(),
        name: m.name || 'Refeição',
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        calories: Number(m.calories) || 0,
      });
    }
    // Depois que confirmar tudo no Firestore, você pode limpar o local:
    // localStorage.removeItem('__ls_meals'); localStorage.removeItem('meals');
  } catch (e) {
    console.error('Migração local->Firestore falhou', e);
  }
}
