
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, Meal, Cardio, ProgressLog, UserGoals, WaterLog } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { getTodayData } from '../services/dataService';
import { Card, Button, Modal, Input, ProgressBar } from '../components/ui';

const SummaryCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <Card className="text-center">
    <h3 className="text-lg text-text-secondary">{title}</h3>
    <p className={`text-3xl sm:text-4xl font-bold ${color}`}>{value}</p>
  </Card>
);

const RecentActivityList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <Card>
    <h3 className="font-bold text-lg mb-2 text-text-primary">{title}</h3>
    {items.length > 0 ? (
      <ul className="list-disc list-inside text-text-secondary space-y-1">
        {items.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    ) : (
      <p className="text-text-secondary">Nenhuma atividade hoje.</p>
    )}
  </Card>
);

const GoalSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  setGoals: (goals: UserGoals) => void;
}> = ({ isOpen, onClose, goals, setGoals }) => {
  const [formState, setFormState] = useState(goals);

  React.useEffect(() => {
    setFormState(goals);
  }, [goals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoals(formState);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Definir Metas Diárias">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Meta de Calorias (kcal)" name="calories" type="number" value={formState.calories} onChange={handleChange} onFocus={e => e.target.select()} />
        <Input label="Meta de Proteínas (g)" name="protein" type="number" value={formState.protein} onChange={handleChange} onFocus={e => e.target.select()}/>
        <Input label="Meta de Carboidratos (g)" name="carbs" type="number" value={formState.carbs} onChange={handleChange} onFocus={e => e.target.select()}/>
        <Input label="Meta de Gorduras (g)" name="fat" type="number" value={formState.fat} onChange={handleChange} onFocus={e => e.target.select()}/>
        <Input label="Meta de Água (ml)" name="water" type="number" value={formState.water} onChange={handleChange} onFocus={e => e.target.select()}/>
        <Button type="submit" className="w-full !mt-6">Salvar Metas</Button>
      </form>
    </Modal>
  );
};

const MacroProgress: React.FC<{ label: string; unit: string; current: number; goal: number; color: string }> = ({ label, unit, current, goal, color }) => {
    const remaining = goal - current;
    return (
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium text-text-secondary">{label}</span>
          <span className={`text-sm font-semibold ${remaining > 0 ? 'text-text-secondary' : 'text-primary'}`}>
            {goal > 0 ? `${current.toFixed(0)} / ${goal} ${unit}` : `${current.toFixed(0)} ${unit}`}
          </span>
        </div>
        <ProgressBar value={current} max={goal} colorClass={color} />
        {goal > 0 && (
          <p className="text-xs text-right mt-1 text-gray-400">
            {remaining >= 0 ? `Faltam ${remaining.toFixed(0)} ${unit}` : `+${Math.abs(remaining).toFixed(0)} ${unit} excedido`}
          </p>
        )}
      </div>
    );
};

export const Dashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [cardio] = useLocalStorage<Cardio[]>(`cardio_${currentUser.id}`, []);
  const [progress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
  const [goals, setGoals] = useLocalStorage<UserGoals>(`goals_${currentUser.id}`, { calories: 2000, protein: 150, carbs: 200, fat: 60, water: 2000 });
  const [waterLogs, setWaterLogs] = useLocalStorage<WaterLog[]>(`water_${currentUser.id}`, []);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  // FIX: Add explicit types to ensure correct type inference from getTodayData.
  const todayMeals: Meal[] = getTodayData(meals);
  const todayCardio: Cardio[] = getTodayData(cardio);
  const todayWater: WaterLog[] = getTodayData(waterLogs);

  const caloriesIn = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const proteinIn = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbsIn = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fatIn = todayMeals.reduce((sum, meal) => sum + meal.fat, 0);
  const waterIn = todayWater.reduce((sum, log) => sum + log.amount, 0);

  const caloriesOut = todayCardio.reduce((sum, act) => sum + act.calories, 0);
  const balance = caloriesIn - caloriesOut;

  const chartData = [...progress]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(p => ({
      date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: p.weight,
    }));

  const addWater = (amount: number) => {
    const newLog: WaterLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
      amount,
    };
    setWaterLogs(prev => [...prev, newLog]);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Dashboard</h1>
        <button onClick={() => setIsGoalsModalOpen(true)} className="text-text-secondary hover:text-primary transition-colors" aria-label="Definir Metas">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-text-primary mb-4">Progresso Diário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <MacroProgress label="Calorias" unit="kcal" current={caloriesIn} goal={goals.calories} color="bg-primary" />
          <MacroProgress label="Proteínas" unit="g" current={proteinIn} goal={goals.protein} color="bg-red-500" />
          <MacroProgress label="Carboidratos" unit="g" current={carbsIn} goal={goals.carbs} color="bg-yellow-500" />
          <MacroProgress label="Gorduras" unit="g" current={fatIn} goal={goals.fat} color="bg-indigo-500" />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col">
            <h3 className="text-lg text-text-secondary mb-2 text-center">Hidratação</h3>
            <div className="text-center my-auto">
                <p className="text-3xl sm:text-4xl font-bold text-blue-400">{waterIn.toLocaleString('pt-BR')} ml</p>
                {goals.water > 0 && <p className="text-text-secondary">Meta: {goals.water.toLocaleString('pt-BR')} ml</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="secondary" onClick={() => addWater(250)}>+1 Copo (250ml)</Button>
                <Button variant="secondary" onClick={() => addWater(500)}>+1 Garrafa (500ml)</Button>
            </div>
        </Card>
        <SummaryCard title="Calorias Gastas" value={caloriesOut.toLocaleString('pt-BR')} color="text-red-400" />
        <SummaryCard title="Balanço Calórico" value={balance.toLocaleString('pt-BR')} color={balance > 0 ? 'text-yellow-400' : 'text-blue-400'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentActivityList title="Refeições Recentes" items={todayMeals.map(m => `${m.name} (${m.calories} kcal)`)} />
        <RecentActivityList title="Cardio Recente" items={todayCardio.map(c => `${c.type} (${c.duration} min)`)} />
      </div>

      <Card>
        <h2 className="text-xl font-bold text-text-primary mb-4">Evolução do Peso Corporal</h2>
        {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" unit="kg" domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
            <Legend />
            <Line type="monotone" dataKey="peso" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
        ) : (
            <p className="text-text-secondary text-center py-10">Registre seu peso ao menos duas vezes para ver o gráfico de progresso.</p>
        )}
      </Card>
      <GoalSettingsModal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} goals={goals} setGoals={setGoals} />
    </div>
  );
};
