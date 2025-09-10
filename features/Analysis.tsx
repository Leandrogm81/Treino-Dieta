import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, ProgressLog, Exercise, Meal, Cardio, AllUserData, BackupData, MealTemplate, ExerciseTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Select, Modal } from '../components/ui';
import { checkAchievements, exportToCsv, getTodayISO, exportAllDataToJson } from '../services/dataService';

type Tab = 'Progresso' | 'Conquistas' | 'Gerenciar Dados' | 'Admin';

const parseNumber = (value: string | number): number => {
    return parseFloat(String(value).replace(',', '.')) || 0;
};

// ====================================================================================
// Progress View Sub-Components
// ====================================================================================

const SubTabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'}`}
    >
      {label}
    </button>
);

const timeRangeOptions = [
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '3m', label: '3 meses' },
    { value: '6m', label: '6 meses' },
    { value: '1y', label: '1 ano' },
    { value: 'all', label: 'Tudo' },
];

const BodyEvolutionTab: React.FC<{ progress: ProgressLog[] }> = ({ progress }) => {
    const [timeRange, setTimeRange] = useState('all');

    const filteredData = useMemo(() => {
        if (!progress || progress.length === 0) return [];

        const getStartDate = (range: string) => {
            const now = new Date();
            switch (range) {
                case '30d': return new Date(new Date().setDate(now.getDate() - 30));
                case '3m': return new Date(new Date().setMonth(now.getMonth() - 3));
                case '6m': return new Date(new Date().setMonth(now.getMonth() - 6));
                case '1y': return new Date(new Date().setFullYear(now.getFullYear() - 1));
                case 'all': default: return new Date(0);
            }
        };
        const startDate = getStartDate(timeRange);
        
        return progress
            .filter(p => new Date(p.date) >= startDate)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(p => ({
                date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                Peso: p.weight > 0 ? p.weight : null,
                'Gordura Corporal': p.bodyFat && p.bodyFat > 0 ? p.bodyFat : null,
                'Massa Muscular': p.muscleMass && p.muscleMass > 0 ? p.muscleMass : null,
            }));
    }, [progress, timeRange]);

    return (
        <Card>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold">Evolução Corporal</h2>
                <div className="flex flex-wrap gap-2">
                    {timeRangeOptions.map(opt => (
                        <button key={opt.value} onClick={() => setTimeRange(opt.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${timeRange === opt.value ? 'bg-primary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            {filteredData.length > 1 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" yAxisId="left" unit="kg" />
                        <YAxis stroke="#9ca3af" yAxisId="right" orientation="right" unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Peso" stroke="#14b8a6" strokeWidth={2} connectNulls activeDot={{ r: 8 }} />
                        <Line yAxisId="left" type="monotone" dataKey="Massa Muscular" stroke="#ef4444" strokeWidth={2} connectNulls activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Gordura Corporal" stroke="#6366f1" strokeWidth={2} connectNulls activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-text-secondary text-center py-10">
                    {progress.length <= 1 ? "Registre suas medidas ao menos duas vezes para ver o gráfico de progresso." : "Nenhum dado para o período selecionado."}
                </p>
            )}
        </Card>
    );
};

const circumferenceMetrics: { key: keyof Omit<ProgressLog, 'id' | 'userId' | 'date'>; label: string; unit: string }[] = [
    { key: 'chest', label: 'Peito', unit: 'cm' }, { key: 'waist', label: 'Cintura', unit: 'cm' },
    { key: 'abdomen', label: 'Abdômen', unit: 'cm' }, { key: 'hip', label: 'Quadril', unit: 'cm' },
    { key: 'leftArm', label: 'Braço Esq.', unit: 'cm' }, { key: 'rightArm', label: 'Braço Dir.', unit: 'cm' },
    { key: 'leftThigh', label: 'Coxa Esq.', unit: 'cm' }, { key: 'rightThigh', label: 'Coxa Dir.', unit: 'cm' },
];

const MeasurementsTab: React.FC<{ progress: ProgressLog[] }> = ({ progress }) => {
    const dataByMetric = useMemo(() => {
        return circumferenceMetrics.map(metric => {
            const data = progress
                .map(p => ({ date: p.date, value: p[metric.key] as number | undefined ?? 0 }))
                .filter(p => p.value > 0);
            
            // FIX: Ensure all objects returned have a consistent shape to prevent TypeScript errors.
            if (data.length === 0) return { ...metric, latest: null, changeSincePrevious: 0, changeSinceFirst: 0, chartData: [] };
            
            const latest = data[data.length - 1];
            const first = data[0];
            const previous = data.length > 1 ? data[data.length - 2] : null;
            
            const changeSincePrevious = previous ? latest.value - previous.value : 0;
            const changeSinceFirst = latest.value - first.value;

            return { ...metric, latest: latest.value, changeSincePrevious, changeSinceFirst, chartData: data };
        });
    }, [progress]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dataByMetric.map(metric => (
                <Card key={metric.key}>
                    <h3 className="text-md font-semibold text-text-secondary">{metric.label}</h3>
                    {metric.latest !== null ? (
                        <>
                            <p className="text-3xl font-bold text-text-primary">{metric.latest.toFixed(1)} <span className="text-lg">{metric.unit}</span></p>
                            <div className="text-xs mt-1 space-y-0.5">
                                <p className={metric.changeSincePrevious > 0 ? 'text-green-400' : metric.changeSincePrevious < 0 ? 'text-red-400' : ''}>
                                    {metric.changeSincePrevious > 0 && '+'}{metric.changeSincePrevious.toFixed(1)} (anterior)
                                </p>
                                <p className={metric.changeSinceFirst > 0 ? 'text-green-400' : metric.changeSinceFirst < 0 ? 'text-red-400' : ''}>
                                    {metric.changeSinceFirst > 0 && '+'}{metric.changeSinceFirst.toFixed(1)} (total)
                                </p>
                            </div>
                             <div className="mt-3 h-10">
                                {metric.chartData && metric.chartData.length > 1 && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metric.chartData}>
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} wrapperClassName="text-xs" />
                                            <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </>
                    ) : (
                         <p className="text-3xl font-bold text-text-primary">-</p>
                    )}
                </Card>
            ))}
        </div>
    );
};

const PerformanceTab: React.FC<{ exercises: Exercise[] }> = ({ exercises }) => {
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const uniqueExercises = useMemo(() => exercises.map(e => e.name).filter((value, index, self) => self.indexOf(value) === index), [exercises]);

    const loadProgressionData = useMemo(() => {
        if (!selectedExercise) return [];
        return exercises
            .filter(e => e.name === selectedExercise)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(e => ({ date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), Carga: e.load }));
    }, [selectedExercise, exercises]);

    const volumeData = useMemo(() => {
        const volumeByDate: { [date: string]: number } = {};
        exercises.forEach(e => {
            const date = e.date.split('T')[0];
            const volume = (volumeByDate[date] || 0) + (e.sets * e.reps * e.load);
            volumeByDate[date] = volume;
        });
        return Object.entries(volumeByDate)
            .sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, volume]) => ({ date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), Volume: volume / 1000 }));
    }, [exercises]);

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Performance de Treino</h2>
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
                    {volumeData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                                <Bar dataKey="Volume" fill="#14b8a6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-text-secondary text-center py-10">Registre ao menos dois treinos com carga.</p>}
                </div>
            </div>
        </Card>
    );
};

type ProgressFormData = { [K in keyof Omit<ProgressLog, 'id' | 'userId' | 'date'>]: string; };
const initialProgressFormState: ProgressFormData = {
    weight: '0', height: '0', bodyFat: '0', muscleMass: '0', waist: '0', abdomen: '0', hip: '0',
    visceralFat: '0', metabolism: '0', chest: '0', leftArm: '0', rightArm: '0', leftThigh: '0', rightThigh: '0',
};

const RegisterTab: React.FC<{
    progress: ProgressLog[];
    setProgress: (value: ProgressLog[] | ((val: ProgressLog[]) => ProgressLog[])) => void;
    currentUser: User;
}> = ({ progress, setProgress, currentUser }) => {
    const [formData, setFormData] = useState(initialProgressFormState);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if(feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name as keyof ProgressFormData]: e.target.value }));
    }

    const handleProgressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedbackMessage(null);
        if (progress.some(log => log.date.startsWith(getTodayISO()))) {
            setFeedbackMessage({ type: 'error', text: 'Você já registrou suas medidas hoje.' });
            return;
        }
        
        const numericFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, parseNumber(value)])
        ) as Omit<ProgressLog, 'id' | 'userId' | 'date'>;

        const newLog: ProgressLog = { ...numericFormData, id: crypto.randomUUID(), userId: currentUser.id, date: new Date().toISOString() };
        setProgress(prev => [...prev, newLog]);
        setFeedbackMessage({ type: 'success', text: 'Medidas salvas com sucesso!' });
    };

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Registrar Medidas Corporais</h2>
            <form onSubmit={handleProgressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Input label="Peso (kg)" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleFormChange} required onFocus={e => e.target.select()}/>
                    <Input label="Altura (cm)" name="height" type="number" step="0.1" value={formData.height} onChange={handleFormChange} required onFocus={e => e.target.select()}/>
                    <Input label="% Gordura" name="bodyFat" type="number" step="0.1" value={formData.bodyFat} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="% Músculo" name="muscleMass" type="number" step="0.1" value={formData.muscleMass} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Gord. Visceral" name="visceralFat" type="number" step="0.1" value={formData.visceralFat} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Metabolismo (kcal)" name="metabolism" type="number" step="any" value={formData.metabolism} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Peito (cm)" name="chest" type="number" step="0.1" value={formData.chest} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Braço Esq. (cm)" name="leftArm" type="number" step="0.1" value={formData.leftArm} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Braço Dir. (cm)" name="rightArm" type="number" step="0.1" value={formData.rightArm} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Cintura (cm)" name="waist" type="number" step="0.1" value={formData.waist} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Abdômen (cm)" name="abdomen" type="number" step="0.1" value={formData.abdomen} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Quadril (cm)" name="hip" type="number" step="0.1" value={formData.hip} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Coxa Esq. (cm)" name="leftThigh" type="number" step="0.1" value={formData.leftThigh} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                    <Input label="Coxa Dir. (cm)" name="rightThigh" type="number" step="0.1" value={formData.rightThigh} onChange={handleFormChange} onFocus={e => e.target.select()}/>
                </div>
                <Button type="submit" className="w-full !mt-6">Salvar Medidas do Dia</Button>
                {feedbackMessage && <p className={`text-center mt-2 text-sm ${feedbackMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>{feedbackMessage.text}</p>}
            </form>
        </Card>
    );
};

type ProgressSubTab = 'Evolução Corporal' | 'Minhas Medidas' | 'Performance do Treino' | 'Registrar Medidas';
const progressSubTabs: ProgressSubTab[] = ['Evolução Corporal', 'Minhas Medidas', 'Performance do Treino', 'Registrar Medidas'];

const ProgressView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [activeSubTab, setActiveSubTab] = useState<ProgressSubTab>('Evolução Corporal');
    const [progress, setProgress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
    const [exercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);

    return (
        <div className="space-y-4">
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {progressSubTabs.map(tab => (
                        <SubTabButton key={tab} label={tab} isActive={activeSubTab === tab} onClick={() => setActiveSubTab(tab)} />
                    ))}
                </nav>
            </div>
            <div>
                {activeSubTab === 'Evolução Corporal' && <BodyEvolutionTab progress={progress} />}
                {activeSubTab === 'Minhas Medidas' && <MeasurementsTab progress={progress} />}
                {activeSubTab === 'Performance do Treino' && <PerformanceTab exercises={exercises} />}
                {activeSubTab === 'Registrar Medidas' && <RegisterTab progress={progress} setProgress={setProgress} currentUser={currentUser} />}
            </div>
        </div>
    );
};

// ====================================================================================
// Main Analysis View Components
// ====================================================================================

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

const ManageDataTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [meals, setMeals] = useLocalStorage<Meal[]>(`meals_${currentUser.id}`, []);
    const [exercises, setExercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
    const [cardio, setCardio] = useLocalStorage<Cardio[]>(`cardio_${currentUser.id}`, []);
    const [progress, setProgress] = useLocalStorage<ProgressLog[]>(`progress_${currentUser.id}`, []);
    const [mealTemplates, setMealTemplates] = useLocalStorage<MealTemplate[]>(`mealTemplates_${currentUser.id}`, []);
    const [exerciseTemplates, setExerciseTemplates] = useLocalStorage<ExerciseTemplate[]>(`exerciseTemplates_${currentUser.id}`, []);
    
    const [importFeedback, setImportFeedback] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteRequest, setDeleteRequest] = useState<{key: string; name: string; action: () => void} | null>(null);

    const handleExportAll = () => {
        const backupData: BackupData = {
            meals,
            exercises,
            cardio,
            progress,
            mealTemplates,
            exerciseTemplates,
        };
        exportAllDataToJson(backupData, `backup_${currentUser.username}.json`);
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
                    setMeals(data.meals || []);
                    setExercises(data.exercises || []);
                    setCardio(data.cardio || []);
                    setProgress(data.progress || []);
                    setMealTemplates(data.mealTemplates || []);
                    setExerciseTemplates(data.exerciseTemplates || []);
                    
                    setImportFeedback('Dados importados com sucesso! A página será recarregada para aplicar as alterações.');
                    setTimeout(() => window.location.reload(), 2000);
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

    const confirmDelete = (key: string, name: string, action: () => void) => {
        setDeleteRequest({key, name, action});
    };

    const executeDelete = () => {
        if(deleteRequest) {
            deleteRequest.action();
            setDeleteRequest(null);
        }
    };
    
    const deleteModalFooter = (
        <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setDeleteRequest(null)}>Cancelar</Button>
            <Button variant="danger" onClick={executeDelete}>Confirmar Exclusão</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gerenciar Dados</h2>
             <Card>
                <h3 className="text-xl font-bold mb-4">Zona de Perigo</h3>
                <p className="text-text-secondary mb-4">As ações abaixo são permanentes e não podem ser desfeitas. Tenha cuidado.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     <Button variant="danger" onClick={() => confirmDelete('meals', 'Histórico de Refeições', () => setMeals([]))}>Apagar Refeições</Button>
                     <Button variant="danger" onClick={() => confirmDelete('exercises', 'Histórico de Treinos', () => setExercises([]))}>Apagar Treinos</Button>
                     <Button variant="danger" onClick={() => confirmDelete('cardio', 'Histórico de Cardio', () => setCardio([]))}>Apagar Cardio</Button>
                     <Button variant="danger" onClick={() => confirmDelete('progress', 'Histórico de Medições', () => setProgress([]))}>Apagar Medições</Button>
                     <Button variant="danger" onClick={() => confirmDelete('mealTemplates', 'Modelos de Refeição', () => setMealTemplates([]))}>Apagar Modelos (Nutrição)</Button>
                     <Button variant="danger" onClick={() => confirmDelete('exerciseTemplates', 'Modelos de Treino', () => setExerciseTemplates([]))}>Apagar Modelos (Treino)</Button>
                </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4">Backup e Restauração</h3>
                <p className="text-text-secondary mb-4">Salve todos os seus dados (registros e modelos) em um único arquivo ou restaure a partir de um arquivo salvo.</p>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={handleExportAll}>Exportar Tudo (.json)</Button>
                    <Button onClick={triggerFileInput} variant="secondary">Importar Backup (.json)</Button>
                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
                </div>
                {importFeedback && <p className={`mt-4 text-center text-sm ${importFeedback.includes('sucesso') ? 'text-green-400' : 'text-red-500'}`}>{importFeedback}</p>}
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4">Exportação Individual (CSV)</h3>
                <p className="text-text-secondary mb-4">Exporte dados individuais em formato CSV para análise em planilhas.</p>
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => exportToCsv(meals, 'nutricao.csv')} variant="secondary">Exportar Nutrição</Button>
                    <Button onClick={() => exportToCsv(exercises, 'treinos.csv')} variant="secondary">Exportar Treinos</Button>
                    <Button onClick={() => exportToCsv(cardio, 'cardio.csv')} variant="secondary">Exportar Cardio</Button>
                    <Button onClick={() => exportToCsv(progress, 'progresso.csv')} variant="secondary">Exportar Progresso</Button>
                </div>
            </Card>
            <Modal isOpen={!!deleteRequest} onClose={() => setDeleteRequest(null)} title="Confirmar Exclusão" footer={deleteModalFooter}>
                <p>Você tem certeza que deseja apagar permanentemente todo o seu <span className="font-bold text-red-500">{deleteRequest?.name}</span>?</p>
                <p className="mt-2 text-sm text-text-secondary">Esta ação não pode ser desfeita.</p>
            </Modal>
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
                        {message && <p className={`text-center mt-2 text-sm ${message.startsWith('Erro') ? 'text-red-500' : 'text-green-400'}`}>{message}</p>}
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
  const TABS: Tab[] = ['Progresso', 'Conquistas', 'Gerenciar Dados'];
  if (currentUser.isAdmin) TABS.push('Admin');

  const renderTabContent = () => {
    switch(activeTab) {
        case 'Progresso': return <ProgressView currentUser={currentUser} />;
        case 'Conquistas': return <AchievementsTab currentUser={currentUser} />;
        case 'Gerenciar Dados': return <ManageDataTab currentUser={currentUser} />;
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