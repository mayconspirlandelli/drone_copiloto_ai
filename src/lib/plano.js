// Utilitários da página de criação de plano de voo.

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos da trajetória. */
export function smoothPath(points) {
  if (!points?.length) return ''
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}`

  let d = `M${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`
  }
  return d
}

/** Cone de visão da câmera; no modo "down" vira a pegada quadrada no solo. */
export function fovPath(x, y, angleDeg, mode, r) {
  if (mode === 'down') {
    const s = r * 0.32
    return `M${x - s} ${y - s} H${x + s} V${y + s} H${x - s} Z`
  }
  const a = (angleDeg * Math.PI) / 180
  const spread = (30 * Math.PI) / 180
  const p1 = [x + Math.cos(a - spread) * r, y + Math.sin(a - spread) * r]
  const p2 = [x + Math.cos(a + spread) * r, y + Math.sin(a + spread) * r]
  return `M${x} ${y} L${p1[0]} ${p1[1]} A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]} Z`
}

/** Reduz uma imagem (foto ou desenho) para JPEG/PNG leve antes de enviar à API. */
export function fileToImageBlock(file, maxSide = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvasToImageBlock(canvas, 'image/jpeg'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}

/** Imagem em formato neutro ({ mimeType, data base64 }); o servidor converte para cada provedor. */
export function canvasToImageBlock(canvas, mimeType = 'image/png') {
  const dataUrl = canvas.toDataURL(mimeType, 0.85)
  return { mimeType, data: dataUrl.split(',')[1] }
}

export function imagePartToDataUrl(img) {
  return `data:${img.mimeType};base64,${img.data}`
}

export const periodoLabel = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }
