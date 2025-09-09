
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Ensure you have the API key in your environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const nutritionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Nome do alimento' },
            quantity: { type: Type.NUMBER, description: 'Quantidade do alimento' },
            unit: { type: Type.STRING, description: 'Unidade de medida (ex: g, ml, xícara)' },
            calories: { type: Type.NUMBER, description: 'Calorias' },
            protein: { type: Type.NUMBER, description: 'Proteína em gramas' },
            fat: { type: Type.NUMBER, description: 'Gordura em gramas' },
            carbs: { type: Type.NUMBER, description: 'Carboidratos em gramas' },
        },
        required: ["name", "quantity", "unit", "calories", "protein", "fat", "carbs"]
    }
};

const workoutSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Nome do exercício' },
            sets: { type: Type.NUMBER, description: 'Número de séries' },
            reps: { type: Type.STRING, description: 'Repetições (pode ser um intervalo, ex: 8-12)' },
            notes: { type: Type.STRING, description: 'Observações ou técnicas' },
        },
        required: ["name", "sets", "reps"]
    }
};

const callGemini = async (prompt: string, schema: any) => {
    if (!API_KEY) throw new Error("API_KEY for Gemini is not configured.");
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Falha ao processar a solicitação com a IA. Verifique o texto e tente novamente.");
    }
};

export const parseNutritionPlan = async (text: string) => {
    const prompt = `Analise o seguinte plano de dieta e extraia cada alimento com seus detalhes. O texto é: "${text}"`;
    return callGemini(prompt, nutritionSchema);
};

export const parseWorkoutPlan = async (text: string) => {
    const prompt = `Analise o seguinte plano de treino e extraia cada exercício com seus detalhes. O texto é: "${text}"`;
    return callGemini(prompt, workoutSchema);
};

export const getProgressAnalysis = async (data: any) => {
    if (!API_KEY) throw new Error("API_KEY for Gemini is not configured.");
    const prompt = `
      Aja como um "Coach de Bolso". Analise os seguintes dados de progresso de um usuário de um aplicativo de fitness.
      Dados: ${JSON.stringify(data)}
      Forneça uma análise curta, motivacional e uma sugestão prática com base nos dados.
      Por exemplo, se o peso estagnou, sugira aumentar o cardio. Se a carga nos exercícios está subindo, elogie o esforço.
      Seja breve e direto. Responda em português do Brasil.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for analysis:", error);
        throw new Error("Falha ao gerar análise de progresso.");
    }
};
