---
name: add-landing-section
description: Add a new content section to the DroneCopiloto AI site (src/), following this project's established conventions for data, components, styling and visual verification. Use whenever the user asks to add, create, or build a new section/block on the site (e.g. "criar uma seção sobre X", "adicionar um bloco de Y").
---

# Add a landing page section

This project is a Vite + React + Tailwind CSS v4 site for DroneCopiloto AI, a
Portuguese-language drone flight & cinematography copilot (`src/`). It has no
CMS — every section is a React component fed by data in `src/data/content.js`.
The source of truth for domain content (checklists, movements, safety rules,
camera guidance) is the `dronepilot-flight` skill in
`.claude/skills/dronepilot-flight/SKILL.md` — follow its safety and factual
integrity rules (never claim live data, never declare absolute safety, cite
DECEA/ANAC/SARPAS NG for regulations). Follow this exact pattern for a new section so it stays
consistent with the rest of the codebase.

## 1. Get real content first

Never invent body copy, statistics, partner names, quotes, or icons/images
that weren't provided. If the user's request is missing the actual text for
a section, ask for it (or ask clarifying questions with `AskUserQuestion`
when the shape of the section itself is ambiguous — e.g. timeline vs. cards,
how many items) before writing any component. Reuse the phrasing you're
given close to verbatim — literal, sourced copy, not paraphrased marketing
filler. Numeric flight values are always "referências iniciais".

## 2. Put the content in `src/data/content.js`

Add new named exports there — plain data (strings, arrays of
`{ icon, title, description }` objects, etc.), not JSX. Icons come from
`lucide-react` (check a name exists before using it: `node -e "console.log(!!require('lucide-react').IconName)"`);
only fall back to a hand-drawn inline SVG (see
`src/components/icons/SocialIcons.jsx` for the pattern) when lucide-react
has no equivalent (e.g. brand logos). If the user provides real image
assets, import them from `src/assets/`.

## 3. Build the component in `src/components/sections/<Name>.jsx`

- Wrap content in the shared `<Container>` from `@/components/Container`
  (max-width 1140px, consistent horizontal padding) — don't hand-roll this.
- Use Tailwind utility classes with this project's color tokens defined in
  `src/index.css`'s `@theme inline` block: `dp-night-950/900/800/700`,
  `dp-line`, `dp-sky-400/200` (telemetry), `dp-signal-500/300` (primary
  action / active state), `dp-go-500`, `dp-warn-500`, `dp-stop-500`
  (verdicts: PRONTO / COM RESTRIÇÕES / NÃO DECOLAR), `dp-paper` and `dp-ink`
  (light sections). Don't introduce new hex colors.
- Typography: section eyebrow `font-mono text-xs tracking-[0.25em] uppercase`;
  titles `font-heading text-4xl sm:text-5xl font-bold` (Barlow Condensed);
  body Lato; telemetry/values `font-mono`.
- Alternate section backgrounds: dark (`bg-dp-night-950` / `bg-dp-night-900`)
  and light (`bg-dp-paper`) — never two of the same back to back. Wrap the
  section in `<SectionTransition bg=...>` in `App.jsx` with the same bg.
- Motion: `motion/react` with full `transform` strings, ease-out
  `[0.23, 1, 0.32, 1]`, UI transitions ≤ 250 ms, and always respect
  `useReducedMotion()` (see `.agents/skills/animate/SKILL.md`). Trajectory
  diagrams use SVG paths (see `FlightPlan.jsx`, `Movimentos.jsx`).
- Avoid AI-slop tropes: no left-border-accent-color cards, no emoji, no
  gradients as filler.
- Give the `<section>` a stable `id="kebab-case-name"` — sections are
  anchor-linked from the navbar in some cases.

## 4. Wire it into `src/App.jsx`

Add the import (alphabetical among the other section imports) and place the
`<Component />` in the page flow in the position the user asked for (or the
most sensible narrative position if unspecified — e.g. a "how it works"
section belongs near the existing process sections, not buried after the
footer-adjacent content).

## 5. Verify before reporting done

This is a UI change — always check it renders, per the top-level "Doing
tasks" instructions:

1. `npm run build` in the project root — must complete with no errors.
2. Start the dev server in the background and wait for it to respond:
   ```bash
   npm run dev -- --port 5173 --strictPort > /tmp/vite-dev.log 2>&1 &
   timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
   ```
3. Screenshot the new section with Playwright (see `.claude/skills/../run`
   skill, or reuse the scratchpad pattern from this project's history:
   `npx playwright install chromium` if not already cached, then a small
   `.mjs` script that does
   `page.goto(...)`, `page.locator('#section-id').screenshot(...)`, and logs
   `page.on('console', ...)` errors). Actually look at the resulting image —
   don't just trust that the build succeeded.
4. Kill the dev server process afterwards (`tasklist`/`taskkill` on
   Windows) so it doesn't leak between turns.

## 6. Report back

Summarize what file(s) changed and where the section sits in the page flow.
If you made a judgment call the user didn't specify (icon choice, section
background color, ordering), say so in one line rather than silently
deciding and moving on.
