import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_FILE = path.join(__dirname, '..', '.env')
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

const { ApiError, runAgentTurn } = await import('./agent.js')

const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001
const MAX_CONTENTS = 80

const app = express()
// Fotos e desenhos chegam em base64 (já reduzidos no navegador).
app.use(express.json({ limit: '20mb' }))

app.post('/api/plano-chat', async (req, res) => {
  const { contents } = req.body ?? {}

  if (!Array.isArray(contents) || contents.length === 0 || contents.length > MAX_CONTENTS) {
    res.status(400).json({ erro: 'Histórico de conversa inválido.' })
    return
  }
  if (!process.env.GOOGLE_API_KEY) {
    res.status(503).json({ erro: 'Copiloto sem chave da API do Gemini. Defina GOOGLE_API_KEY no arquivo .env e reinicie o servidor.' })
    return
  }
  if (contents.at(-1)?.role !== 'user') {
    res.status(400).json({ erro: 'A última mensagem deve ser do piloto.' })
    return
  }

  try {
    res.json(await runAgentTurn(contents))
  } catch (err) {
    if (err instanceof ApiError) {
      const msg = {
        401: 'Chave da API do Gemini inválida (GOOGLE_API_KEY).',
        403: 'Chave da API do Gemini sem permissão para este modelo (GOOGLE_API_KEY / ADK_MODEL).',
        404: 'Modelo não encontrado. Confira ADK_MODEL no .env.',
        429: 'Limite de uso da API do Gemini atingido. Aguarde alguns segundos e tente de novo.',
      }[err.status]
      console.error(`Gemini ${err.status}:`, err.message)
      // O Gemini devolve 400 também para chave inválida — repassa o motivo.
      const motivo = err.status === 400 ? /API key not valid/i.test(err.message) ? 'Chave da API do Gemini inválida (GOOGLE_API_KEY).' : `Requisição recusada pela API do Gemini: ${err.message.slice(0, 300)}` : null
      res.status(err.status === 429 ? 429 : 502).json({ erro: msg ?? motivo ?? `Falha na API do Gemini (${err.status}). Tente novamente.` })
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
