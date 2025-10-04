// src/services/openrouter.ts
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatOpenRouter(messages: ChatMessage[], model?: string) {
  const resp = await fetch('/api/openrouter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  return resp.json();
}
