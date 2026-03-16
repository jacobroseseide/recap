// Calls the Claude API with a built prompt and returns the recap string.
// Uses streaming to avoid timeouts on longer deep-dive recaps.
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from './buildPrompt';
import type { BuildPromptParams, RecapFormat } from './buildPrompt';

const client = new Anthropic();

// Strips markdown formatting from text variants as a safety net.
// Audio variants are left untouched (they never contain markdown).
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')       // # headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // *italic* and **bold**
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')   // _italic_ and __bold__
    .replace(/^[\s]*[-*+]\s+/gm, '')    // bullet points
    .replace(/^\d+\.\s+/gm, '')         // numbered lists
    .trim();
}

// Generates a recap by sending the prompt to Claude and returning the full text response.
// Streams internally so long outputs don't hit request timeouts.
export async function generateRecap(params: BuildPromptParams): Promise<string> {
  const prompt = buildPrompt(params);

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const message = await stream.finalMessage();

  for (const block of message.content) {
    if (block.type === 'text') {
      return params.format === 'text' ? stripMarkdown(block.text) : block.text;
    }
  }

  throw new Error('Claude returned no text content');
}
