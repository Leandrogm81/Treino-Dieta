import React, { useState } from 'react';
import type { User, Exercise } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button } from '../components/ui';
import { getTodayISO } from '../services/dataService';

type ExerciseFormData = Omit<Exercise, 'id' | 'userId' | 'date' | 'reps'> & { reps: string };

const initialFormState: ExerciseFormData = { name: '', sets: 0, reps: '', load: 0, technique: '', notes: '' };

export const Workout: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
  const [formData, setFormData] = useState<ExerciseFormData>(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExercise: Exercise = {
      ...formData,
      reps: parseInt(formData.reps, 10) || 0, // Simplified for storage
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
    };
    setExercises(prev => [...prev, newExercise]);
    setFormData(initialFormState);
  };
  
  const todayExercises = exercises.filter(ex => ex.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-text-primary">Treino</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Exercício</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Exercício" name="name" value={formData.name} onChange={handleChange} required/>
            <Input label="Séries" name="sets" type="number" value={formData.sets} onChange={handleChange} required/>
            <Input label="Repetições" name="reps" value={formData.reps} onChange={handleChange} required/>
            <Input label="Carga (kg)" name="load" type="number" value={formData.load} onChange={handleChange} required/>
            <Input label="Técnica" name="technique" value={formData.technique || ''} onChange={handleChange} />
            <Input label="Observações" name="notes" value={formData.notes || ''} onChange={handleChange} />
            <Button type="submit" className="w-full !mt-4">Adicionar</Button>
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
    </div>
  );
};