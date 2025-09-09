
import React from 'react';
import type { AllUserData } from './types';

// SVG Icon Components
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NutritionIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const WorkoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CardioIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ProgressIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export const NAV_ITEMS = [
  { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
  { name: 'Nutrição', icon: <NutritionIcon className="w-5 h-5" /> },
  { name: 'Treino', icon: <WorkoutIcon className="w-5 h-5" /> },
  { name: 'Cardio', icon: <CardioIcon className="w-5 h-5" /> },
  { name: 'Progresso', icon: <ProgressIcon className="w-5 h-5" /> },
] as const;

export type NavItemType = typeof NAV_ITEMS[number]['name'];

// Achievement Definitions
export const ACHIEVEMENTS_DEFINITIONS = [
    {
        id: 'FIRST_WORKOUT',
        title: 'Primeiro Treino!',
        description: 'Você completou seu primeiro treino. O começo de uma grande jornada!',
        icon: <WorkoutIcon className="w-10 h-10 text-primary" />,
        condition: (data: AllUserData) => data.exercises.length >= 1,
    },
    {
        id: 'TEN_WORKOUTS',
        title: 'Força de Hércules',
        description: 'Parabéns por completar 10 treinos! A consistência é a chave.',
        icon: <WorkoutIcon className="w-10 h-10 text-primary" />,
        condition: (data: AllUserData) => data.exercises.length >= 10,
    },
    {
        id: 'FIRST_MEAL',
        title: 'Nutrição em Dia',
        description: 'Você registrou sua primeira refeição. Comer bem é o primeiro passo.',
        icon: <NutritionIcon className="w-10 h-10 text-secondary" />,
        condition: (data: AllUserData) => data.meals.length >= 1,
    },
    {
        id: 'CONSISTENT_NUTRITION',
        title: 'Chef de Cozinha',
        description: 'Você registrou refeições por 7 dias seguidos.',
        icon: <NutritionIcon className="w-10 h-10 text-secondary" />,
        condition: (data: AllUserData) => {
            if (data.meals.length < 7) return false;
            const uniqueDays = new Set(data.meals.map(m => new Date(m.date).toDateString()));
            return uniqueDays.size >= 7;
        },
    },
    {
        id: 'FIRST_CARDIO',
        title: 'Coração de Atleta',
        description: 'Sua primeira sessão de cardio foi registrada. Sinta a endorfina!',
        icon: <CardioIcon className="w-10 h-10 text-yellow-400" />,
        condition: (data: AllUserData) => data.cardio.length >= 1,
    },
    {
        id: 'PROGRESS_LOG',
        title: 'Olho no Progresso',
        description: 'Você registrou suas medidas pela primeira vez. Dados são poder!',
        icon: <ProgressIcon className="w-10 h-10 text-green-400" />,
        condition: (data: AllUserData) => data.progress.length >= 1,
    },
];
