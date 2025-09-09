
import React, { useState, useMemo } from 'react';
import type { User, Exercise, ExerciseTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Modal, Textarea, Spinner } from '../components/ui';
import { getTodayISO } from '../services/dataService';
import { parseWorkoutText } from '../services/parserService';
import { ImportIcon } from '../constants';

type ExerciseFormData = Omit<Exercise, 'id' | 'userId' | 'date'>;
type ParsedExercise = ExerciseTemplate & { tempId: number; selected: boolean; };

const initialFormState: ExerciseFormData = { name: '', sets: 0, reps: 0, load: 0, technique: '', notes: '' };

export const Workout: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
  const [exerciseTemplates, setExerciseTemplates] = useLocalStorage<ExerciseTemplate[]>(`exerciseTemplates_${currentUser.id}`, []);
  const [formData, setFormData] = useState<ExerciseFormData>(initialFormState);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const exerciseTemplateNames = useMemo(() => exerciseTemplates.map(t => t.name), [exerciseTemplates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === 'name') {
        const selectedTemplate = exerciseTemplates.find(t => t.name === value);
        if (selectedTemplate) {
            setFormData(prev => ({
                ...prev, // Mantém a carga (load) anterior
                ...selectedTemplate, // Preenche o resto com o modelo
                name: value, // Garante que o nome seja o valor atual
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExercise: Exercise = {
      ...formData,
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
    };
    setExercises(prev => [...prev, newExercise]);
    setFormData(initialFormState);
  };

  const handleParseText = () => {
    setIsParsing(true);
    const results = parseWorkoutText(importText);
    setParsedExercises(results.map((ex, i) => ({ ...ex, tempId: i, selected: true })));
    setIsParsing(false);
  };

  const handleSaveSelectedTemplates = () => {
    const newTemplates: ExerciseTemplate[] = parsedExercises
      .filter(ex => ex.selected)
      .map(({ tempId, selected, ...exData }) => exData);
    
    setExerciseTemplates(prev => {
        const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
        const uniqueNewTemplates = newTemplates.filter(t => !existingNames.has(t.name.toLowerCase()));
        return [...prev, ...uniqueNewTemplates];
    });

    setImportModalOpen(false);
    setImportText('');
    setParsedExercises([]);
  };

  const toggleParsedExerciseSelection = (tempId: number) => {
    setParsedExercises(prev => prev.map(ex => ex.tempId === tempId ? { ...ex, selected: !ex.selected } : ex));
  };
  
  const todayExercises = exercises.filter(ex => ex.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Treino</h1>
        <Button onClick={() => setImportModalOpen(true)}>
            <ImportIcon className="w-5 h-5 mr-2" />
            Importar Modelos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Exercício</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Exercício" name="name" value={formData.name} onChange={handleChange} required list="exercise-templates" dataListOptions={exerciseTemplateNames} autoComplete="off" />
            <Input label="Séries" name="sets" type="number" value={formData.sets} onChange={handleChange} required/>
            <Input label="Repetições" name="reps" type="number" value={formData.reps} onChange={handleChange} required/>
            <Input label="Carga (kg)" name="load" type="number" value={formData.load} onChange={handleChange} required/>
            <Input label="Técnica" name="technique" value={formData.technique || ''} onChange={handleChange} />
            <Input label="Observações" name="notes" value={formData.notes || ''} onChange={handleChange} />
            <Button type="submit" className="w-full !mt-4">Adicionar Exercício</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Treino de Hoje</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Exercício</th>
                  <th className="p-2">Séries x Reps</th>
                  <th className="p-2">Carga</th>
                  <th className="p-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {todayExercises.map(ex => (
                  <tr key={ex.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-2">{ex.name}</td>
                    <td className="p-2">{ex.sets} x {ex.reps}</td>
                    <td className="p-2">{ex.load} kg</td>
                    <td className="p-2">{ex.notes}</td>
                  </tr>
                ))}
                {todayExercises.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-text-secondary">Nenhum exercício registrado hoje.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Modelos de Treino">
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">Cole seu treino para criar modelos reutilizáveis. Eles não serão adicionados ao dia de hoje.</p>
            <Textarea 
                aria-label="Cole seu treino aqui para criar modelos"
                rows={10}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"Supino Reto Barra 4x6-10\nCrucifixo Inclinado Halteres 3x12-15\nParalelas no Banco/Barra 3xfalha"}
            />
            <Button onClick={handleParseText} disabled={isParsing || !importText} className="w-full">
                {isParsing ? <Spinner/> : "Processar Texto"}
            </Button>
            {parsedExercises.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Modelos encontrados:</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {parsedExercises.map(ex => (
                           <div key={ex.tempId} className="flex items-center bg-background p-2 rounded-md">
                                <input type="checkbox" checked={ex.selected} onChange={() => toggleParsedExerciseSelection(ex.tempId)} className="mr-3 h-5 w-5 rounded text-primary focus:ring-primary bg-surface border-gray-600"/>
                                <p className="text-sm">{ex.name} ({ex.sets}x, {ex.notes})</p>
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