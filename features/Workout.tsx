import React, { useState, useMemo } from 'react';
import type { User, Exercise, ExerciseTemplate } from '../types';
import { useLocalStorage } from '../hooks/useAuth';
import { Card, Input, Button, Modal, Textarea, Spinner } from '../components/ui';
import { getTodayISO } from '../services/dataService';
import { parseWorkoutText } from '../services/parserService';
import { ImportIcon } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';

type ExerciseFormData = {
    name: string;
    sets: string;
    reps: string;
    load: string;
    technique: string;
    notes: string;
};
type ParsedExercise = Omit<ExerciseTemplate, 'id'> & { tempId: number; selected: boolean; };

const initialFormState: ExerciseFormData = { name: '', sets: '3', reps: '10', load: '0', technique: '', notes: '' };

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const ExerciseSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    templates: ExerciseTemplate[];
    onSelect: (template: ExerciseTemplate) => void;
    onDelete: (templateId: string) => void;
}> = ({ isOpen, onClose, templates, onSelect, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Exercício">
            <div className="flex flex-col space-y-4">
                <Input
                    placeholder="Buscar exercício..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <ul className="max-h-64 overflow-y-auto space-y-2">
                    {filteredTemplates.map((template) => (
                        <li key={template.id} className="flex items-center justify-between p-3 bg-background rounded-md hover:bg-gray-700 group">
                           <div onClick={() => onSelect(template)} className="flex-grow cursor-pointer">
                                <p className="font-semibold">{template.name}</p>
                                <p className="text-sm text-text-secondary">{template.sets}x, {template.notes}</p>
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

export const Workout: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(`exercises_${currentUser.id}`, []);
  const [exerciseTemplates, setExerciseTemplates] = useLocalStorage<ExerciseTemplate[]>(`exerciseTemplates_${currentUser.id}`, []);
  const [formData, setFormData] = useState<ExerciseFormData>(initialFormState);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingAttempted, setParsingAttempted] = useState(false);
  const isMobile = useIsMobile();

  const exerciseTemplateNames = useMemo(() => exerciseTemplates.map(t => t.name), [exerciseTemplates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'name' && !isMobile) {
        const selectedTemplate = exerciseTemplates.find(t => t.name === value);
        if (selectedTemplate) {
            handleSelectTemplate(selectedTemplate)
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectTemplate = (template: ExerciseTemplate) => {
      setFormData(prev => ({
          ...prev, // Keep existing load
          name: template.name,
          sets: String(template.sets),
          reps: String(template.reps),
          technique: template.technique || '',
          notes: template.notes || '',
      }));
      setSelectionModalOpen(false);
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm("Tem certeza que deseja apagar este modelo?")) {
        setExerciseTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date: new Date().toISOString(),
      name: formData.name,
      sets: parseFloat(formData.sets) || 0,
      reps: parseFloat(formData.reps) || 0,
      load: parseFloat(formData.load) || 0,
      technique: formData.technique,
      notes: formData.notes,
    };
    setExercises(prev => [...prev, newExercise]);
    setFormData(prev => ({...initialFormState, name: prev.name})); // Keep name for next set
  };

  const openImportModal = () => {
    setParsedExercises([]);
    setParsingAttempted(false);
    setImportText('');
    setImportModalOpen(true);
  };

  const handleParseText = () => {
    setIsParsing(true);
    setParsingAttempted(true);
    const results = parseWorkoutText(importText);
    setParsedExercises(results.map((ex, i) => ({ ...ex, tempId: i, selected: true })));
    setIsParsing(false);
  };

  const handleSaveSelectedTemplates = () => {
    const newTemplatesRaw: Omit<ExerciseTemplate, 'id'>[] = parsedExercises
      .filter(ex => ex.selected)
      .map(({ tempId, selected, ...exData }) => exData);
    
    setExerciseTemplates(prev => {
        const existingNames = new Set(prev.map(t => t.name.toLowerCase()));
        const uniqueNewTemplates = newTemplatesRaw
            .filter(t => !existingNames.has(t.name.toLowerCase()))
            .map(t => ({...t, id: crypto.randomUUID()}));
        return [...prev, ...uniqueNewTemplates];
    });

    setImportModalOpen(false);
  };

  const toggleParsedExerciseSelection = (tempId: number) => {
    setParsedExercises(prev => prev.map(ex => ex.tempId === tempId ? { ...ex, selected: !ex.selected } : ex));
  };

  const importModalFooter = parsedExercises.length > 0 ? (
      <Button onClick={handleSaveSelectedTemplates} className="w-full">
          Salvar Modelos Selecionados
      </Button>
  ) : null;
  
  const todayExercises = exercises.filter(ex => ex.date.startsWith(getTodayISO()));

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Treino</h1>
        <Button onClick={openImportModal}>
            <ImportIcon className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Importar Modelos</span>
            <span className="sm:hidden">Importar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Registrar Exercício</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Exercício" name="name" value={formData.name} onChange={handleChange} required 
                list={!isMobile ? "exercise-templates" : undefined}
                dataListOptions={!isMobile ? exerciseTemplateNames : undefined}
                autoComplete="off"
                readOnly={isMobile}
                onClick={() => isMobile && setSelectionModalOpen(true)}
                onFocus={(e) => isMobile && e.target.blur()}
                placeholder={isMobile ? "Toque para selecionar" : "Digite ou selecione"}
            />
            <Input label="Séries" name="sets" type="number" value={formData.sets} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Repetições" name="reps" type="number" value={formData.reps} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Carga (kg)" name="load" type="number" value={formData.load} onChange={handleChange} required onFocus={e => e.target.select()}/>
            <Input label="Técnica" name="technique" value={formData.technique || ''} onChange={handleChange} />
            <Input label="Observações" name="notes" value={formData.notes || ''} onChange={handleChange} />
            <Button type="submit" className="w-full !mt-4">Adicionar Exercício</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Treino de Hoje</h2>
          <div className="overflow-x-auto hidden md:block">
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
                    <td className="p-2">{ex.technique || ex.notes}</td>
                  </tr>
                ))}
                {todayExercises.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-text-secondary">Nenhum exercício registrado hoje.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
              {todayExercises.length > 0 ? todayExercises.map(ex => (
                  <Card key={ex.id} className="p-3 !bg-background">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-bold text-text-primary">{ex.name}</p>
                              <p className="text-sm text-text-secondary">{ex.sets} séries x {ex.reps} reps</p>
                              { (ex.technique || ex.notes) && <p className="text-xs text-gray-500">Nota: {ex.technique || ex.notes}</p> }
                          </div>
                          <p className="font-semibold text-primary">{ex.load} kg</p>
                      </div>
                  </Card>
              )) : (
                  <p className="p-4 text-center text-text-secondary">Nenhum exercício registrado hoje.</p>
              )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Modelos de Treino" footer={importModalFooter}>
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
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="font-semibold">Modelos encontrados:</h3>
                         <Button variant="danger" onClick={() => setExerciseTemplates([])}>Apagar Todos</Button>
                    </div>
                    <div className="space-y-2 pr-2 max-h-60 overflow-y-auto">
                        {parsedExercises.map(ex => (
                           <div key={ex.tempId} className="flex items-center bg-background p-2 rounded-md">
                                <input type="checkbox" checked={ex.selected} onChange={() => toggleParsedExerciseSelection(ex.tempId)} className="mr-3 h-5 w-5 rounded text-primary focus:ring-primary bg-surface border-gray-600"/>
                                <label className="text-sm flex-grow" onClick={() => toggleParsedExerciseSelection(ex.tempId)}>{ex.name} ({ex.sets}x, {ex.notes})</label>
                           </div>
                        ))}
                    </div>
                </div>
            )}
            {parsingAttempted && parsedExercises.length === 0 && !isParsing && (
                <p className="text-center text-red-500 mt-4">Nenhum item válido encontrado no texto. Verifique o formato, por exemplo: "Supino Reto Barra 4x6-10"</p>
            )}
        </div>
      </Modal>
      {isMobile && <ExerciseSelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} templates={exerciseTemplates} onSelect={handleSelectTemplate} onDelete={handleDeleteTemplate}/>}
    </div>
  );
};