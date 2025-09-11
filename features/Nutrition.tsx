import React, { useState, useMemo, useEffect } from 'react';
import type { User, Meal, MealTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Modal, Textarea, Spinner } from '../components/ui';
import { getTodayISO } from '../services/dataService';
import { parseNutritionText, normalizeName } from '../services/parserService';
import { ImportIcon } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';

const parseNumber = (value: string | number): number => {
    return parseFloat(String(value).replace(',', '.')) || 0;
};

type MealFormData = {
    name: string;
    quantity: string;
    unit: string;
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
};
type ParsedMeal = Omit<MealTemplate, 'id'> & { tempId: number; selected: boolean };

const initialFormState: MealFormData = { name: '', quantity: '1', unit: 'un', calories: '0', protein: '0', fat: '0', carbs: '0' };

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


const MealSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    templates: MealTemplate[];
    onSelect: (template: MealTemplate) => void;
    onDelete: (templateId: string) => void;
}> = ({ isOpen, onClose, templates, onSelect, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredTemplates = templates.filter(t => t.originalName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Alimento">
            <div className="flex flex-col space-y-4">
                <Input
                    placeholder="Buscar alimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <ul className="max-h-64 overflow-y-auto space-y-2">
                    {filteredTemplates.map((template) => (
                        <li key={template.id} className="flex items-center justify-between p-3 bg-background rounded-md hover:bg-gray-700 group">
                            <div onClick={() => onSelect(template)} className="flex-grow cursor-pointer">
                                <p className="font-semibold">{template.originalName}</p>
                                <p className="text-sm text-text-secondary">{template.calories} kcal / {template.servingSize} {template.servingUnit}</p>
                            </div>
                            <button onClick={() => onDelete(template.id)} className="ml-2 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </li>
                    ))}
                    {filteredTemplates.length === 0 && <li className="text-center text-text-secondary p-4">Nenhum modelo encontrado.</li>}
                </ul>
            </div>
        </Modal>
    );
};


export const Nutrition: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals, setMeals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [mealTemplates, setMealTemplates] = useLocalStorage<MealTemplate[]>(`mealTemplates_${currentUser.id}`, []);
  const [formData, setFormData] = useState<MealFormData>(initialFormState);
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedMeals, setParsedMeals] = useState<ParsedMeal[]>([]);
  const [baseParsedTemplates, setBaseParsedTemplates] = useState<Map<string, Omit<MealTemplate, 'id'>>>(new Map());
  const [isParsing, setIsParsing] = useState(false);
  const [parsingAttempted, setParsingAttempted] = useState(false);
  const isMobile = useIsMobile();
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const mealTemplateNames = useMemo(() => mealTemplates.map(t => t.originalName), [mealTemplates]);
  
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (selectedTemplate) {
      const quantity = parseNumber(formData.quantity);
      const base = selectedTemplate;
      const ratio = quantity / base.servingSize;
      
      setFormData(prev => ({
        ...prev,
        calories: (base.calories * ratio).toFixed(0),
        protein: (base.protein * ratio).toFixed(1),
        fat: (base.fat * ratio).toFixed(1),
        carbs: (base.carbs * ratio).toFixed(1),
      }));
    }
  }, [formData.quantity, selectedTemplate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Desvincular do template se macros forem editados manualmente
    if (['calories', 'protein', 'fat', 'carbs'].includes(name) && selectedTemplate) {
        setSelectedTemplate(null);
    }

    if (name === 'name') {
        const foundTemplate = mealTemplates.find(t => t.originalName.toLowerCase() === value.toLowerCase());
        if (foundTemplate) {
            handleSelectTemplate(foundTemplate);
        } else {
            setSelectedTemplate(null);
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectTemplate = (template: MealTemplate) => {
    setSelectedTemplate(template);
    setFormData({
        name: template.originalName,
        quantity: String(template.servingSize),
        unit: template.servingUnit,
        calories: String(template.calories),
        protein: String(template.protein),
        fat: String(template.fat),
        carbs: String(template.carbs),
    });
    setSelectionModalOpen(false);
  };
  
  const handleDeleteTemplate = (templateId: string) => {
      if(window.confirm("Tem certeza que deseja apagar este modelo?")) {
          setMealTemplates(prev => prev.filter(t => t.id !== templateId));
      }
  }

  const areMacrosSimilar = (
    newMealData: { calories: number; quantity: number },
    template: MealTemplate
  ): boolean => {
    if (newMealData.quantity <= 0 || template.servingSize <= 0) {
      return true; // Tratar como similar se os dados forem inválidos para evitar a criação de modelos incorretos
    }

    const newMealCalPerUnit = newMealData.calories / newMealData.quantity;
    const templateCalPerUnit = template.calories / template.servingSize;

    if (templateCalPerUnit === 0 && newMealCalPerUnit === 0) return true;
    if (templateCalPerUnit === 0 || newMealCalPerUnit === 0) return false;

    const difference = Math.abs(newMealCalPerUnit - templateCalPerUnit) / templateCalPerUnit;
    
    return difference <= 0.1; // Considerar similar se a densidade calórica estiver dentro de uma margem de 10%
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseNumber(formData.quantity);
    const calories = parseNumber(formData.calories);
    const protein = parseNumber(formData.protein);
    const fat = parseNumber(formData.fat);
    const carbs = parseNumber(formData.carbs);
    
    if (formData.name.trim() === '' || quantity <= 0) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
      name: formData.name,
      quantity,
      unit: formData.unit,
      calories,
      protein,
      fat,
      carbs,
    };
    setMeals(prev => [...prev, newMeal]);
    
    const normalizedNewName = normalizeName(formData.name);
    const candidates = mealTemplates.filter(t => t.name === normalizedNewName);

    let createNewTemplate = false;
    
    if (candidates.length === 0) {
      createNewTemplate = true;
    } else {
      const similarCandidate = candidates.find(c => areMacrosSimilar({ calories, quantity }, c));
      if (!similarCandidate) {
        createNewTemplate = true;
      } else {
        setFeedback({
          message: `Refeição adicionada. O modelo '${similarCandidate.originalName}' foi utilizado.`,
          type: 'info'
        });
      }
    }

    if (createNewTemplate && formData.name.trim() !== '') {
      const newTemplate: MealTemplate = {
        id: crypto.randomUUID(),
        originalName: formData.name.trim(),
        name: normalizedNewName,
        servingSize: quantity,
        servingUnit: formData.unit,
        calories,
        protein,
        fat,
        carbs,
      };
      setMealTemplates(prev => [...prev, newTemplate]);
      setFeedback({
        message: `Refeição adicionada e novo modelo '${newTemplate.originalName}' salvo!`,
        type: 'success'
      });
    }

    setFormData(initialFormState);
    setSelectedTemplate(null);
  };

  const handleDeleteMeal = (mealId: string) => {
    if (window.confirm("Tem certeza que deseja apagar esta refeição?")) {
        setMeals(prev => prev.filter(m => m.id !== mealId));
    }
  };

  const openImportModal = () => {
    setParsedMeals([]);
    setParsingAttempted(false);
    setImportText('');
    setImportModalOpen(true);
  };
  
  const handleParseText = () => {
      setIsParsing(true);
      setParsingAttempted(true);
      const results = parseNutritionText(importText);
      
      const mealAggregator = new Map<string, Omit<MealTemplate, 'id'>>();
      const baseTemplates = new Map<string, Omit<MealTemplate, 'id'>>();

      for (const meal of results) {
          const key = `${meal.originalName.toLowerCase().trim()}|${meal.servingUnit}`;
          
          if (mealAggregator.has(key)) {
              const existing = mealAggregator.get(key)!;
              existing.servingSize += meal.servingSize;
              existing.calories += meal.calories;
              existing.protein += meal.protein;
              existing.fat += meal.fat;
              existing.carbs += meal.carbs;
          } else {
              // First time seeing this item. Store it for aggregation and as the base template.
              mealAggregator.set(key, { ...meal }); 
              baseTemplates.set(key, { ...meal });
          }
      }

      const aggregatedResults = Array.from(mealAggregator.values());

      setParsedMeals(aggregatedResults.map((m, i) => ({ ...m, tempId: i, selected: true })));
      setBaseParsedTemplates(baseTemplates);
      setIsParsing(false);
  }

  const handleSaveSelectedTemplates = () => {
    const newTemplatesToSave = parsedMeals
        .filter(m => m.selected)
        .map(selectedAggregatedMeal => {
             const key = `${selectedAggregatedMeal.originalName.toLowerCase().trim()}|${selectedAggregatedMeal.servingUnit}`;
             // Retrieve the base template (first occurrence) instead of using the aggregated one
             return baseParsedTemplates.get(key);
        })
        .filter((template): template is Omit<MealTemplate, 'id'> => !!template); // Filter out any undefined results
    
    setMealTemplates(prev => {
        const existingNormalizedNames = new Set(prev.map(t => t.name));
        const uniqueNewTemplates = newTemplatesToSave
            .filter(t => !existingNormalizedNames.has(t.name))
            .map(t => ({...t, id: crypto.randomUUID()}));
        return [...prev, ...uniqueNewTemplates];
    });

    setImportModalOpen(false);
  }

  const toggleParsedMealSelection = (tempId: number) => {
    setParsedMeals(prev => prev.map(m => m.tempId === tempId ? { ...m, selected: !m.selected } : m));
  }
  
  const importModalFooter = parsedMeals.length > 0 ? (
      <Button onClick={handleSaveSelectedTemplates} className="w-full">
          Salvar Modelos Selecionados
      </Button>
  ) : null;

  const todayMeals = meals.filter(m => m.date.startsWith(getTodayISO()));
  
  const totals = todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      carbs: acc.carbs + meal.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });


  return (
    <div className="space-y-6">
       {feedback && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white ${feedback.type === 'success' ? 'bg-primary' : 'bg-secondary'}`}>
          {feedback.message}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Nutrição</h1>
        <Button onClick={openImportModal}>
            <ImportIcon className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Importar Modelos</span>
            <span className="sm:hidden">Importar</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Refeição</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
             <div>
                <label htmlFor="food-name" className="block text-sm font-medium text-text-secondary mb-1">Alimento</label>
                <div className="relative">
                    <Input id="food-name" name="name" value={formData.name} onChange={handleChange} required 
                      list={isMobile ? undefined : 'meal-templates'}
                      autoComplete="off"
                      placeholder="Digite para buscar ou adicionar"
                      className={isMobile ? 'pr-10' : ''}
                    />
                     {isMobile && (
                        <button type="button" onClick={() => setSelectionModalOpen(true)} className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-primary" aria-label="Selecionar Alimento">
                            <ListIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {!isMobile && (
                    <datalist id="meal-templates">
                        {mealTemplateNames.map(option => <option key={option} value={option} />)}
                    </datalist>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Quantidade" name="quantity" type="number" step="any" value={formData.quantity} onChange={handleChange} required onFocus={e => e.target.select()}/>
                <Input label="Unidade" name="unit" value={formData.unit} onChange={handleChange} required/>
            </div>
            <Input label="Calorias" name="calories" type="number" step="any" value={formData.calories} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Proteína (g)" name="protein" type="number" step="0.1" value={formData.protein} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Gordura (g)" name="fat" type="number" step="0.1" value={formData.fat} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Carboidratos (g)" name="carbs" type="number" step="0.1" value={formData.carbs} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Button type="submit" className="w-full !mt-4">Adicionar Refeição</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Refeições de Hoje</h2>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Alimento</th>
                  <th className="p-2">Qtd</th>
                  <th className="p-2">Kcal</th>
                  <th className="p-2">P/G/C (g)</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {todayMeals.map(meal => (
                  <tr key={meal.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-2">{meal.name}</td>
                    <td className="p-2">{meal.quantity} {meal.unit}</td>
                    <td className="p-2">{meal.calories.toFixed(0)}</td>
                    <td className="p-2">{meal.protein.toFixed(1)}/{meal.fat.toFixed(1)}/{meal.carbs.toFixed(1)}</td>
                    <td className="p-2 text-right">
                        <button onClick={() => handleDeleteMeal(meal.id)} className="text-gray-500 hover:text-red-500 p-1">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </td>
                  </tr>
                ))}
                {todayMeals.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-text-secondary">Nenhuma refeição registrada hoje.</td></tr>}
              </tbody>
              {todayMeals.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-600 font-bold bg-surface">
                    <td className="p-2">Total</td>
                    <td className="p-2"></td>
                    <td className="p-2">{totals.calories.toFixed(0)}</td>
                    <td className="p-2">{totals.protein.toFixed(1)}/{totals.fat.toFixed(1)}/{totals.carbs.toFixed(1)}</td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
           <div className="space-y-3 md:hidden">
              {todayMeals.length > 0 ? todayMeals.map(meal => (
                  <Card key={meal.id} className="p-3 !bg-background relative group">
                      <p className="font-bold text-text-primary">{meal.name}</p>
                      <p className="text-sm text-text-secondary">{meal.quantity} {meal.unit} - {meal.calories.toFixed(0)} kcal</p>
                      <p className="text-xs text-gray-500">P: {meal.protein.toFixed(1)}g / G: {meal.fat.toFixed(1)}g / C: {meal.carbs.toFixed(1)}g</p>
                      <button onClick={() => handleDeleteMeal(meal.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                  </Card>
              )) : (
                  <p className="p-4 text-center text-text-secondary">Nenhuma refeição registrada hoje.</p>
              )}
              {todayMeals.length > 0 && (
                <div className="p-3 mt-4 border-t-2 border-gray-600 text-sm">
                    <p className="font-bold text-text-primary">Total Hoje:</p>
                    <p className="text-text-secondary">{totals.calories.toFixed(0)} kcal</p>
                    <p className="text-xs text-gray-500">P: {totals.protein.toFixed(1)}g / G: {totals.fat.toFixed(1)}g / C: {totals.carbs.toFixed(1)}g</p>
                </div>
              )}
          </div>
        </Card>
      </div>
      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Modelos de Refeição" footer={importModalFooter}>
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
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Modelos encontrados:</h3>
                        <Button variant="danger" onClick={() => {
                            if (window.confirm("Tem certeza que deseja apagar TODOS os modelos de refeição? Esta ação não pode ser desfeita.")) {
                                setMealTemplates([]);
                            }
                        }}>Apagar Todos</Button>
                    </div>
                    <div className="space-y-2 pr-2 max-h-60 overflow-y-auto">
                        {parsedMeals.map(meal => (
                           <div key={meal.tempId} className="flex items-center bg-background p-2 rounded-md">
                                <input type="checkbox" checked={meal.selected} onChange={() => toggleParsedMealSelection(meal.tempId)} className="mr-3 h-5 w-5 rounded text-primary focus:ring-primary bg-surface border-gray-600"/>
                                <label className="text-sm flex-grow" onClick={() => toggleParsedMealSelection(meal.tempId)}>{meal.originalName} ({meal.calories}kcal)</label>
                           </div>
                        ))}
                    </div>
                </div>
            )}
            {parsingAttempted && parsedMeals.length === 0 && !isParsing && (
                <p className="text-center text-red-500 mt-4">Nenhum item válido encontrado no texto. Verifique o formato, por exemplo: "- 3 ovos: 210 Kcal | 18g proteína | 1g carboidrato | 15g gordura"</p>
            )}
        </div>
      </Modal>
      {isMobile && <MealSelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} templates={mealTemplates} onSelect={handleSelectTemplate} onDelete={handleDeleteTemplate} />}
    </div>
  );
};