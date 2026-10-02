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
| `server/agent.js` | Agente com a API do Google Gemini (`@google/genai`, modelo definido em `ADK_MODEL`, padrão `gemini-2.5-flash`): instrução de sistema = skill `dronepilot-flight` + roteiro da conversa; funções `solicitar_desenho` e `gerar_planta_e_cenas` |
| `server/index.js` | Express: `POST /api/plano-chat` e arquivos estáticos de `dist/` |
| `src/pages/PlanoDeVooChat.jsx` | Chat, anexos de foto, voz e resultado |
| `src/components/plano/SketchPad.jsx` | Editor de desenho do mapa |
| `src/components/plano/PlantaCAD.jsx` | Planta baixa estilo AutoCAD + animação do drone |
| `src/data/demoPlano.js` | Resultado de exemplo |

## Skill do copiloto

A skill original (plugin Codex `dronepilot-ai` v0.1.0) está instalada como skill do Claude Code em
`.claude/skills/dronepilot-flight/SKILL.md` e também é usada como instrução do agente. O manifesto original está em `docs/dronepilot-plugin/plugin.json`.

## Desenvolvimento

Copie `.env.example` para `.env` e preencha `GOOGLE_API_KEY` (necessária para o chat do plano de voo). Gere a chave em https://aistudio.google.com/apikey. `ADK_MODEL` define o modelo (padrão `gemini-2.5-flash`).

```bash
npm install
npm run dev:server   # API do agente em http://localhost:3001
npm run dev          # Vite em http://localhost:5173 (encaminha /api para a porta 3001)
npm run build        # gera dist/
npm start            # serve dist/ + API via Express (produção / Railway)
```
