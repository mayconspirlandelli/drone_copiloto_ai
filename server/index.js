import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001

const app = express()

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
