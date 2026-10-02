# DroneCopiloto AI — Copiloto de Voo e Cinematografia

Site do copiloto virtual em português para checklists pré e pós-voo, planejamento de captura, movimentos cinematográficos, análise de imagens e orientação de segurança para drones.

> Não substitui autorizações, manuais ou julgamento do piloto.

## Seções

| Seção | Componente | O que faz |
| --- | --- | --- |
| Hero | `src/components/sections/Hero.jsx` | Radar/HUD animado com órbita de exemplo |
| Plano de voo | `src/components/sections/FlightPlan.jsx` | Mapa com trajetória animada cena a cena, cone de câmera, perfil de altitude e tabela Cena / Movimento / Altura / Velocidade / Gimbal / Duração / Objetivo |
| Checklist | `src/components/sections/Checklist.jsx` | Pré-voo (etapas A–E, indoor opcional) e pós-voo, com veredito PRONTO / PRONTO COM RESTRIÇÕES / NÃO DECOLAR, salvo no `localStorage` |
| Movimentos | `src/components/sections/Movimentos.jsx` | 15 movimentos com diagrama animado, riscos e quando não executar |
| Câmera | `src/components/sections/Camera.jsx` | Regra do shutter 1/(2×FPS), simulador de inclinação do gimbal e ajustes |
| Segurança | `src/components/sections/Seguranca.jsx` | Limites, tipos de orientação, análise de imagem e fontes oficiais (SARPAS NG, DECEA, ANAC) |

Todo o conteúdo fica em `src/data/content.js` e deriva da skill `dronepilot-flight`.

## Skill do copiloto

A skill original (plugin Codex `dronepilot-ai` v0.1.0) está instalada como skill do Claude Code em
`.claude/skills/dronepilot-flight/SKILL.md`; o manifesto original está em `docs/dronepilot-plugin/plugin.json`.

## Desenvolvimento

```bash
npm install
npm run dev      # Vite em http://localhost:5173
npm run build    # gera dist/
npm start        # serve dist/ via Express (produção / Railway)
```
