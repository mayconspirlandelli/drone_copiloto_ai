// Conteúdo do DroneCopiloto AI.
// Fonte: instruções da skill `dronepilot-flight` (.claude/skills/dronepilot-flight/SKILL.md).
// Valores numéricos são referências iniciais de planejamento, nunca garantias universais.

export const navLinks = [
  { label: 'Plano de voo', href: '#plano-de-voo' },
  { label: 'Checklist', href: '#checklist' },
  { label: 'Movimentos', href: '#movimentos' },
  { label: 'Câmera', href: '#camera' },
  { label: 'Segurança', href: '#seguranca' },
]

export const hero = {
  eyebrow: 'Copiloto de voo e cinematografia',
  title: 'Planeje, cheque e filme com um copiloto ao seu lado.',
  subtitle:
    'Copiloto virtual em português para checklists pré e pós-voo, planejamento de captura, movimentos cinematográficos, análise de imagens e orientação de segurança.',
  disclaimer: 'Não substitui autorizações, manuais ou julgamento do piloto.',
  intents: [
    'Checklist pré-voo',
    'Plano de voo',
    'Cenas cinematográficas',
    'Analisar imagem',
    'Configurar câmera',
    'Configurar gimbal',
    'Avaliação de segurança',
    'Checklist pós-voo',
  ],
}

/* ------------------------------------------------------------------ */
/* Plano de voo de exemplo                                             */
/* ------------------------------------------------------------------ */

export const flightPlan = {
  title: 'Imóvel rural ao entardecer',
  objetivo: 'Vídeo de 60 s apresentando o imóvel e o entorno, com narrativa de abertura a encerramento.',
  premissas: [
    'Drone com gimbal de 3 eixos e sensores de obstáculo frontais',
    'Área aberta, sem pessoas sob a trajetória',
    'Vento e rajadas dentro do limite do fabricante',
    'Consulta e autorização confirmadas no SARPAS NG',
    'Piloto com experiência em voo manual',
  ],
  // Mapa (vista superior) em viewBox 800×500. Cada cena é um trecho da trajetória.
  home: { x: 110, y: 430 },
  house: { x: 385, y: 210, w: 110, h: 80 },
  scenes: [
    {
      id: 1,
      fase: 'Abertura',
      movimento: 'Ascending Reveal',
      camera: 'forward',
      altura: '0 → 40 m',
      velocidade: '2 m/s',
      gimbal: '−10° → 0°',
      duracao: 8,
      objetivo: 'Subir por trás das árvores revelando o horizonte.',
      alt: [0, 40],
      d: 'M110 430 C 130 410, 150 390, 175 370',
    },
    {
      id: 2,
      fase: 'Apresentação do ambiente',
      movimento: 'Dolly In',
      camera: 'forward',
      altura: '40 m',
      velocidade: '3 m/s',
      gimbal: '−20°',
      duracao: 10,
      objetivo: 'Aproximar do imóvel mostrando o entorno.',
      alt: [40, 40],
      d: 'M175 370 L 320 300',
    },
    {
      id: 3,
      fase: 'Contexto',
      movimento: 'Top Down',
      camera: 'down',
      altura: '60 m',
      velocidade: '1 m/s',
      gimbal: '−90°',
      duracao: 6,
      objetivo: 'Mostrar a geometria do terreno de cima.',
      alt: [40, 60],
      d: 'M320 300 Q 390 260, 440 250 L 440 140',
    },
    {
      id: 4,
      fase: 'Movimento principal',
      movimento: 'Orbit',
      camera: 'subject',
      altura: '30 m · raio ≈ 55 m',
      velocidade: '2 m/s',
      gimbal: '−25°',
      duracao: 15,
      objetivo: 'Destacar o imóvel em 360°, mantendo-o no centro do quadro.',
      alt: [60, 30],
      d: 'M440 140 A 110 110 0 0 1 440 360 A 110 110 0 0 1 440 140',
    },
    {
      id: 5,
      fase: 'Detalhes',
      movimento: 'Side Tracking',
      camera: 'subject',
      altura: '15 m',
      velocidade: '2 m/s',
      gimbal: '−10°',
      duracao: 8,
      objetivo: 'Acompanhar a fachada lateralmente, revelando detalhes.',
      alt: [30, 15],
      d: 'M440 140 L 610 140',
    },
    {
      id: 6,
      fase: 'Encerramento',
      movimento: 'Dronie',
      camera: 'back',
      altura: '15 → 50 m',
      velocidade: '3 m/s',
      gimbal: '−15°',
      duracao: 10,
      objetivo: 'Afastar e subir de costas, encerrando com escala.',
      alt: [15, 50],
      d: 'M610 140 L 730 70',
    },
  ],
  // Retorno para pouso (não faz parte da captura)
  rth: 'M730 70 C 560 120, 260 360, 110 430',
  hazards: [
    { kind: 'wire', label: 'Rede elétrica — manter distância', d: 'M40 250 L 300 40' },
    { kind: 'people', label: 'Área com pessoas — não sobrevoar', x: 560, y: 330, w: 190, h: 120 },
  ],
}

/* ------------------------------------------------------------------ */
/* Checklists                                                          */
/* ------------------------------------------------------------------ */

// `critical: true` → item pendente impede a decolagem (NÃO DECOLAR).
export const preFlightStages = [
  {
    id: 'meteo',
    letter: 'A',
    title: 'Meteorologia',
    note: 'Consulte uma fonte meteorológica atual — o copiloto não inventa condições em tempo real.',
    items: [
      { id: 'meteo-previsao', label: 'Previsão atualizada consultada', critical: true },
      { id: 'meteo-vento', label: 'Vento e rajadas dentro do limite do fabricante', critical: true },
      { id: 'meteo-chuva', label: 'Sem chuva ou raios na região', critical: true },
      { id: 'meteo-visibilidade', label: 'Visibilidade adequada', critical: true },
      { id: 'meteo-temp', label: 'Temperatura dentro da faixa operacional da bateria' },
      { id: 'meteo-luz', label: 'Iluminação adequada para a captura' },
    ],
  },
  {
    id: 'espaco',
    letter: 'B',
    title: 'Espaço aéreo',
    note: 'Nunca considere a autorização concedida sem confirmação verificável.',
    link: { label: 'Abrir SARPAS NG', href: 'https://sarpas.decea.mil.br/' },
    items: [
      { id: 'espaco-sarpas', label: 'Consulta realizada no SARPAS NG', critical: true },
      { id: 'espaco-restricoes', label: 'Restrições, aeródromos e helipontos verificados', critical: true },
      { id: 'espaco-trafego', label: 'Tráfego aéreo na região avaliado' },
      { id: 'espaco-autorizacao', label: 'Autorizações aplicáveis confirmadas', critical: true },
    ],
  },
  {
    id: 'inspecao',
    letter: 'C',
    title: 'Inspeção',
    items: [
      { id: 'insp-helices', label: 'Hélices sem danos e bem fixadas', critical: true },
      { id: 'insp-bracos', label: 'Braços abertos e travados', critical: true },
      { id: 'insp-bateria', label: 'Bateria travada e com carga', critical: true },
      { id: 'insp-controle', label: 'Controle carregado' },
      { id: 'insp-cartao', label: 'Cartão de memória com espaço' },
      { id: 'insp-lente', label: 'Lente e sensores limpos' },
      { id: 'insp-gimbal', label: 'Gimbal livre e protetor removido', critical: true },
      { id: 'insp-danos', label: 'Sem danos estruturais aparentes', critical: true },
    ],
  },
  {
    id: 'init',
    letter: 'D',
    title: 'Inicialização',
    note: '60 m é preferência de planejamento, não regra legal universal. Siga o limite mais restritivo entre lei, autorização, fabricante e avaliação de risco.',
    items: [
      { id: 'init-gnss', label: 'Satélites suficientes e boa qualidade de sinal', critical: true },
      { id: 'init-home', label: 'Home Point registrado', critical: true },
      { id: 'init-modo', label: 'Modo de voo conferido' },
      { id: 'init-limites', label: 'Limites de altura e distância configurados', critical: true },
      { id: 'init-rth', label: 'Altura de RTH acima dos obstáculos', critical: true },
      { id: 'init-sinal', label: 'Comportamento em perda de sinal definido', critical: true },
      { id: 'init-alertas', label: 'Sem alertas de sensores ou bateria', critical: true },
    ],
  },
  {
    id: 'indoor',
    letter: 'E',
    title: 'Ambiente fechado',
    optional: true,
    note: 'RTH pode não funcionar como esperado indoor. Não desative sistemas de segurança automaticamente.',
    items: [
      { id: 'indoor-teto', label: 'Altura do teto medida' },
      { id: 'indoor-vigas', label: 'Vigas e luminárias mapeadas', critical: true },
      { id: 'indoor-pessoas', label: 'Pessoas fora da área ou cientes do voo', critical: true },
      { id: 'indoor-area', label: 'Área horizontal suficiente para a manobra' },
      { id: 'indoor-protetor', label: 'Protetores de hélice avaliados/instalados' },
      { id: 'indoor-contingencia', label: 'Contingência específica para modelo e ambiente', critical: true },
    ],
  },
]

export const postFlightItems = [
  { id: 'pos-pouso', label: 'Pouso concluído e motores desligados' },
  { id: 'pos-danos', label: 'Inspeção de danos e aquecimento' },
  { id: 'pos-bateria', label: 'Bateria armazenada conforme o fabricante' },
  { id: 'pos-arquivos', label: 'Arquivos copiados e verificados' },
  { id: 'pos-anomalias', label: 'Anomalias registradas' },
  { id: 'pos-limpeza', label: 'Limpeza e acondicionamento' },
]

export const verdicts = {
  go: {
    label: 'PRONTO PARA DECOLAGEM',
    description: 'Todos os itens conferidos. Mantenha a atenção — nenhuma checagem garante segurança absoluta.',
  },
  restricted: {
    label: 'PRONTO COM RESTRIÇÕES',
    description: 'Itens críticos ok, mas há pendências. Avalie a mitigação antes de decolar.',
  },
  stop: {
    label: 'NÃO DECOLAR',
    description: 'Há pendências críticas. Resolva-as antes de qualquer decolagem.',
  },
}

/* ------------------------------------------------------------------ */
/* Movimentos cinematográficos                                         */
/* ------------------------------------------------------------------ */

// Mini-animações em viewBox 160×100. `view`: 'top' (vista superior) ou 'side' (vista lateral).
// `subject`: posição do objeto filmado. `d`: trajetória do drone.
export const movimentos = [
  {
    name: 'Dronie',
    view: 'side',
    subject: { x: 40, y: 82 },
    d: 'M50 70 L 140 18',
    objetivo: 'Afastar e subir de costas, revelando o sujeito dentro do cenário.',
    inicio: 'Próximo ao sujeito, câmera enquadrando-o',
    altura: '3 → 40 m',
    velocidade: '2–3 m/s',
    gimbal: 'Inclinação acompanhando o sujeito',
    duracao: '8–12 s',
    riscos: 'Obstáculos atrás do drone, fora do campo da câmera',
    naoExecutar: 'Sem visibilidade da trajetória de ré ou com árvores/fios atrás',
  },
  {
    name: 'Rocket',
    view: 'side',
    subject: { x: 80, y: 82 },
    d: 'M80 70 L 80 10',
    objetivo: 'Subida vertical rápida sobre o sujeito, com câmera apontada para baixo.',
    inicio: 'Diretamente sobre o sujeito, baixa altura',
    altura: '5 → 60 m',
    velocidade: '3–5 m/s (subida)',
    gimbal: '−90°',
    duracao: '5–8 s',
    riscos: 'Aproximação de limites de altura e obstáculos acima',
    naoExecutar: 'Sob galhos, fios ou acima do limite autorizado',
  },
  {
    name: 'Orbit',
    view: 'top',
    subject: { x: 80, y: 50 },
    d: 'M80 14 A 36 36 0 0 1 80 86 A 36 36 0 0 1 80 14',
    objetivo: 'Circular o sujeito mantendo-o no centro do quadro.',
    inicio: 'A uma distância segura, sujeito centralizado',
    altura: '15–40 m',
    velocidade: '1–3 m/s',
    gimbal: '−15° a −35°, travado no sujeito',
    duracao: '10–20 s',
    riscos: 'Obstáculos na circunferência e perda de linha de visada',
    naoExecutar: 'Com pessoas ou obstáculos no raio da órbita',
  },
  {
    name: 'Circle',
    view: 'top',
    subject: { x: 80, y: 50 },
    d: 'M80 22 A 28 28 0 0 1 80 78 A 28 28 0 0 1 80 22',
    objetivo: 'Círculo completo e constante ao redor de um ponto de interesse.',
    inicio: 'Raio definido antes de iniciar',
    altura: '20–50 m',
    velocidade: '1–2 m/s',
    gimbal: '−20° a −40°',
    duracao: '15–30 s',
    riscos: 'Vento lateral alterando o raio',
    naoExecutar: 'Com rajadas que impeçam manter o raio',
  },
  {
    name: 'Ellipse',
    view: 'top',
    subject: { x: 80, y: 50 },
    d: 'M80 20 A 60 30 0 0 1 80 80 A 60 30 0 0 1 80 20',
    objetivo: 'Órbita alongada que valoriza sujeitos compridos.',
    inicio: 'Eixo maior alinhado ao sujeito',
    altura: '20–40 m',
    velocidade: '1–3 m/s',
    gimbal: '−20° a −35°',
    duracao: '15–25 s',
    riscos: 'Aproximação maior nos extremos do eixo menor',
    naoExecutar: 'Se o eixo menor passar perto de obstáculos',
  },
  {
    name: 'Reveal',
    view: 'side',
    subject: { x: 130, y: 82 },
    d: 'M20 60 L 110 60',
    obstacle: { x: 62, y: 46, w: 12, h: 44 },
    objetivo: 'Começar atrás de um elemento e revelar o cenário principal.',
    inicio: 'Câmera encoberta por um primeiro plano',
    altura: '5–30 m',
    velocidade: '1–2 m/s',
    gimbal: '0° a −15°',
    duracao: '6–10 s',
    riscos: 'Proximidade do elemento que encobre a câmera',
    naoExecutar: 'Sem distância segura do primeiro plano',
  },
  {
    name: 'Fly Through',
    view: 'side',
    subject: { x: 150, y: 82 },
    d: 'M10 56 L 150 56',
    gate: { x: 72, y: 40, w: 18, h: 50 },
    objetivo: 'Atravessar uma abertura criando sensação de imersão.',
    inicio: 'Alinhado ao centro da abertura',
    altura: 'Conforme a abertura',
    velocidade: '1–2 m/s',
    gimbal: '0°',
    duracao: '4–8 s',
    riscos: 'Colisão com bordas; sensores podem frear ou desviar',
    naoExecutar: 'Sem margem lateral ampla ou experiência em voo manual',
  },
  {
    name: 'Dolly In',
    view: 'side',
    subject: { x: 140, y: 82 },
    d: 'M20 50 L 110 50',
    objetivo: 'Aproximar em linha reta, aumentando a importância do sujeito.',
    inicio: 'Distante, sujeito pequeno no quadro',
    altura: '5–40 m (constante)',
    velocidade: '1–3 m/s',
    gimbal: '−5° a −20°',
    duracao: '6–10 s',
    riscos: 'Aproximação excessiva do sujeito',
    naoExecutar: 'Em direção a pessoas',
  },
  {
    name: 'Dolly Out',
    view: 'side',
    subject: { x: 20, y: 82 },
    d: 'M40 50 L 140 50',
    objetivo: 'Afastar em linha reta revelando o contexto ao redor.',
    inicio: 'Próximo ao sujeito',
    altura: '5–40 m (constante)',
    velocidade: '1–3 m/s',
    gimbal: '−5° a −20°',
    duracao: '6–10 s',
    riscos: 'Obstáculos atrás do drone',
    naoExecutar: 'Sem visibilidade da trajetória de ré',
  },
  {
    name: 'Tracking',
    view: 'top',
    subject: { x: 30, y: 56, moving: 'M30 56 L 140 56' },
    d: 'M10 56 L 120 56',
    objetivo: 'Seguir o sujeito por trás, na mesma direção.',
    inicio: 'Atrás do sujeito, distância constante',
    altura: '5–20 m',
    velocidade: 'Igual à do sujeito',
    gimbal: '−10° a −25°',
    duracao: '8–20 s',
    riscos: 'Mudança brusca de direção do sujeito',
    naoExecutar: 'Seguimento automático próximo a pessoas sem avaliação específica',
  },
  {
    name: 'Side Tracking',
    view: 'top',
    subject: { x: 20, y: 66, moving: 'M20 66 L 140 66' },
    d: 'M20 26 L 140 26',
    objetivo: 'Acompanhar o sujeito lateralmente, em paralelo.',
    inicio: 'Ao lado do sujeito, distância lateral segura',
    altura: '3–15 m',
    velocidade: 'Igual à do sujeito',
    gimbal: '0° a −15°, câmera de lado',
    duracao: '8–15 s',
    riscos: 'Obstáculos na faixa paralela',
    naoExecutar: 'Com obstáculos na lateral fora do campo dos sensores',
  },
  {
    name: 'Top Down',
    view: 'top',
    subject: { x: 80, y: 50 },
    d: 'M20 50 L 140 50',
    objetivo: 'Câmera a 90° revelando padrões e geometria.',
    inicio: 'Acima da área de interesse',
    altura: '30–60 m',
    velocidade: '0,5–2 m/s',
    gimbal: '−90°',
    duracao: '6–12 s',
    riscos: 'Perda de referência visual de obstáculos laterais',
    naoExecutar: 'Sobre pessoas fora das condições aplicáveis',
  },
  {
    name: 'Ascending Reveal',
    view: 'side',
    subject: { x: 130, y: 82 },
    d: 'M50 84 L 50 18',
    obstacle: { x: 64, y: 44, w: 14, h: 46 },
    objetivo: 'Subir por trás de um elemento e revelar o horizonte.',
    inicio: 'Baixo, atrás de árvore ou muro',
    altura: '2 → 40 m',
    velocidade: '1–2 m/s',
    gimbal: '−10° → 0°',
    duracao: '6–10 s',
    riscos: 'Galhos e fios acima',
    naoExecutar: 'Sem inspeção visual do espaço acima',
  },
  {
    name: 'Descending Reveal',
    view: 'side',
    subject: { x: 130, y: 82 },
    d: 'M50 14 L 50 74',
    objetivo: 'Descer revelando o sujeito abaixo da linha do horizonte.',
    inicio: 'Alto, horizonte enquadrado',
    altura: '40 → 5 m',
    velocidade: '1–2 m/s (descida)',
    gimbal: '0° → −15°',
    duracao: '6–10 s',
    riscos: 'Aproximação do solo e de obstáculos baixos',
    naoExecutar: 'Sem área de descida livre',
  },
  {
    name: 'FPV',
    view: 'top',
    subject: { x: 80, y: 50 },
    d: 'M10 80 C 40 10, 70 90, 100 30 S 150 40, 150 20',
    objetivo: 'Voo dinâmico e imersivo com curvas rápidas.',
    inicio: 'Rota inspecionada a pé antes do voo',
    altura: 'Variável',
    velocidade: 'Variável',
    gimbal: 'Câmera fixa / horizonte digital',
    duracao: '10–30 s',
    riscos: 'Alta velocidade e pouca margem de erro',
    naoExecutar: 'Sem treino específico, observador e área isolada',
  },
]

/* ------------------------------------------------------------------ */
/* Câmera e gimbal                                                     */
/* ------------------------------------------------------------------ */

export const fpsOptions = [24, 25, 30, 50, 60, 120]

export const cameraSettings = [
  { label: 'Resolução', value: '4K para margem de recorte; 1080p se o armazenamento for limitado.' },
  { label: 'ISO', value: 'O menor possível (ex.: 100) para reduzir ruído.' },
  { label: 'Balanço de branco', value: 'Fixo, nunca automático, para evitar variação entre takes.' },
  { label: 'Perfil de cor', value: 'Log/flat se for colorir; perfil normal para entrega rápida.' },
  { label: 'Filtros ND', value: 'Use para manter o shutter próximo da regra em luz forte.' },
  { label: 'Exposição', value: 'Acompanhe o histograma e proteja as altas luzes do céu.' },
  { label: 'Gimbal', value: 'Velocidade e suavização baixas para inclinações cinematográficas.' },
]

/* ------------------------------------------------------------------ */
/* Segurança                                                           */
/* ------------------------------------------------------------------ */

export const nuncaRecomendar = [
  'Aproximação de aeronaves tripuladas',
  'Voo em meteorologia incompatível',
  'Descumprimento de restrições do espaço aéreo',
  'Sobrevoo de pessoas fora das condições aplicáveis',
  'Ultrapassar limites autorizados',
  'Manobras sem visibilidade ou controle',
]

export const tiposDeOrientacao = [
  { tag: 'Estética', tone: 'sky', text: 'Recomendação de enquadramento e movimento. Ajuste ao gosto e ao objetivo.' },
  { tag: 'Regra legal', tone: 'stop', text: 'Exigência de DECEA/ANAC. Não é negociável e deve ser confirmada na fonte oficial.' },
  { tag: 'Limite do fabricante', tone: 'warn', text: 'Definido no manual do modelo: vento, temperatura, altitude e alcance.' },
  { tag: 'Avaliação operacional', tone: 'go', text: 'Seu julgamento no local: riscos, pessoas, obstáculos e plano de contingência.' },
]

export const fontesOficiais = [
  { label: 'SARPAS NG', description: 'Solicitação de acesso ao espaço aéreo', href: 'https://sarpas.decea.mil.br/' },
  { label: 'DECEA', description: 'Departamento de Controle do Espaço Aéreo', href: 'https://www.decea.mil.br/' },
  { label: 'ANAC', description: 'Agência Nacional de Aviação Civil', href: 'https://www.gov.br/anac/' },
]

export const analiseImagem = [
  'Descreve apenas o que é visível na foto',
  'Aponta obstáculos aparentes e pontos para inspeção presencial',
  'Sugere enquadramentos, trajetórias e posições inicial e final',
  'Não conclui ausência de fios ou riscos invisíveis',
  'Foto não é levantamento topográfico nem autorização de voo',
]
