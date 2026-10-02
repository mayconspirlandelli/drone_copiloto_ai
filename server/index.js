import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_FILE = path.join(__dirname, '..', '.env')
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

const { getProvider, runAgentTurn } = await import('./agent.js')
const { defaultProvider, listProviders, ProviderConfigError } = await import('./llm/index.js')

const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001
const MAX_CONTENTS = 80

const app = express()
// Fotos e desenhos chegam em base64 (já reduzidos no navegador).
app.use(express.json({ limit: '20mb' }))

const mensagensDeErro = {
  401: 'Chave da API inválida. Confira o .env.',
  403: 'A chave não tem permissão para este modelo. Confira o .env.',
  404: 'Modelo não encontrado. Confira o nome do modelo no .env.',
  429: 'Limite de uso da API atingido. Aguarde alguns segundos e tente de novo.',
}

app.get('/api/provedores', (_req, res) => {
  res.json({ padrao: defaultProvider(), provedores: listProviders() })
})

app.post('/api/plano-chat', async (req, res) => {
  const { provider = defaultProvider(), history = [], mensagem } = req.body ?? {}

  const imagensOk =
    Array.isArray(mensagem?.images) &&
    mensagem.images.length <= 4 &&
    mensagem.images.every((img) => /^image\/(png|jpeg|webp|gif)$/.test(img?.mimeType) && typeof img.data === 'string')
  if (!Array.isArray(history) || history.length > MAX_CONTENTS || typeof mensagem?.text !== 'string' || !imagensOk) {
    res.status(400).json({ erro: 'Mensagem ou histórico de conversa inválido.' })
    return
  }

  try {
    res.json(await runAgentTurn({ provider, history, mensagem }))
  } catch (err) {
    if (err instanceof ProviderConfigError) {
      res.status(err.status).json({ erro: err.message })
      return
    }
    let normalizado = null
    try {
      normalizado = getProvider(provider).normalizeError(err)
    } catch {
      // provedor indisponível: cai no erro genérico
    }
    if (normalizado) {
      console.error(`[${provider}] ${normalizado.status}:`, normalizado.message)
      const erro = mensagensDeErro[normalizado.status] ?? `Falha na API (${normalizado.status}): ${normalizado.message.slice(0, 300)}`
      res.status(normalizado.status === 429 ? 429 : 502).json({ erro })
    } else {
      console.error(err)
      res.status(500).json({ erro: 'Erro inesperado no copiloto.' })
    }
  }
})

app.use('/api', (_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' })
})

app.use(express.static(DIST_DIR))

app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`DroneCopiloto AI rodando na porta ${PORT}`)
})
