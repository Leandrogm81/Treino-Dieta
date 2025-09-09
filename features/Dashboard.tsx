
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, Meal, Cardio, ProgressLog } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { getTodayData } from '../services/dataService';
import { Card } from '../components/ui';

const SummaryCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <Card className="text-center">
    <h3 className="text-lg text-text-secondary">{title}</h3>
    <p className={`text-4xl font-bold ${color}`}>{value}</p>
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

export const Dashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [meals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
  const [cardio] = useLocalStorage<Cardio[]>(`cardio_${currentUser.id}`, []);
  const [progress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);

  const todayMeals = getTodayData(meals);
  const todayCardio = getTodayData(cardio);

  const caloriesIn = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const caloriesOut = todayCardio.reduce((sum, act) => sum + act.calories, 0);
  const balance = caloriesIn - caloriesOut;

  const chartData = progress
    .map(p => ({
      date: new Date(p.date).toLocaleDateString('pt-BR'),
      peso: p.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Calorias Ingeridas" value={caloriesIn.toLocaleString('pt-BR')} color="text-green-400" />
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
            <YAxis stroke="#9ca3af" unit="kg" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
            <Legend />
            <Line type="monotone" dataKey="peso" stroke="#14b8a6" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
        ) : (
            <p className="text-text-secondary text-center py-10">Registre seu peso ao menos duas vezes para ver o gráfico de progresso.</p>
        )}
      </Card>
    </div>
  );
};
