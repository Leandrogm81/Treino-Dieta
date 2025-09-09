import type { MealTemplate, ExerciseTemplate } from '../types';

// Ex: Supino Reto Barra 4x6-10
const WORKOUT_REGEX = /(.+?)\s+(\d+)\s*x\s*([\d-]+|falha)/i;

export const parseWorkoutText = (text: string): Omit<ExerciseTemplate, 'id'>[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const exercises: Omit<ExerciseTemplate, 'id'>[] = [];

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

export const normalizeName = (name: string): string => {
  let normalized = name.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Simple, safe de-pluralization applied word-by-word.
  const words = normalized.split(' ').map(word => {
      // Specific exceptions that end in 's' but are singular.
      const exceptions = ['arroz', 'lápis', 'pires', 'ônibus'];
      if (exceptions.includes(word)) {
          return word;
      }
      
      if (word === 'colheres') return 'colher';

      // General rule: remove 's' from words longer than 3 chars.
      if (word.length > 3 && word.endsWith('s')) {
          return word.slice(0, -1);
      }
      return word;
  });

  return words.join(' ');
};

const parseFoodName = (name: string): ParsedName => {
    const originalName = name.trim();
    const unitsRegex = /(g|ml|un|unidade|colher|concha)/i;

    // Pattern for complex recipes - treat as single unit
    if (originalName.includes('+') || originalName.includes(' com ') || originalName.match(/\d/g)?.length > 2) {
         return { foodName: originalName, quantity: 1, unit: 'un' };
    }

    // Pattern 1: Handles "30g de castanhas" or "2 colheres de azeite"
    const dePattern = /^(\d+[\.,]?\d*)\s*([a-zA-Zç]+)\s+(?:de|da|do|das|dos)\s+(.+)/i;
    const deMatch = originalName.match(dePattern);
    if (deMatch) {
        return {
            quantity: parseFloat(deMatch[1].replace(',', '.')) || 1,
            unit: deMatch[2].toLowerCase().replace(/s$/, ''),
            foodName: deMatch[3].trim(),
        };
    }

    // Pattern 2: Handles "Arroz integral (100g cozido)"
    const parenPattern = /\(([^)]+)\)/;
    const parenMatch = originalName.match(parenPattern);
    if (parenMatch) {
        const insideParens = parenMatch[1];
        const quantUnitPattern = /(\d+[\.,]?\d*)\s*([a-zA-Zç]+)/;
        const quantUnitMatch = insideParens.match(quantUnitPattern);

        if (quantUnitMatch) {
            const quantity = parseFloat(quantUnitMatch[1].replace(',', '.')) || 1;
            const unit = quantUnitMatch[2].toLowerCase().replace(/s$/, '');
            const nameOutsideParens = originalName.replace(parenPattern, '').trim();
            return { foodName: nameOutsideParens, quantity, unit };
        }
    }
    
    // Pattern 3: Handles "3 ovos"
    const quantFirstPattern = /^(\d+[\.,]?\d*)\s+(.+)/;
    const quantFirstMatch = originalName.match(quantFirstPattern);
    if (quantFirstMatch) {
        let potentialUnit = quantFirstMatch[2].split(' ')[0].toLowerCase();
        if (unitsRegex.test(potentialUnit)) {
             return {
                quantity: parseFloat(quantFirstMatch[1].replace(',', '.')) || 1,
                unit: potentialUnit.replace(/s$/, ''),
                foodName: quantFirstMatch[2].substring(potentialUnit.length).trim(),
            };
        }
        return {
            quantity: parseFloat(quantFirstMatch[1].replace(',', '.')) || 1,
            unit: 'un',
            foodName: quantFirstMatch[2].trim(),
        };
    }

    return { foodName: originalName, quantity: 1, unit: 'un' };
};


export const parseNutritionText = (text: string): Omit<MealTemplate, 'id'>[] => {
    const lines = text.split('\n').filter(line => line.trim().startsWith('-'));
    const meals: Omit<MealTemplate, 'id'>[] = [];

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
            const totalCalories = parseFloat(calories) || 0;
            const totalProtein = parseFloat(protein) || 0;
            const totalCarbs = parseFloat(carbs) || 0;
            const totalFat = parseFloat(fat) || 0;

            meals.push({
                originalName: foodName,
                name: normalizeName(foodName),
                servingSize: quantity,
                servingUnit: unit,
                calories: totalCalories,
                protein: totalProtein,
                carbs: totalCarbs,
                fat: totalFat,
            });
        }
    }
    return meals;
};