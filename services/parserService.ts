
import type { MealTemplate, ExerciseTemplate } from '../types';

// Ex: Supino Reto Barra 4x6-10
const WORKOUT_REGEX = /(.+?)\s+(\d+)\s*x\s*([\d-]+|falha)/i;

export const parseWorkoutText = (text: string): ExerciseTemplate[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const exercises: ExerciseTemplate[] = [];

    for (const line of lines) {
        const match = line.match(WORKOUT_REGEX);
        if (match) {
            const [, name, sets, reps] = match;
            exercises.push({
                name: name.trim(),
                sets: parseInt(sets, 10) || 0,
                reps: reps.toLowerCase() === 'falha' ? 0 : (parseInt(reps.split('-')[0], 10) || 0),
                notes: `Reps: ${reps}`,
                technique: '',
            });
        }
    }
    return exercises;
};


// Ex: - 3 ovos cozidos: 210 Kcal | 18g proteína | 1g carboidrato | 15g gordura
const MEAL_REGEX = /-\s*(.+?):\s*(\d+(\.\d+)?)\s*Kcal\s*\|\s*(\d+(\.\d+)?)\s*g\s*proteína\s*\|\s*(\d+(\.\d+)?)\s*g\s*carboidrato\s*\|\s*(\d+(\.\d+)?)\s*g\s*gordura/i;

export const parseNutritionText = (text: string): MealTemplate[] => {
    const lines = text.split('\n').filter(line => line.trim().startsWith('-'));
    const meals: MealTemplate[] = [];

    for (const line of lines) {
        const match = line.match(MEAL_REGEX);
        if (match) {
            const [
                , 
                name, 
                calories, , 
                protein, , 
                carbs, , 
                fat
            ] = match;
            
            const nameParts = name.trim().match(/^([\d.,]+)\s*([a-zA-Z]+)?\s*(.*)/);
            let quantity = 1;
            let foodName = name.trim();
            let unit = 'un';

            if(nameParts) {
                quantity = parseFloat(nameParts[1].replace(',', '.')) || 1;
                unit = nameParts[2] || 'un';
                foodName = nameParts[3].trim();
            }

            meals.push({
                name: foodName,
                quantity: quantity,
                unit: unit,
                calories: parseFloat(calories) || 0,
                protein: parseFloat(protein) || 0,
                carbs: parseFloat(carbs) || 0,
                fat: parseFloat(fat) || 0,
            });
        }
    }
    return meals;
};