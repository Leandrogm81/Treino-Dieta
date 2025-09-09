
import React, { useState } from 'react';
import type { User, Meal } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Modal, Spinner } from '../components/ui';
import { parseNutritionPlan } from '../services/geminiService';
import { getTodayISO } from '../services/dataService';

type MealFormData = Omit<Meal, 'id' | 'userId' | 'date'>;

const initialFormState: MealFormData = { name: '', quantity: 0, unit: '', calories: 0, protein: 0, fat: 0, carbs: 0 };

export const Nutrition: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals, setMeals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [formData, setFormData] = useState<MealFormData>(initialFormState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planText, setPlanText] = useState('');
  const [parsedPlan, setParsedPlan] = useLocalStorage<MealFormData[]>(`parsed_nutrition_plan_${currentUser.id}`, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeal: Meal = {
      ...formData,
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
    };
    setMeals(prev => [...prev, newMeal]);
    setFormData(initialFormState);
  };
  
  const handleParsePlan = async () => {
    if (!planText) return;
    setIsLoading(true);
    setError('');
    try {
        const parsedData = await parseNutritionPlan(planText);
        setParsedPlan(parsedData);
    } catch(err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSelectPlanItem = (item: MealFormData) => {
      setFormData(item);
      setIsModalOpen(false);
  };
  
  const todayMeals = meals.filter(m => m.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-text-primary">Nutrição</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Refeição</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Alimento" name="name" value={formData.name} onChange={handleChange} required/>
            <Input label="Quantidade" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required/>
            <Input label="Unidade (g, ml, un)" name="unit" value={formData.unit} onChange={handleChange} required/>
            <Input label="Calorias" name="calories" type="number" value={formData.calories} onChange={handleChange} required/>
            <Input label="Proteína (g)" name="protein" type="number" value={formData.protein} onChange={handleChange} required/>
            <Input label="Gordura (g)" name="fat" type="number" value={formData.fat} onChange={handleChange} required/>
            <Input label="Carboidratos (g)" name="carbs" type="number" value={formData.carbs} onChange={handleChange} required/>
            <div className="flex space-x-2 pt-2">
                <Button type="submit" className="flex-1">Adicionar</Button>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(true)}>Importar</Button>
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Refeições de Hoje</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Alimento</th>
                  <th className="p-2">Qtd</th>
                  <th className="p-2">Kcal</th>
                  <th className="p-2">P/G/C (g)</th>
                </tr>
              </thead>
              <tbody>
                {todayMeals.map(meal => (
                  <tr key={meal.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-2">{meal.name}</td>
                    <td className="p-2">{meal.quantity} {meal.unit}</td>
                    <td className="p-2">{meal.calories}</td>
                    <td className="p-2">{meal.protein}/{meal.fat}/{meal.carbs}</td>
                  </tr>
                ))}
                {todayMeals.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-text-secondary">Nenhuma refeição registrada hoje.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Importar Plano de Dieta com IA">
          <div className="space-y-4">
            <p className="text-text-secondary">Cole seu plano de dieta abaixo. Nossa IA irá extrair os alimentos para facilitar o registro.</p>
            <textarea 
                className="w-full h-32 bg-background border border-gray-600 rounded-md p-2 text-text-primary placeholder-gray-500"
                placeholder="Ex: Refeição 1: 100g de frango, 200g de batata doce..."
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleParsePlan} disabled={isLoading} className="w-full flex justify-center">
              {isLoading ? <Spinner/> : 'Analisar Plano'}
            </Button>
            {parsedPlan.length > 0 && (
                <div>
                    <h3 className="font-bold my-2">Itens encontrados:</h3>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {parsedPlan.map((item, i) => (
                            <li key={i} onClick={() => handleSelectPlanItem(item)} className="p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-primary">
                                {item.name} ({item.quantity} {item.unit})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
      </Modal>
    </div>
  );
};
