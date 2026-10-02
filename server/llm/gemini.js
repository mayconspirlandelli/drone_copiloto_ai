import { ApiError, GoogleGenAI } from '@google/genai'

// Adaptador Google Gemini (SDK oficial @google/genai).
// Histórico nativo: [{ role: 'user' | 'model', parts: [...] }].
export function createGemini({ apiKey, model }) {
  const ai = new GoogleGenAI({ apiKey })

  return {
    model,

    userMessage({ text, images }) {
      return {
        role: 'user',
        parts: [...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })), { text }],
      }
    },

    async call({ system, tools, history, maxTokens }) {
      const response = await ai.models.generateContent({
        model,
        contents: history,
        config: {
          systemInstruction: system,
          tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })) }],
          maxOutputTokens: maxTokens,
        },
      })

      const candidate = response.candidates?.[0]
      if (!candidate?.content) return { messages: [], text: '', toolCalls: [], stop: 'refusal' }

      // O conteúdo do modelo volta inteiro (inclui as assinaturas de raciocínio do Gemini 2.5+).
      const message = { role: 'model', parts: candidate.content.parts ?? [] }
      const text = message.parts
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join('')
        .trim()
      const toolCalls = (response.functionCalls ?? []).map((c) => ({ id: c.id, name: c.name, args: c.args ?? {} }))
      const stop = candidate.finishReason === 'MAX_TOKENS' ? 'max_tokens' : candidate.finishReason === 'SAFETY' ? 'refusal' : 'end'
      return { messages: [message], text, toolCalls, stop }
    },

    toolResults(results) {
      return [
        {
          role: 'user',
          parts: results.map((r) => ({ functionResponse: { id: r.id, name: r.name, response: { result: r.content } } })),
        },
      ]
    },

    normalizeError(err) {
      if (!(err instanceof ApiError)) return null
      if (err.status === 400 && /API key not valid/i.test(err.message)) return { status: 401, message: 'Chave inválida.' }
      return { status: err.status, message: err.message }
    },
  }
}
