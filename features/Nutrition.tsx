import React, { useState } from 'react';
import type { User, Meal } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button } from '../components/ui';
import { getTodayISO } from '../services/dataService';

type MealFormData = Omit<Meal, 'id' | 'userId' | 'date'>;

const initialFormState: MealFormData = { name: '', quantity: 0, unit: '', calories: 0, protein: 0, fat: 0, carbs: 0 };

export const Nutrition: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals, setMeals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [formData, setFormData] = useState<MealFormData>(initialFormState);
  
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
            <Button type="submit" className="w-full !mt-4">Adicionar</Button>
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
    </div>
  );
};