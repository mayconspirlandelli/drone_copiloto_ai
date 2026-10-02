import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ApiError, GoogleGenAI } from '@google/genai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILL_FILE = path.join(__dirname, '..', '.claude', 'skills', 'dronepilot-flight', 'SKILL.md')

const MODEL = process.env.ADK_MODEL || 'gemini-2.5-flash'
const MAX_TOOL_ROUNDS = 4

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

// A skill do copiloto é a fonte única das regras de segurança e do domínio.
function loadSkill() {
  const raw = fs.readFileSync(SKILL_FILE, 'utf-8')
  return raw.replace(/^---[\s\S]*?---\s*/, '')
}

const SYSTEM_PROMPT = `${loadSkill()}

## Modo desta conversa: criação guiada de plano de voo (site DroneCopiloto AI)

Você conversa com o piloto em um chat (ele pode digitar ou falar; mensagens de voz chegam transcritas). Conduza a conversa em etapas curtas, uma ou duas perguntas por vez, nesta ordem:

1. Tipo de voo: o que será filmado/fotografado e o objetivo (ex.: imóvel, evento, paisagem, inspeção, esporte).
2. Local: peça uma descrição do local (aberto/fechado, construções, árvores, fios, água, vias, pessoas, área de decolagem).
3. Horário: manhã, tarde ou noite. Para noite, lembre que voo noturno tem exigências próprias de iluminação e autorização e que a captura muda (ISO, shutter) — oriente a confirmar no SARPAS NG/DECEA.
4. Foto (opcional): convide a enviar uma foto do local pelo botão de anexo. Ao analisar, descreva apenas o que é visível e aponte o que exige inspeção presencial.
5. Desenho do mapa: chame a ferramenta \`solicitar_desenho\` para abrir o editor de desenho e peça que o piloto desenhe uma vista de cima do local (construções, árvores, vias, água, fios, área de decolagem) e descreva em texto os detalhes e as dimensões aproximadas.
6. Quando receber o desenho (imagem) e tiver informação suficiente, chame \`gerar_planta_e_cenas\` UMA vez para gerar a planta baixa em estilo CAD e 3 cenas diferentes.

Regras para \`gerar_planta_e_cenas\`:
- Coordenadas em METROS, origem (0,0) no canto superior esquerdo, x para a direita (leste) e y para baixo (sul). Mantenha tudo dentro de largura_m × profundidade_m.
- Interprete o desenho do piloto com fidelidade: proporções e posições relativas. Quando estimar uma medida, registre a premissa em "observacoes".
- Inclua exatamente um elemento do tipo "decolagem" em local livre de obstáculos.
- Gere exatamente 3 cenas com movimentos diferentes (ex.: Orbit, Dronie, Reveal, Top Down, Side Tracking, Dolly In, Ascending Reveal) que façam sentido para o objetivo. Cada trajetória tem de 2 a 12 pontos, mantém distância de fios, pessoas e obstáculos e não sobrevoa áreas com pessoas.
- "alvo" é o ponto para onde a câmera aponta quando camera = "subject".
- Valores de altura/velocidade são referências iniciais.

Depois que a ferramenta retornar, escreva um resumo curto do plano (3 cenas em uma frase cada), os principais riscos e lembre do checklist pré-voo no site. Nunca diga que verificou meteorologia, espaço aéreo ou autorizações.

Formato das respostas no chat: português do Brasil, frases curtas, sem tabelas longas (a planta e as cenas aparecem visualmente na tela). Use listas simples quando ajudar.`

const pointSchema = {
  type: 'object',
  properties: { x: { type: 'number' }, y: { type: 'number' } },
  required: ['x', 'y'],
  additionalProperties: false,
}

const FUNCTION_DECLARATIONS = [
  {
    name: 'solicitar_desenho',
    description:
      'Abre na tela do piloto um editor para desenhar o mapa do local visto de cima. Use quando já souber o tipo de voo, o local e o horário e precisar do croqui para montar a planta baixa.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        instrucoes: {
          type: 'string',
          description: 'Instrução curta mostrada acima do editor (o que desenhar e o que descrever).',
        },
      },
      required: ['instrucoes'],
      additionalProperties: false,
    },
  },
  {
    name: 'gerar_planta_e_cenas',
    description:
      'Gera a planta baixa do local em estilo CAD (vista superior, em metros) a partir do desenho e da descrição do piloto, mais 3 sugestões de cenas com a trajetória do drone sobre a planta. O site renderiza e anima o resultado.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        resumo: {
          type: 'object',
          properties: {
            titulo: { type: 'string' },
            tipo_voo: { type: 'string' },
            local: { type: 'string' },
            periodo: { type: 'string', enum: ['manha', 'tarde', 'noite'] },
          },
          required: ['titulo', 'tipo_voo', 'local', 'periodo'],
          additionalProperties: false,
        },
        planta: {
          type: 'object',
          properties: {
            largura_m: { type: 'number', description: 'Extensão leste-oeste da área desenhada, em metros.' },
            profundidade_m: { type: 'number', description: 'Extensão norte-sul da área desenhada, em metros.' },
            elementos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tipo: {
                    type: 'string',
                    enum: [
                      'edificacao',
                      'arvore',
                      'vegetacao',
                      'via',
                      'agua',
                      'muro',
                      'fio_eletrico',
                      'poste',
                      'pessoas',
                      'obstaculo',
                      'decolagem',
                      'outro',
                    ],
                  },
                  rotulo: { type: 'string' },
                  forma: { type: 'string', enum: ['retangulo', 'circulo', 'linha'] },
                  x: { type: 'number', description: 'retangulo: canto superior esquerdo; circulo: centro.' },
                  y: { type: 'number' },
                  largura: { type: 'number', description: 'retangulo: largura em m; demais: 0.' },
                  altura: { type: 'number', description: 'retangulo: profundidade em m; demais: 0.' },
                  raio: { type: 'number', description: 'circulo: raio em m; demais: 0.' },
                  pontos: { type: 'array', items: pointSchema, description: 'linha: 2 ou mais pontos; demais: [].' },
                  altura_estimada_m: {
                    type: ['number', 'null'],
                    description: 'Altura vertical estimada do elemento, se relevante (ex.: prédio, árvore, poste).',
                  },
                },
                required: ['tipo', 'rotulo', 'forma', 'x', 'y', 'largura', 'altura', 'raio', 'pontos', 'altura_estimada_m'],
                additionalProperties: false,
              },
            },
            observacoes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Premissas de medidas e pontos que exigem inspeção presencial.',
            },
          },
          required: ['largura_m', 'profundidade_m', 'elementos', 'observacoes'],
          additionalProperties: false,
        },
        cenas: {
          type: 'array',
          description: 'Exatamente 3 cenas.',
          items: {
            type: 'object',
            properties: {
              nome: { type: 'string' },
              movimento: { type: 'string' },
              objetivo: { type: 'string' },
              altura: { type: 'string', description: 'Ex.: "30 m" ou "5 → 40 m".' },
              velocidade: { type: 'string' },
              gimbal: { type: 'string' },
              duracao_s: { type: 'number' },
              camera: { type: 'string', enum: ['forward', 'subject', 'back', 'down'] },
              alvo: pointSchema,
              trajetoria: { type: 'array', items: pointSchema },
              riscos: { type: 'string' },
            },
            required: [
              'nome',
              'movimento',
              'objetivo',
              'altura',
              'velocidade',
              'gimbal',
              'duracao_s',
              'camera',
              'alvo',
              'trajetoria',
              'riscos',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['resumo', 'planta', 'cenas'],
      additionalProperties: false,
    },
  },
]

function toolResultFor(call) {
  if (call.name === 'solicitar_desenho') {
    return 'Editor de desenho aberto na tela do piloto. Aguarde o desenho e a descrição.'
  }
  if (call.name === 'gerar_planta_e_cenas') {
    const cenas = call.args?.cenas?.length ?? 0
    return `Planta baixa e ${cenas} cenas exibidas ao piloto com animação.`
  }
  return 'Ferramenta desconhecida.'
}

/**
 * Executa um turno do agente. `contents` é o histórico completo no formato da API do Gemini
 * (o navegador guarda e reenvia sem alterar — inclusive as assinaturas de raciocínio
 * que o modelo devolve). Retorna os novos conteúdos a anexar ao histórico.
 */
export async function runAgentTurn(contents) {
  const history = [...contents]
  const appended = []
  const events = { desenho: null, plano: null }
  let finalText = ''

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
        maxOutputTokens: 16000,
      },
    })

    const candidate = response.candidates?.[0]
    if (!candidate?.content) {
      finalText ||= 'Não posso ajudar com esse pedido. Podemos ajustar o plano para uma captura mais segura?'
      break
    }

    // Guarda o conteúdo do modelo como veio (partes de texto, chamadas e assinaturas).
    const modelContent = { role: 'model', parts: candidate.content.parts ?? [] }
    history.push(modelContent)
    appended.push(modelContent)

    const text = modelContent.parts
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text)
      .join('')
      .trim()
    if (text) finalText = finalText ? `${finalText}

${text}` : text

    if (candidate.finishReason === 'MAX_TOKENS') {
      finalText ||= 'A resposta ficou longa demais e foi interrompida. Pode repetir o pedido?'
      break
    }

    const calls = response.functionCalls ?? []
    if (calls.length === 0) break

    for (const call of calls) {
      if (call.name === 'solicitar_desenho') events.desenho = call.args
      if (call.name === 'gerar_planta_e_cenas') events.plano = call.args
    }

    const results = {
      role: 'user',
      parts: calls.map((call) => ({
        functionResponse: { id: call.id, name: call.name, response: { result: toolResultFor(call) } },
      })),
    }
    history.push(results)
    appended.push(results)
  }

  return { appended, text: finalText, ...events }
}

export { ApiError }
