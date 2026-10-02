import { createAnthropic } from './anthropic.js'
import { createGemini } from './gemini.js'
import { createOpenAI } from './openai.js'

// Provedores suportados. Cada um fica disponível quando sua chave (ou URL) está no .env.
const PROVIDERS = {
  gemini: {
    label: 'Google Gemini',
    available: () => Boolean(process.env.GOOGLE_API_KEY),
    missing: 'GOOGLE_API_KEY',
    model: () => process.env.GEMINI_MODEL || process.env.ADK_MODEL || 'gemini-2.5-flash',
    create: (model) => createGemini({ apiKey: process.env.GOOGLE_API_KEY, model }),
  },
  openai: {
    label: 'OpenAI',
    available: () => Boolean(process.env.OPENAI_API_KEY),
    missing: 'OPENAI_API_KEY',
    model: () => process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    create: (model) => createOpenAI({ apiKey: process.env.OPENAI_API_KEY, model }),
  },
  anthropic: {
    label: 'Anthropic Claude',
    available: () => Boolean(process.env.ANTHROPIC_API_KEY),
    missing: 'ANTHROPIC_API_KEY',
    model: () => process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    create: (model) => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model }),
  },
  ollama: {
    label: 'Ollama (local)',
    // Sem chave: habilitado quando OLLAMA_MODEL ou OLLAMA_BASE_URL estiver definido.
    available: () => Boolean(process.env.OLLAMA_MODEL || process.env.OLLAMA_BASE_URL),
    missing: 'OLLAMA_MODEL',
    model: () => process.env.OLLAMA_MODEL || 'mistral-small3.1',
    create: (model) =>
      createOpenAI({
        apiKey: 'ollama',
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        model,
        local: true,
      }),
  },
}

const cache = new Map()

/** Erro de configuração do provedor (desconhecido ou sem chave). */
export class ProviderConfigError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function defaultProvider() {
  const preferred = process.env.LLM_PROVIDER
  if (preferred && PROVIDERS[preferred]?.available()) return preferred
  return Object.keys(PROVIDERS).find((id) => PROVIDERS[id].available()) ?? preferred ?? 'gemini'
}

export function listProviders() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    label: p.label,
    model: p.model(),
    disponivel: p.available(),
    configurar: p.missing,
  }))
}

/** Retorna o adaptador do provedor, ou lança um erro com status 503 se não estiver configurado. */
export function getProvider(id) {
  const p = PROVIDERS[id]
  if (!p) throw new ProviderConfigError(`Provedor desconhecido: ${id}`, 400)
  if (!p.available()) {
    throw new ProviderConfigError(`${p.label} não está configurado. Defina ${p.missing} no arquivo .env e reinicie o servidor.`, 503)
  }
  const model = p.model()
  const key = `${id}:${model}`
  if (!cache.has(key)) cache.set(key, { id, label: p.label, ...p.create(model) })
  return cache.get(key)
}
