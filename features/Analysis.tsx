
import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, ProgressLog, Exercise, Meal, Cardio, AllUserData } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Spinner, Select } from '../components/ui';
import { getProgressAnalysis } from '../services/geminiService';
import { checkAchievements, exportToCsv } from '../services/dataService';

type Tab = 'Progresso' | 'Conquistas' | 'Exportar' | 'Admin';

const ProgressTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [progress, setProgress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
    const [exercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
    const [formData, setFormData] = useState<Omit<ProgressLog, 'id' | 'userId' | 'date'>>({ weight: 0, height: 0 });
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    
    const uniqueExercises = useMemo(() => Array.from(new Set(exercises.map(e => e.name))), [exercises]);

    const handleProgressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: ProgressLog = { ...formData, id: crypto.randomUUID(), userId: currentUser.id, date: new Date().toISOString() };
        setProgress(prev => [...prev, newLog]);
    };
    
    const handleGetAnalysis = async () => {
        setIsLoading(true);
        try {
            const result = await getProgressAnalysis({ progress, exercises });
            setAnalysis(result);
        } catch (e) {
            setAnalysis((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadProgressionData = useMemo(() => {
        if (!selectedExercise) return [];
        return exercises
            .filter(e => e.name === selectedExercise)
            .map(e => ({ date: new Date(e.date).toLocaleDateString('pt-BR'), Carga: e.load }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedExercise, exercises]);

    const volumeData = useMemo(() => {
        const volumeByDate: { [date: string]: number } = {};
        exercises.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('pt-BR');
            const volume = (volumeByDate[date] || 0) + (e.sets * e.reps * e.load);
            volumeByDate[date] = volume;
        });
        return Object.entries(volumeByDate)
            .map(([date, volume]) => ({ date, Volume: volume / 1000 })) // in tons
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [exercises]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h2 className="text-xl font-bold mb-4">Registrar Medidas</h2>
                    <form onSubmit={handleProgressSubmit} className="space-y-2">
                        <Input label="Peso (kg)" type="number" step="0.1" value={formData.weight} onChange={e => setFormData(p => ({...p, weight: parseFloat(e.target.value)}))} required/>
                        <Input label="Altura (cm)" type="number" value={formData.height} onChange={e => setFormData(p => ({...p, height: parseFloat(e.target.value)}))} required/>
                        <Input label="% Gordura" type="number" step="0.1" value={formData.bodyFat || ''} onChange={e => setFormData(p => ({...p, bodyFat: parseFloat(e.target.value)}))}/>
                        <Input label="% Músculo" type="number" step="0.1" value={formData.muscleMass || ''} onChange={e => setFormData(p => ({...p, muscleMass: parseFloat(e.target.value)}))}/>
                        <Button type="submit" className="w-full mt-2">Salvar</Button>
                    </form>
                </Card>
                <Card className="md:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Coach de Bolso</h2>
                    <Button onClick={handleGetAnalysis} disabled={isLoading} className="mb-4 w-full flex justify-center">{isLoading ? <Spinner/> : "Obter Análise com IA"}</Button>
                    {analysis && <div className="bg-background p-3 rounded-md text-text-primary whitespace-pre-wrap">{analysis}</div>}
                </Card>
            </div>
            <Card>
                <h2 className="text-xl font-bold mb-4">Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-2">Progressão de Carga</h3>
                        <Select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className="mb-4">
                            <option value="">Selecione um exercício</option>
                            {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                        </Select>
                        {loadProgressionData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={loadProgressionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" unit="kg" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Line type="monotone" dataKey="Carga" stroke="#6366f1" />
                            </LineChart>
                        </ResponsiveContainer>
                        ) : <p className="text-text-secondary text-center">Selecione um exercício com pelo menos 2 registros.</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Volume de Treino (toneladas)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Bar dataKey="Volume" fill="#14b8a6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AchievementsTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [meals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
    const [exercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
    const [cardio] = useLocalStorage<Cardio[]>(`cardio_${currentUser.id}`, []);
    const [progress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);

    const allData: AllUserData = { meals, exercises, cardio, progress };
    const achievements = checkAchievements(allData);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Mural de Conquistas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map(ach => (
                    <Card key={ach.id} className={`transition-opacity ${ach.unlocked ? 'opacity-100 border-2 border-primary' : 'opacity-40'}`}>
                        <div className="flex items-center space-x-4">
                            <div>{ach.icon}</div>
                            <div>
                                <h3 className="font-bold text-lg">{ach.title}</h3>
                                <p className="text-sm text-text-secondary">{ach.description}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

const ExportTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [meals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
    const [exercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
    const [cardio] = useLocalStorage<Cardio[]>(`cardio_${currentUser.id}`, []);
    const [progress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Exportar Dados</h2>
            <Card>
                <p className="text-text-secondary mb-4">Faça o backup dos seus dados em formato CSV para análise externa.</p>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => exportToCsv(meals, 'nutricao.csv')}>Exportar Nutrição</Button>
                    <Button onClick={() => exportToCsv(exercises, 'treinos.csv')}>Exportar Treinos</Button>
                    <Button onClick={() => exportToCsv(cardio, 'cardio.csv')}>Exportar Cardio</Button>
                    <Button onClick={() => exportToCsv(progress, 'progresso.csv')}>Exportar Progresso</Button>
                </div>
            </Card>
        </div>
    );
}

const AdminTab: React.FC<{ users: User[], createUser: (u: string, p: string) => Promise<boolean> }> = ({ users, createUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const success = await createUser(username, password);
        if(success) {
            setMessage(`Usuário ${username} criado com sucesso!`);
            setUsername('');
            setPassword('');
        } else {
            setMessage(`Erro: Usuário ${username} já existe.`);
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">👑 Painel de Administração</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-bold mb-4">Criar Novo Usuário</h3>
                    <form onSubmit={handleCreateUser} className="space-y-3">
                        <Input label="Nome de usuário" value={username} onChange={e => setUsername(e.target.value)} required />
                        <Input label="Senha Temporária" value={password} onChange={e => setPassword(e.target.value)} required />
                        <Button type="submit" className="w-full">Criar Usuário</Button>
                        {message && <p className="text-center mt-2 text-sm text-green-400">{message}</p>}
                    </form>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold mb-4">Usuários Cadastrados</h3>
                    <ul className="space-y-2">
                        {users.map(user => (
                            <li key={user.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                <span>{user.username}</span>
                                <span className="text-xs font-mono px-2 py-1 rounded bg-gray-700">{user.isAdmin ? 'Admin' : 'Usuário'}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    )
}

export const Analysis: React.FC<{ currentUser: User, allUsers: User[], createUser: (u: string, p: string) => Promise<boolean> }> = ({ currentUser, allUsers, createUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Progresso');
  const TABS: Tab[] = ['Progresso', 'Conquistas', 'Exportar'];
  if (currentUser.isAdmin) TABS.push('Admin');

  const renderTabContent = () => {
    switch(activeTab) {
        case 'Progresso': return <ProgressTab currentUser={currentUser} />;
        case 'Conquistas': return <AchievementsTab currentUser={currentUser} />;
        case 'Exportar': return <ExportTab currentUser={currentUser} />;
        case 'Admin': return <AdminTab users={allUsers} createUser={createUser} />;
        default: return null;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-text-primary">Análise e Mais</h1>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};
