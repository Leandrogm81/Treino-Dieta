
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  forcePasswordChange: boolean;
}

export interface Meal {
  id: string;
  userId: string;
  date: string; // ISO string
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Exercise {
  id: string;
  userId: string;
  date: string; // ISO string
  name: string;
  sets: number;
  reps: number;
  load: number; // in kg
  technique?: string;
  notes?: string;
}

export interface Cardio {
  id:string;
  userId: string;
  date: string; // ISO string
  type: string;
  duration: number; // in minutes
  intensity: 'Baixa' | 'Média' | 'Alta';
  calories: number;
  speed?: number; // in km/h
}

export interface ProgressLog {
  id: string;
  userId: string;
  date: string; // ISO string
  weight: number;
  height: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  visceralFat?: number;
  metabolism?: number;
  chest?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

export interface AllUserData {
    meals: Meal[];
    exercises: Exercise[];
    cardio: Cardio[];
    progress: ProgressLog[];
}

// Modelos para autocompletar
export interface MealTemplate {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ExerciseTemplate {
  name: string;
  sets: number;
  reps: number;
  technique?: string;
  notes?: string;
}

export interface BackupData {
    meals: Meal[];
    exercises: Exercise[];
    cardio: Cardio[];
    progress: ProgressLog[];
    mealTemplates: MealTemplate[];
    exerciseTemplates: ExerciseTemplate[];
}
