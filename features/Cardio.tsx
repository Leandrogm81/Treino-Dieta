

import React, { useState } from 'react';
// FIX: Renamed imported type `Cardio` to `CardioType` to resolve name collision
// with the `Cardio` component defined in this file.
import type { User, Cardio as CardioType } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Select } from '../components/ui';
import { getTodayISO } from '../services/dataService';

// FIX: Used renamed `CardioType`.
type CardioFormData = {
    type: string;
    duration: string;
    intensity: 'Baixa' | 'Média' | 'Alta';
    calories: string;
    speed: string;
};

const initialFormState: CardioFormData = { type: '', duration: '30', intensity: 'Média', calories: '0', speed: '0' };

export const Cardio: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  // FIX: Used renamed `CardioType`.
  const [cardio, setCardio] = useLocalStorage<CardioType[]>(`cardio_${currentUser.id}`, []);
  const [formData, setFormData] = useState<CardioFormData>(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Used renamed `CardioType`.
    const newCardio: CardioType = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
      type: formData.type,
      duration: parseFloat(formData.duration) || 0,
      intensity: formData.intensity,
      calories: parseFloat(formData.calories) || 0,
      speed: parseFloat(formData.speed) || 0,
    };
    setCardio(prev => [...prev, newCardio]);
    setFormData(initialFormState);
  };

  const todayCardio = cardio.filter(c => c.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Cardio</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Atividade</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Tipo (Corrida, Caminhada, etc.)" name="type" value={formData.type} onChange={handleChange} required/>
            <Input label="Duração (minutos)" name="duration" type="number" value={formData.duration} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Select label="Intensidade" name="intensity" value={formData.intensity} onChange={handleChange}>
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
            </Select>
            <Input label="Calorias Gastas" name="calories" type="number" value={formData.calories} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Velocidade (km/h, opcional)" name="speed" type="number" value={formData.speed} onChange={handleChange} onFocus={e => e.target.select()}/>
            <Button type="submit" className="w-full mt-2">Adicionar</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Cardio de Hoje</h2>
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Duração</th>
                  <th className="p-2">Kcal</th>
                  <th className="p-2">Velocidade</th>
                </tr>
              </thead>
              <tbody>
                {todayCardio.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-2">{c.type}</td>
                    <td className="p-2">{c.duration} min</td>
                    <td className="p-2">{c.calories}</td>
                    <td className="p-2">{c.speed ? `${c.speed} km/h` : '-'}</td>
                  </tr>
                ))}
                {todayCardio.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-text-secondary">Nenhuma atividade de cardio registrada hoje.</td></tr>}
              </tbody>
            </table>
          </div>
           <div className="space-y-3 md:hidden">
              {todayCardio.length > 0 ? todayCardio.map(c => (
                  <Card key={c.id} className="p-3 !bg-background">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="font-bold text-text-primary">{c.type}</p>
                              <p className="text-sm text-text-secondary">{c.duration} min - {c.intensity}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-semibold text-primary">{c.calories} kcal</p>
                              {c.speed ? <p className="text-xs text-gray-500">{c.speed} km/h</p> : ''}
                          </div>
                      </div>
                  </Card>
              )) : (
                  <p className="p-4 text-center text-text-secondary">Nenhuma atividade registrada hoje.</p>
              )}
          </div>
        </Card>
      </div>
    </div>
  );
};