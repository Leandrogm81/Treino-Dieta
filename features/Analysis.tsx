
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, ProgressLog, Exercise, Meal, Cardio, AllUserData, BackupData, MealTemplate, ExerciseTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Select } from '../components/ui';
import { checkAchievements, exportToCsv, getTodayISO, exportAllDataToJson } from '../services/dataService';

type Tab = 'Progresso' | 'Conquistas' | 'Exportar' | 'Admin';

const initialProgressFormState: Omit<ProgressLog, 'id' | 'userId' | 'date'> = {
    weight: 0, height: 0, bodyFat: 0, muscleMass: 0,
    waist: 0, abdomen: 0, hip: 0, visceralFat: 0,
    metabolism: 0, chest: 0, leftArm: 0, rightArm: 0,
    leftThigh: 0, rightThigh: 0,
};

const ProgressTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [progress, setProgress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
    const [exercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
    const [formData, setFormData] = useState(initialProgressFormState);
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const uniqueExercises = useMemo(() => Array.from(new Set(exercises.map(e => e.name))), [exercises]);
    
    useEffect(() => {
        if(feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    }

    const handleProgressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackMessage(null);
        
        const hasLoggedToday = progress.some(log => log.date.startsWith(getTodayISO()));
        if (hasLoggedToday) {
            setFeedbackMessage({ type: 'error', text: 'Você já registrou suas medidas hoje.' });
            return;
        }

        const newLog: ProgressLog = { ...formData, id: crypto.randomUUID(), userId: currentUser.id, date: new Date().toISOString() };
        setProgress(prev => [...prev, newLog]);
        setFeedbackMessage({ type: 'success', text: 'Medidas salvas com sucesso!' });
    };
    
    const loadProgressionData = useMemo(() => {
        if (!selectedExercise) return [];
        return exercises
            .filter(e => e.name === selectedExercise)
            .map(e => ({ date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), Carga: e.load }))
            .sort((a,b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
    }, [selectedExercise, exercises]);

    const volumeData = useMemo(() => {
        const volumeByDate: { [date: string]: number } = {};
        exercises.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const volume = (volumeByDate[date] || 0) + (e.sets * e.reps * e.load);
            volumeByDate[date] = volume;
        });
        return Object.entries(volumeByDate)
            .map(([date, volume]) => ({ date, Volume: volume / 1000 })) // in tons
            .sort((a,b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
    }, [exercises]);

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold mb-4">Registrar Medidas Corporais</h2>
                <form onSubmit={handleProgressSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Input label="Peso (kg)" name="weight" type="number" step="0.1" value={formData.weight || ''} onChange={handleFormChange} required/>
                        <Input label="Altura (cm)" name="height" type="number" value={formData.height || ''} onChange={handleFormChange} required/>
                        <Input label="% Gordura" name="bodyFat" type="number" step="0.1" value={formData.bodyFat || ''} onChange={handleFormChange}/>
                        <Input label="% Músculo" name="muscleMass" type="number" step="0.1" value={formData.muscleMass || ''} onChange={handleFormChange}/>
                        <Input label="Gord. Visceral" name="visceralFat" type="number" value={formData.visceralFat || ''} onChange={handleFormChange}/>
                        <Input label="Metabolismo (kcal)" name="metabolism" type="number" value={formData.metabolism || ''} onChange={handleFormChange}/>
                        <Input label="Peito (cm)" name="chest" type="number" step="0.1" value={formData.chest || ''} onChange={handleFormChange}/>
                        <Input label="Braço Esq. (cm)" name="leftArm" type="number" step="0.1" value={formData.leftArm || ''} onChange={handleFormChange}/>
                        <Input label="Braço Dir. (cm)" name="rightArm" type="number" step="0.1" value={formData.rightArm || ''} onChange={handleFormChange}/>
                        <Input label="Cintura (cm)" name="waist" type="number" step="0.1" value={formData.waist || ''} onChange={handleFormChange}/>
                        <Input label="Abdômen (cm)" name="abdomen" type="number" step="0.1" value={formData.abdomen || ''} onChange={handleFormChange}/>
                        <Input label="Quadril (cm)" name="hip" type="number" step="0.1" value={formData.hip || ''} onChange={handleFormChange}/>
                        <Input label="Coxa Esq. (cm)" name="leftThigh" type="number" step="0.1" value={formData.leftThigh || ''} onChange={handleFormChange}/>
                        <Input label="Coxa Dir. (cm)" name="rightThigh" type="number" step="0.1" value={formData.rightThigh || ''} onChange={handleFormChange}/>
                    </div>
                    <Button type="submit" className="w-full !mt-6">Salvar Medidas do Dia</Button>
                    {feedbackMessage && <p className={`text-center mt-2 text-sm ${feedbackMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>{feedbackMessage.text}</p>}
                </form>
            </Card>
            <Card>
                <h2 className="text-xl font-bold mb-4">Performance e Gráficos</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                <YAxis stroke="#9ca3af" unit="kg" domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Line type="monotone" dataKey="Carga" stroke="#6366f1" />
                            </LineChart>
                        </ResponsiveContainer>
                        ) : <p className="text-text-secondary text-center py-10">Selecione um exercício com pelo menos 2 registros.</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Volume de Treino (toneladas)</h3>
                         {volumeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Bar dataKey="Volume" fill="#14b8a6" />
                            </BarChart>
                        </ResponsiveContainer>
                        ) : <p className="text-text-secondary text-center py-10">Nenhum treino com carga registrado.</p>}
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
    const [mealTemplates] = useLocalStorage<MealTemplate[]>(`mealTemplates_${currentUser.id}`, []);
    const [exerciseTemplates] = useLocalStorage<ExerciseTemplate[]>(`exerciseTemplates_${currentUser.id}`, []);
    
    const [importFeedback, setImportFeedback] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportAll = () => {
        const backupData: BackupData = {
            meals,
            exercises,
            cardio,
            progress,
            mealTemplates,
            exerciseTemplates,
        };
        exportAllDataToJson(backupData, 'backup_completo.json');
    };

    const triggerFileInput = () => {
        setImportFeedback('');
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('O arquivo não pôde ser lido.');
                
                const data = JSON.parse(text) as BackupData;

                const requiredKeys: (keyof BackupData)[] = ['meals', 'exercises', 'cardio', 'progress', 'mealTemplates', 'exerciseTemplates'];
                const hasAllKeys = requiredKeys.every(key => key in data && Array.isArray(data[key]));
                
                if (!hasAllKeys) {
                    throw new Error('Arquivo de backup inválido ou corrompido.');
                }

                if (window.confirm('Tem certeza? A importação substituirá TODOS os seus dados atuais. Esta ação não pode ser desfeita.')) {
                    localStorage.setItem(`meals_${currentUser.id}`, JSON.stringify(data.meals || []));
                    localStorage.setItem(`exercises_${currentUser.id}`, JSON.stringify(data.exercises || []));
                    localStorage.setItem(`cardio_${currentUser.id}`, JSON.stringify(data.cardio || []));
                    localStorage.setItem(`progress_${currentUser.id}`, JSON.stringify(data.progress || []));
                    localStorage.setItem(`mealTemplates_${currentUser.id}`, JSON.stringify(data.mealTemplates || []));
                    localStorage.setItem(`exerciseTemplates_${currentUser.id}`, JSON.stringify(data.exerciseTemplates || []));
                    
                    setImportFeedback('Dados importados com sucesso! É recomendado recarregar a página para ver as alterações.');
                }
            } catch (error) {
                console.error(error);
                setImportFeedback(error instanceof Error ? error.message : 'Ocorreu um erro ao importar o arquivo.');
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Exportar e Importar Dados</h2>
            <Card>
                <h3 className="text-xl font-bold mb-4">Backup Completo</h3>
                <p className="text-text-secondary mb-4">Salve todos os seus dados (registros e modelos) em um único arquivo de backup ou restaure a partir de um arquivo salvo.</p>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={handleExportAll}>Exportar Tudo (.json)</Button>
                    <Button onClick={triggerFileInput} variant="secondary">Importar Backup (.json)</Button>
                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
                </div>
                {importFeedback && <p className={`mt-4 text-center text-sm ${importFeedback.includes('sucesso') ? 'text-green-400' : 'text-red-500'}`}>{importFeedback}</p>}
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4">Exportação Individual (CSV)</h3>
                <p className="text-text-secondary mb-4">Faça o backup de dados individuais em formato CSV para análise externa.</p>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => exportToCsv(meals, 'nutricao.csv')} variant="secondary">Exportar Nutrição</Button>
                    <Button onClick={() => exportToCsv(exercises, 'treinos.csv')} variant="secondary">Exportar Treinos</Button>
                    <Button onClick={() => exportToCsv(cardio, 'cardio.csv')} variant="secondary">Exportar Cardio</Button>
                    <Button onClick={() => exportToCsv(progress, 'progresso.csv')} variant="secondary">Exportar Progresso</Button>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
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
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Análise e Mais</h1>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
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
