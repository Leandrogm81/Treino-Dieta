

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

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


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

  const handleDeleteCardio = (cardioId: string) => {
    if (window.confirm("Tem certeza que deseja apagar esta atividade?")) {
        setCardio(prev => prev.filter(c => c.id !== cardioId));
    }
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
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {todayCardio.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-2">{c.type}</td>
                    <td className="p-2">{c.duration} min</td>
                    <td className="p-2">{c.calories}</td>
                    <td className="p-2">{c.speed ? `${c.speed} km/h` : '-'}</td>
                    <td className="p-2 text-right">
                        <button onClick={() => handleDeleteCardio(c.id)} className="text-gray-500 hover:text-red-500 p-1">
                           <TrashIcon className="w-5 h-5" />
                        </button>
                    </td>
                  </tr>
                ))}
                {todayCardio.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-text-secondary">Nenhuma atividade de cardio registrada hoje.</td></tr>}
              </tbody>
            </table>
          </div>
           <div className="space-y-3 md:hidden">
              {todayCardio.length > 0 ? todayCardio.map(c => (
                  <Card key={c.id} className="p-3 !bg-background relative group">
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
                      <button onClick={() => handleDeleteCardio(c.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                        <TrashIcon className="w-5 h-5"/>
                      </button>
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