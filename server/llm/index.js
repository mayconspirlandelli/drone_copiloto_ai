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
    envKey: () => process.env.GOOGLE_API_KEY,
    create: (model, apiKey) => createGemini({ apiKey, model }),
  },
  openai: {
    label: 'OpenAI',
    available: () => Boolean(process.env.OPENAI_API_KEY),
    missing: 'OPENAI_API_KEY',
    model: () => process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    envKey: () => process.env.OPENAI_API_KEY,
    create: (model, apiKey) => createOpenAI({ apiKey, model }),
  },
  anthropic: {
    label: 'Anthropic Claude',
    available: () => Boolean(process.env.ANTHROPIC_API_KEY),
    missing: 'ANTHROPIC_API_KEY',
    model: () => process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    envKey: () => process.env.ANTHROPIC_API_KEY,
    create: (model, apiKey) => createAnthropic({ apiKey, model }),
  },
  ollama: {
    label: 'Ollama (local)',
    // Sem chave: habilitado quando OLLAMA_MODEL ou OLLAMA_BASE_URL estiver definido.
    available: () => Boolean(process.env.OLLAMA_MODEL || process.env.OLLAMA_BASE_URL),
    missing: 'OLLAMA_MODEL',
    model: () => process.env.OLLAMA_MODEL || 'mistral-small3.1',
    // Sem chave do usuário: o servidor só fala com o Ollama configurado no .env (evita SSRF).
    local: true,
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

// Sugestões exibidas no campo de modelo do site (o usuário pode digitar qualquer outro).
const SUGESTOES = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o'],
  anthropic: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'],
  ollama: ['qwen3-vl:4b', 'mistral-small3.1', 'gemma4:e4b'],
}

const MODELO_VALIDO = /^[\w.:/-]{1,100}$/

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
    aceitaChave: !p.local,
    sugestoes: SUGESTOES[id],
  }))
}

/**
 * Retorna o adaptador do provedor. `apiKey` e `model` vêm do formulário do site; sem eles,
 * usa a chave e o modelo do .env. A chave do usuário não é guardada nem registrada em log.
 */
export function getProvider(id, { apiKey, model } = {}) {
  const p = PROVIDERS[id]
  if (!p) throw new ProviderConfigError(`Provedor desconhecido: ${id}`, 400)

  const modelo = model?.trim() || p.model()
  if (!MODELO_VALIDO.test(modelo)) throw new ProviderConfigError('Nome de modelo inválido.', 400)

  const chaveUsuario = !p.local && apiKey?.trim()
  if (chaveUsuario) return { id, label: p.label, ...p.create(modelo, chaveUsuario) }

  if (!p.available()) {
    const dica = p.local ? `Defina ${p.missing} no .env do servidor.` : `Informe sua chave de API no campo "Chave" ou defina ${p.missing} no .env.`
    throw new ProviderConfigError(`${p.label} não está configurado. ${dica}`, 503)
  }
  const key = `${id}:${modelo}`
  if (!cache.has(key)) cache.set(key, { id, label: p.label, ...p.create(modelo, p.envKey?.()) })
  return cache.get(key)
}
