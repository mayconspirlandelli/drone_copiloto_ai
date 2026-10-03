import { useEffect, useRef, useState } from 'react'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

/** Ditado por voz (Web Speech API, pt-BR). `onFinal` recebe o texto reconhecido. */
export function useDitado(onFinal) {
  const [ouvindo, setOuvindo] = useState(false)
  const [parcial, setParcial] = useState('')
  const recRef = useRef(null)
  const onFinalRef = useRef(onFinal)
  useEffect(() => {
    onFinalRef.current = onFinal
  })

  useEffect(() => () => recRef.current?.abort(), [])

  function iniciar() {
    if (!Recognition || ouvindo) return
    const rec = new Recognition()
    rec.lang = 'pt-BR'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      let finalText = ''
      let interim = ''
      for (const r of e.results) {
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      setParcial(interim)
      if (finalText) onFinalRef.current(finalText.trim())
    }
    rec.onend = () => {
      setOuvindo(false)
      setParcial('')
    }
    rec.onerror = () => setOuvindo(false)
    recRef.current = rec
    rec.start()
    setOuvindo(true)
  }

  function parar() {
    recRef.current?.stop()
  }

  return { suportado: Boolean(Recognition), ouvindo, parcial, iniciar, parar }
}

/** Leitura em voz alta das respostas do copiloto. */
export function falar(texto) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const limpo = texto.replace(/[*_#`>|]/g, '').replace(/\s+/g, ' ')
  const fala = new SpeechSynthesisUtterance(limpo)
  fala.lang = 'pt-BR'
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('pt'))
  if (voz) fala.voice = voz
  window.speechSynthesis.speak(fala)
}

export function pararFala() {
  window.speechSynthesis?.cancel()
}

export const sinteseSuportada = typeof window !== 'undefined' && 'speechSynthesis' in window
