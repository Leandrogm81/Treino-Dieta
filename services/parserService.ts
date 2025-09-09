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

interface ParsedName {
    foodName: string;
    quantity: number;
    unit: string;
}

/**
 * Parses a food name string to extract the name, quantity, and unit.
 * Tries multiple patterns in a specific order to support various diet formats robustly.
 * @param name The raw food name string from the imported text.
 * @returns An object with the parsed foodName, quantity, and unit.
 */
const parseFoodName = (name: string): ParsedName => {
    const originalName = name.trim();

    // Pattern 1: Handles "30g de castanhas" or "100ml de leite"
    // This pattern is checked first due to its explicit structure.
    const dePattern = /^(\d+[\.,]?\d*)\s*([a-zA-Z]+)\s+(?:de|da|do|das|dos)\s+(.+)/i;
    const deMatch = originalName.match(dePattern);
    if (deMatch) {
        return {
            quantity: parseFloat(deMatch[1].replace(',', '.')) || 1,
            unit: deMatch[2].toLowerCase(),
            foodName: deMatch[3].trim(),
        };
    }

    // Pattern 2: Handles "Arroz integral (100g cozido)" or "Frango (150g)"
    // Avoids complex recipes like "(150g carne + 100g abóbora)"
    const parenPattern = /\(([^)]+)\)/;
    const parenMatch = originalName.match(parenPattern);
    if (parenMatch && parenMatch.index !== undefined) {
        const insideParens = parenMatch[1];
        const isComplexRecipe = insideParens.includes('+') || (insideParens.match(/\d/g) || []).length > 1;

        if (!isComplexRecipe) {
            const quantUnitPattern = /(\d+[\.,]?\d*)\s*([a-zA-Z]+)/;
            const quantUnitMatch = insideParens.match(quantUnitPattern);

            if (quantUnitMatch) {
                const quantity = parseFloat(quantUnitMatch[1].replace(',', '.')) || 1;
                const unit = quantUnitMatch[2].toLowerCase();
                
                const restInsideParens = insideParens.replace(quantUnitMatch[0], '').trim();
                const nameOutsideParens = originalName.substring(0, parenMatch.index).trim();
                
                const foodName = restInsideParens ? `${nameOutsideParens} (${restInsideParens})` : nameOutsideParens;

                return { foodName: foodName.trim(), quantity, unit };
            }
        }
    }
    
    // Pattern 3: Handles "3 ovos" or "2 bananas" (quantity at the start)
    const quantFirstPattern = /^(\d+[\.,]?\d*)\s+([a-zA-Z].*)/;
    const quantFirstMatch = originalName.match(quantFirstPattern);
    if (quantFirstMatch) {
        return {
            quantity: parseFloat(quantFirstMatch[1].replace(',', '.')) || 1,
            unit: 'un',
            foodName: quantFirstMatch[2].trim(),
        };
    }

    // Fallback for complex names or unmatched patterns, treating it as a single unit.
    return { foodName: originalName, quantity: 1, unit: 'un' };
};


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
            
            const { foodName, quantity, unit } = parseFoodName(name);

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