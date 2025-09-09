
import React, { useState, useMemo } from 'react';
import type { User, Meal, MealTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Modal, Textarea, Spinner } from '../components/ui';
import { getTodayISO } from '../services/dataService';
import { parseNutritionText } from '../services/parserService';
import { ImportIcon } from '../constants';

type MealFormData = Omit<Meal, 'id' | 'userId' | 'date'>;
type ParsedMeal = MealTemplate & { tempId: number; selected: boolean };

const initialFormState: MealFormData = { name: '', quantity: 0, unit: '', calories: 0, protein: 0, fat: 0, carbs: 0 };

export const Nutrition: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals, setMeals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [mealTemplates, setMealTemplates] = useLocalStorage<MealTemplate[]>(`mealTemplates_${currentUser.id}`, []);
  const [formData, setFormData] = useState<MealFormData>(initialFormState);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedMeals, setParsedMeals] = useState<ParsedMeal[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const mealTemplateNames = useMemo(() => mealTemplates.map(t => t.name), [mealTemplates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Autocomplete logic
    if (name === 'name') {
        const selectedTemplate = mealTemplates.find(t => t.name === value);
        if (selectedTemplate) {
            setFormData(selectedTemplate); // Fill form with template data
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
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
  
  const handleParseText = () => {
      setIsParsing(true);
      const results = parseNutritionText(importText);
      setParsedMeals(results.map((m, i) => ({ ...m, tempId: i, selected: true })));
      setIsParsing(false);
  }

  const handleSaveSelectedTemplates = () => {
    const newTemplates = parsedMeals
        .filter(m => m.selected)
        .map(({ tempId, selected, ...mealData }) => mealData);
    
    setMealTemplates(prev => {
        const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
        const uniqueNewTemplates = newTemplates.filter(t => !existingNames.has(t.name.toLowerCase()));
        return [...prev, ...uniqueNewTemplates];
    });

    setImportModalOpen(false);
    setImportText('');
    setParsedMeals([]);
  }

  const toggleParsedMealSelection = (tempId: number) => {
    setParsedMeals(prev => prev.map(m => m.tempId === tempId ? { ...m, selected: !m.selected } : m));
  }

  const todayMeals = meals.filter(m => m.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Nutrição</h1>
        <Button onClick={() => setImportModalOpen(true)}>
            <ImportIcon className="w-5 h-5 mr-2" />
            Importar Modelos
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Refeição</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Alimento" name="name" value={formData.name} onChange={handleChange} required list="meal-templates" dataListOptions={mealTemplateNames} autoComplete="off"/>
            <Input label="Quantidade" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required/>
            <Input label="Unidade (g, ml, un)" name="unit" value={formData.unit} onChange={handleChange} required/>
            <Input label="Calorias" name="calories" type="number" value={formData.calories} onChange={handleChange} required/>
            <Input label="Proteína (g)" name="protein" type="number" value={formData.protein} onChange={handleChange} required/>
            <Input label="Gordura (g)" name="fat" type="number" value={formData.fat} onChange={handleChange} required/>
            <Input label="Carboidratos (g)" name="carbs" type="number" value={formData.carbs} onChange={handleChange} required/>
            <Button type="submit" className="w-full !mt-4">Adicionar Refeição</Button>
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
      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Modelos de Refeição">
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">Cole sua dieta para criar modelos reutilizáveis. Eles não serão adicionados ao dia de hoje.</p>
            <Textarea 
                aria-label="Cole sua dieta aqui para criar modelos"
                rows={10}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"- 3 ovos cozidos: 210 Kcal | 18g proteína | 1g carboidrato | 15g gordura\n- Arroz integral (100g cozido): 130 Kcal | 2.5g proteína | 28g carboidrato | 1g gordura"}
            />
            <Button onClick={handleParseText} disabled={isParsing || !importText} className="w-full">
                {isParsing ? <Spinner/> : "Processar Texto"}
            </Button>
            {parsedMeals.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Modelos encontrados:</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {parsedMeals.map(meal => (
                           <div key={meal.tempId} className="flex items-center bg-background p-2 rounded-md">
                                <input type="checkbox" checked={meal.selected} onChange={() => toggleParsedMealSelection(meal.tempId)} className="mr-3 h-5 w-5 rounded text-primary focus:ring-primary bg-surface border-gray-600"/>
                                <p className="text-sm">{meal.name} ({meal.calories}kcal)</p>
                           </div>
                        ))}
                    </div>
                    <Button onClick={handleSaveSelectedTemplates} className="w-full mt-4">
                        Salvar Modelos Selecionados
                    </Button>
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};