import { GoogleGenAI } from '@google/genai/web';
import { VIDEO_GENERATION } from '#shared/constants';

// Video generation with Google Gemini Omni Flash, through the official SDK and the Interactions API.
// Guide: https://aistudio.google.com/docs/omni
//
// Flow: interactions.create with `background: true` returns an interaction id right away
// (https://aistudio.google.com/docs/background-execution). The id is stored as the message jobId, and the
// video page polls interactions.get until the interaction completes. Interactions are stored by Google
// (55 days on the paid tier), which is what lets a follow-up prompt edit the previous video through
// `previous_interaction_id`.
//
// The `/web` build of the SDK only uses fetch, so it runs on Cloudflare Workers without the Node auth libraries.

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  // Omni is only served on v1beta; the SDK defaults to v1, which answers "model not found"
  return apiKey ? new GoogleGenAI({ apiKey, apiVersion: 'v1beta' }) : null;
}

// Video generation is optional: without a key the endpoints answer 503 and the page shows the message as a toast.
export function requireGeminiClient() {
  const ai = getGeminiClient();

  if (!ai) {
    throw createError({
      statusCode: 503,
      statusMessage: "Video generation isn't configured",
      message: 'Video generation is turned off. Set GEMINI_API_KEY to enable it.',
    });
  }

  return ai;
}

export function startVideoInteraction(
  ai: GoogleGenAI,
  options: {
    prompt: string;
    image?: { data: string; mimeType: string };
    previousInteractionId?: string | null;
  }
) {
  return ai.interactions.create({
    model: VIDEO_GENERATION.MODEL,
    input: options.image
      ? [
          { type: 'image', data: options.image.data, mime_type: options.image.mimeType },
          { type: 'text', text: options.prompt },
        ]
      : options.prompt,
    // Edit the previous video: https://aistudio.google.com/docs/omni#stateful-video-editing
    ...(options.previousInteractionId ? { previous_interaction_id: options.previousInteractionId } : {}),
    // Settings apply to one interaction only, so every turn sends them again
    response_format: {
      type: 'video',
      aspect_ratio: VIDEO_GENERATION.ASPECT_RATIO,
      resolution: VIDEO_GENERATION.RESOLUTION,
      duration: `${VIDEO_GENERATION.DURATION_SECONDS}s`,
    },
    // Return right away instead of holding the request open for the whole generation.
    // Requires `store` (on by default), which edits need anyway.
    background: true,
  });
}

export function getInteractionError(interaction: { status: string; errors?: { message?: string }[]; output_text?: string }) {
  const error = interaction.errors?.find((e) => e.message)?.message;
  // Without a video or an error, any text the model returned is the best explanation available
  return error || interaction.output_text || `Video generation ended with status "${interaction.status}"`;
}

// SDK errors carry the HTTP status, and the API's own message in `error.error.message`
function readGeminiError(error: unknown) {
  if (!error || typeof error !== 'object' || typeof (error as { status?: unknown }).status !== 'number') {
    return null;
  }

  const { status, message, error: body } = error as { status: number; message?: string; error?: { error?: { message?: string } } };
  return { status, message: body?.error?.message || message || `Gemini API request failed (${status})` };
}

export function getGeminiErrorStatus(error: unknown) {
  return readGeminiError(error)?.status;
}

// Pass on errors the user can act on (bad input, blocked prompts, rate limits); log and hide the rest
export function toVideoHttpError(error: unknown) {
  if (isError(error)) {
    return error;
  }

  const geminiError = readGeminiError(error);

  if (geminiError && (geminiError.status === 400 || geminiError.status === 429)) {
    return createError({ statusCode: geminiError.status, statusMessage: 'Video generation failed', message: geminiError.message });
  }

  return createError({ statusCode: 502, statusMessage: 'Video generation failed', message: 'The video provider returned an error. Please try again.' });
}
