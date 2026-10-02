# DroneCopiloto AI — Copiloto de Voo e Cinematografia

Site do **Copiloto AI**: copiloto virtual em português para checklists pré e pós-voo, planejamento de captura, movimentos cinematográficos, análise de imagens e orientação de segurança para drones.

> Não substitui autorizações, manuais ou julgamento do piloto.

## Páginas

| Rota | Página |
| --- | --- |
| `/` | **Página inicial do site Copiloto AI** — apresentação, plano de voo de exemplo, checklist, movimentos, câmera e segurança |
| `/plano-de-voo` | **Plano de voo com IA** — chat (texto ou voz) com o agente que cria o plano de voo |

### Página inicial (`/`)

| Seção | Componente | O que faz |
| --- | --- | --- |
| Hero | `src/components/sections/Hero.jsx` | Radar/HUD animado com órbita de exemplo |
| Plano de voo (exemplo) | `src/components/sections/FlightPlan.jsx` | Mapa com trajetória animada cena a cena, cone de câmera, perfil de altitude e tabela Cena / Movimento / Altura / Velocidade / Gimbal / Duração / Objetivo |
| Checklist | `src/components/sections/Checklist.jsx` | Pré-voo (etapas A–E, indoor opcional) e pós-voo, com veredito PRONTO / PRONTO COM RESTRIÇÕES / NÃO DECOLAR, salvo no `localStorage` |
| Movimentos | `src/components/sections/Movimentos.jsx` | 15 movimentos com diagrama animado, riscos e quando não executar |
| Câmera | `src/components/sections/Camera.jsx` | Regra do shutter 1/(2×FPS), simulador de inclinação do gimbal e ajustes |
| Segurança | `src/components/sections/Seguranca.jsx` | Limites, tipos de orientação, análise de imagem e fontes oficiais (SARPAS NG, DECEA, ANAC) |

Todo o conteúdo fica em `src/data/content.js` e deriva da skill `dronepilot-flight`.

### Plano de voo com IA (`/plano-de-voo`)

O agente conduz a conversa em etapas:

1. **Tipo de voo** e objetivo da filmagem
2. **Descrição do local**
3. **Horário** — manhã, tarde ou noite
4. **Foto do local** (opcional) — análise apenas do que é visível
5. **Desenho do mapa** — o agente abre um editor para o piloto desenhar o local visto de cima (construções, vegetação, água, vias, riscos e ponto de decolagem) e descrever os detalhes
6. **Planta baixa em estilo CAD** gerada a partir do desenho, com cotas, grade, norte e carimbo
7. **3 cenas** com o drone animado voando sobre a planta (trajetória, cone da câmera, alvo, altura, velocidade, gimbal, duração e riscos)

Entrada por voz e leitura das respostas usam a Web Speech API do navegador (pt-BR; ditado funciona no Chrome/Edge). O botão **Ver exemplo** mostra um resultado pronto sem chamar a API.

| Arquivo | Papel |
| --- | --- |
| `server/agent.js` | Agente neutro: instrução de sistema = skill `dronepilot-flight` + roteiro da conversa; ferramentas `solicitar_desenho` e `gerar_planta_e_cenas` em JSON Schema; laço de chamadas de ferramenta |
| `server/llm/` | Adaptadores por provedor, cada um com o SDK oficial: `gemini.js` (`@google/genai`), `openai.js` (`openai`, também usado pelo Ollama), `anthropic.js` (`@anthropic-ai/sdk`) e o registro `index.js` |
| `server/index.js` | Express: `GET /api/provedores`, `POST /api/plano-chat` e arquivos estáticos de `dist/` |
| `src/pages/PlanoDeVooChat.jsx` | Chat, anexos de foto, voz e resultado |
| `src/components/plano/SketchPad.jsx` | Editor de desenho do mapa |
| `src/components/plano/PlantaCAD.jsx` | Planta baixa estilo AutoCAD + animação do drone |
| `src/data/demoPlano.js` | Resultado de exemplo |

### Modelos de IA suportados

| Provedor | Variáveis no `.env` | Modelo padrão |
| --- | --- | --- |
| Google Gemini | `GOOGLE_API_KEY`, `ADK_MODEL` | `gemini-2.5-flash` |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL` | `gpt-4.1-mini` |
| Anthropic Claude | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | `claude-opus-5-5` |
| Ollama (local) | `OLLAMA_MODEL`, `OLLAMA_BASE_URL` (opcional) | `mistral-small3.1` |

`LLM_PROVIDER` define o provedor padrão. No topo do chat há um seletor com todos os provedores; os que não têm chave aparecem marcados. Trocar de provedor começa uma conversa nova, porque cada API guarda o histórico em formato próprio.

Para o Ollama, use um modelo com **visão e ferramentas** (ex.: `mistral-small3.1`, `qwen3-vl`). Modelos pequenos podem demorar e errar o JSON da planta — o servidor valida o resultado e pede para o modelo gerar de novo quando vier incompleto.

Para adicionar outro provedor, crie um adaptador em `server/llm/` com `userMessage`, `call`, `toolResults` e `normalizeError` e registre-o em `server/llm/index.js`.

## Skill do copiloto

A skill original (plugin Codex `dronepilot-ai` v0.1.0) está instalada como skill do Claude Code em
`.claude/skills/dronepilot-flight/SKILL.md` e também é usada como instrução do agente. O manifesto original está em `docs/dronepilot-plugin/plugin.json`.

## Desenvolvimento

Copie `.env.example` para `.env` e preencha a chave de pelo menos um provedor (ou configure o Ollama) para usar o chat do plano de voo.

```bash
npm install
npm run dev:server   # API do agente em http://localhost:3001
npm run dev          # Vite em http://localhost:5173 (encaminha /api para a porta 3001)
npm run build        # gera dist/
npm start            # serve dist/ + API via Express (produção / Railway)
```
