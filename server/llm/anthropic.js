import Anthropic from '@anthropic-ai/sdk'

// Adaptador Anthropic Claude (SDK oficial @anthropic-ai/sdk).
// Histórico nativo: MessageParam[] — o conteúdo do assistente volta inteiro
// (inclui blocos de raciocínio), e o histórico só cresce.
export function createAnthropic({ apiKey, model }) {
  const client = new Anthropic({ apiKey })

  return {
    model,

    userMessage({ text, images }) {
      return {
        role: 'user',
        content: [
          ...images.map((img) => ({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.data } })),
          { type: 'text', text },
        ],
      }
    },

    async call({ system, tools, history, maxTokens }) {
      const response = await client.beta.messages.create({
        model,
        max_tokens: maxTokens,
        // Em recusa do modelo principal, a API refaz a chamada num modelo de fallback.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        cache_control: { type: 'ephemeral' },
        system,
        tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters, strict: true })),
        tool_choice: { type: 'auto' },
        messages: history,
      })

      const message = { role: 'assistant', content: response.content }
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      const toolCalls = response.content.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, args: b.input }))
      const stop = response.stop_reason === 'refusal' ? 'refusal' : response.stop_reason === 'max_tokens' ? 'max_tokens' : 'end'
      return { messages: [message], text, toolCalls, stop }
    },

    toolResults(results) {
      return [{ role: 'user', content: results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: r.content })) }]
    },

    normalizeError(err) {
      if (err instanceof Anthropic.APIConnectionError) return { status: 503, message: 'Sem conexão com a API.' }
      if (err instanceof Anthropic.APIError) return { status: err.status ?? 502, message: err.message }
      return null
    },
  }
}
