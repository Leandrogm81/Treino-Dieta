import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const muscleGroupSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "O nome do exercício original.",
      },
      group: {
        type: Type.STRING,
        description: "O principal grupo muscular trabalhado pelo exercício.",
      },
    },
    required: ["name", "group"],
  },
};

/**
 * Categoriza uma lista de exercícios em grupos musculares usando a API Gemini.
 * @param exerciseNames Um array com os nomes dos exercícios.
 * @returns Uma promessa que resolve para um Record<string, string> mapeando nome do exercício para grupo muscular.
 */
export const categorizeExercises = async (exerciseNames: string[]): Promise<Record<string, string>> => {
  if (exerciseNames.length === 0) {
    return {};
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um especialista em fitness e musculação. Sua tarefa é categorizar uma lista de exercícios em seu principal grupo muscular.
        Os grupos musculares disponíveis são: Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Abdômen, Outro.
        Para a lista de exercícios fornecida, retorne um array JSON de objetos, onde cada objeto tem uma propriedade "name" (o nome do exercício) e "group" (o grupo muscular correspondente).

        Lista de Exercícios:
        ${JSON.stringify(exerciseNames)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: muscleGroupSchema,
      },
    });

    const jsonText = response.text.trim();
    const categories: { name: string; group: string }[] = JSON.parse(jsonText);

    const categoryMap: Record<string, string> = {};
    for (const item of categories) {
      categoryMap[item.name] = item.group;
    }
    
    // Garantir que todos os exercícios originais tenham um mapeamento
    for (const name of exerciseNames) {
        if (!categoryMap[name]) {
            categoryMap[name] = 'Outro';
        }
    }

    return categoryMap;
  } catch (error) {
    console.error("Erro ao categorizar exercícios:", error);
    // Fallback: em caso de erro, categorizar tudo como 'Outro'
    const fallbackMap: Record<string, string> = {};
    for (const name of exerciseNames) {
      fallbackMap[name] = 'Outro';
    }
    return fallbackMap;
  }
};
