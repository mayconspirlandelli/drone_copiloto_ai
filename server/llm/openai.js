import OpenAI from 'openai'

// Adaptador OpenAI Chat Completions (SDK oficial `openai`).
// Também atende o Ollama, que expõe a mesma API em http://localhost:11434/v1.
// Histórico nativo: mensagens do Chat Completions (user / assistant / tool).
export function createOpenAI({ apiKey, model, baseURL, local = false }) {
  const client = new OpenAI({ apiKey, baseURL })

  return {
    model,

    userMessage({ text, images }) {
      return {
        role: 'user',
        content: [
          ...images.map((img) => ({ type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.data}` } })),
          { type: 'text', text },
        ],
      }
    },

    async call({ system, tools, history, maxTokens }) {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: system }, ...history],
        tools: tools.map((t) => ({
          type: 'function',
          // strict garante JSON válido no schema na OpenAI; o Ollama não suporta o campo.
          function: { name: t.name, description: t.description, parameters: t.parameters, ...(local ? {} : { strict: true }) },
        })),
        ...(local ? { max_tokens: maxTokens } : { max_completion_tokens: maxTokens }),
      })

      const choice = response.choices[0]
      const message = choice.message
      const toolCalls = (message.tool_calls ?? [])
        .filter((c) => c.type === 'function')
        .map((c) => {
          let args = {}
          try {
            args = JSON.parse(c.function.arguments || '{}')
          } catch {
            // modelos locais às vezes geram JSON inválido; a chamada segue sem argumentos
          }
          return { id: c.id, name: c.function.name, args }
        })

      const stop = message.refusal ? 'refusal' : choice.finish_reason === 'length' ? 'max_tokens' : 'end'
      return { messages: [message], text: (message.content ?? '').trim(), toolCalls, stop }
    },

    toolResults(results) {
      return results.map((r) => ({ role: 'tool', tool_call_id: r.id, content: r.content }))
    },

    normalizeError(err) {
      if (err instanceof OpenAI.APIConnectionError) {
        return { status: 503, message: local ? 'Ollama não está rodando (OLLAMA_BASE_URL).' : 'Sem conexão com a API.' }
      }
      if (err instanceof OpenAI.APIError) return { status: err.status ?? 502, message: err.message }
      return null
    },
  }
}
