// src/components/AiHelper.tsx
import { useState } from 'react';
import { chatOpenRouter, type ChatMessage } from '../services/openrouter';

export default function AiHelper() {
  const [text, setText] = useState('Me dê uma ideia de almoço com 60g de proteína.');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>('openrouter/auto');

  async function handleAsk() {
    try {
      setLoading(true);
      setAnswer('');

      const messages: ChatMessage[] = [
        { role: 'system', content: 'Você é um coach de treino e dieta. Responda de forma prática e objetiva.' },
        { role: 'user', content: text },
      ];

      const data = await chatOpenRouter(messages, model);

      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.delta?.content ??
        '(sem resposta)';

      setAnswer(content);
    } catch (e: any) {
      setAnswer('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 800, margin: '24px auto', padding: 16 }}>
      <h2 style={{ margin: 0 }}>AI Helper (OpenRouter)</h2>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Prompt</span>
        <textarea
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreva sua pergunta aqui..."
        />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Modelo (opcional)</span>
        <input
          type="text"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder="openrouter/auto ou outro modelo"
        />
        <small>
          Dica: deixe <code>openrouter/auto</code> ou troque por um modelo específico do seu catálogo.
        </small>
      </label>

      <button onClick={handleAsk} disabled={loading} style={{ padding: '10px 16px', cursor: 'pointer' }}>
        {loading ? 'Consultando...' : 'Perguntar'}
      </button>

      <div>
        <h3>Resposta</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{answer}</pre>
      </div>
    </div>
  );
}
