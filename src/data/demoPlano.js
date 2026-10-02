// Resultado de exemplo no mesmo formato da ferramenta `gerar_planta_e_cenas` do agente.
// Usado pelo botão "Ver exemplo" da página de criação de plano de voo.

const r = (tipo, rotulo, x, y, largura, altura, h = null) => ({
  tipo, rotulo, forma: 'retangulo', x, y, largura, altura, raio: 0, pontos: [], altura_estimada_m: h,
})
const c = (tipo, rotulo, x, y, raio, h = null) => ({
  tipo, rotulo, forma: 'circulo', x, y, largura: 0, altura: 0, raio, pontos: [], altura_estimada_m: h,
})
const l = (tipo, rotulo, pontos, largura = 0) => ({
  tipo, rotulo, forma: 'linha', x: 0, y: 0, largura, altura: 0, raio: 0, pontos, altura_estimada_m: null,
})

export const demoPlano = {
  resumo: {
    titulo: 'Chácara — vídeo institucional',
    tipo_voo: 'Vídeo do imóvel para divulgação',
    local: 'Chácara com casa, piscina e pomar, rua de terra ao sul',
    periodo: 'tarde',
  },
  planta: {
    largura_m: 120,
    profundidade_m: 80,
    elementos: [
      l('via', 'Rua de terra', [{ x: 0, y: 74 }, { x: 120, y: 74 }], 7),
      l('fio_eletrico', 'Rede elétrica', [{ x: 0, y: 69 }, { x: 120, y: 69 }]),
      c('poste', 'Poste', 30, 69, 0.8, 9),
      c('poste', 'Poste', 90, 69, 0.8, 9),
      l('muro', 'Muro', [{ x: 2, y: 64 }, { x: 2, y: 2 }, { x: 118, y: 2 }, { x: 118, y: 64 }]),
      r('edificacao', 'Casa', 48, 22, 22, 14, 7),
      r('edificacao', 'Garagem', 74, 26, 9, 8, 3.5),
      r('agua', 'Piscina', 52, 42, 12, 6),
      r('vegetacao', 'Pomar', 8, 8, 28, 22),
      c('arvore', 'Mangueira', 96, 14, 5, 12),
      c('arvore', 'Ipê', 104, 46, 4, 10),
      c('arvore', 'Árvore', 20, 48, 3.5, 8),
      r('pessoas', 'Área de convivência', 86, 40, 12, 10),
      c('decolagem', 'Decolagem', 30, 55, 3),
    ],
    observacoes: [
      'Medidas estimadas a partir do desenho; confirme no local.',
      'Verifique presencialmente a altura da rede elétrica na rua.',
      'Mantenha a área de convivência sem sobrevoo durante a captura.',
    ],
  },
  cenas: [
    {
      nome: 'Abertura pelo pomar',
      movimento: 'Ascending Reveal',
      objetivo: 'Subir por trás do pomar revelando a casa e a piscina.',
      altura: '3 → 35 m',
      velocidade: '1,5 m/s',
      gimbal: '−5° → −20°',
      duracao_s: 10,
      camera: 'subject',
      alvo: { x: 59, y: 32 },
      trajetoria: [{ x: 22, y: 30 }, { x: 26, y: 27 }, { x: 31, y: 25 }],
      riscos: 'Galhos altos do pomar — iniciar acima das copas se houver dúvida.',
    },
    {
      nome: 'Órbita da casa',
      movimento: 'Orbit',
      objetivo: 'Mostrar a casa em 360° com a piscina em primeiro plano.',
      altura: '25 m',
      velocidade: '2 m/s',
      gimbal: '−25°',
      duracao_s: 16,
      camera: 'subject',
      alvo: { x: 59, y: 32 },
      trajetoria: [
        { x: 59, y: 6 }, { x: 80, y: 13 }, { x: 86, y: 32 }, { x: 80, y: 51 },
        { x: 59, y: 58 }, { x: 38, y: 51 }, { x: 32, y: 32 }, { x: 38, y: 13 }, { x: 59, y: 6 },
      ],
      riscos: 'Mangueira a nordeste e área de convivência a sudeste — manter raio de 26 m.',
    },
    {
      nome: 'Encerramento',
      movimento: 'Dronie',
      objetivo: 'Afastar e subir de costas mostrando a chácara inteira.',
      altura: '20 → 60 m',
      velocidade: '3 m/s',
      gimbal: '−30°',
      duracao_s: 10,
      camera: 'back',
      alvo: { x: 59, y: 32 },
      trajetoria: [{ x: 59, y: 20 }, { x: 52, y: 13 }, { x: 40, y: 6 }],
      riscos: 'Trajetória de ré: confirme espaço livre atrás antes de iniciar.',
    },
  ],
}
