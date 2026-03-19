// Calls the Claude API with a built prompt and returns the recap string.
// Uses streaming to avoid timeouts on longer deep-dive recaps.
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from './buildPrompt';
import type { BuildPromptParams } from './buildPrompt';
import { log, logError } from '../utils/logger';

const client = new Anthropic();

// Minimum acceptable response length — anything shorter is almost certainly a failure.
const MIN_RESPONSE_LENGTH = 50;

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
// Throws a descriptive error if the API call fails or the response is suspiciously short.
export async function generateRecap(params: BuildPromptParams): Promise<string> {
  const prompt = buildPrompt(params);

  log(`Generating ${params.detailLevel} ${params.format} recap via Claude...`);

  let text: string;
  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = await stream.finalMessage();

    const block = message.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      throw new Error('Claude returned no text content');
    }
    text = block.text;
  } catch (err) {
    logError('Claude API call failed', err instanceof Error ? err : new Error(String(err)));
    throw new Error(`Claude API failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (text.length < MIN_RESPONSE_LENGTH) {
    throw new Error('Claude returned suspiciously short response');
  }

  return params.format === 'text' ? stripMarkdown(text) : text;
}
