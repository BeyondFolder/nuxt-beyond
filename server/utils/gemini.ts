import { GoogleGenAI } from '@google/genai/web';
import { VIDEO_GENERATION } from '#shared/constants';

const RUNNING_INTERACTION_STATUSES = ['in_progress', 'queued'];

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
}

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
    ...(options.previousInteractionId ? { previous_interaction_id: options.previousInteractionId } : {}),
    response_format: {
      type: 'video',
      aspect_ratio: VIDEO_GENERATION.ASPECT_RATIO,
      resolution: VIDEO_GENERATION.RESOLUTION,
      duration: `${VIDEO_GENERATION.DURATION_SECONDS}s`,
    },
    background: true,
  });
}

export function isInteractionRunning(status: string) {
  return RUNNING_INTERACTION_STATUSES.includes(status);
}

export function getInteractionError(interaction: { status: string; errors?: { message?: string }[]; output_text?: string }) {
  const error = interaction.errors?.find((e) => e.message)?.message;

  return error || interaction.output_text || `Video generation ended with status "${interaction.status}"`;
}

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

export function toVideoHttpError(error: unknown) {
  if (isError(error)) {
    return error;
  }

  const geminiError = readGeminiError(error);

  if (geminiError && (geminiError.status === 400 || geminiError.status === 429)) {
    return createError({ statusCode: geminiError.status, statusMessage: 'Video generation failed', message: geminiError.message });
  }

  if (geminiError && (geminiError.status === 401 || geminiError.status === 403)) {
    return createError({
      statusCode: 503,
      statusMessage: 'Video generation failed',
      message: 'The Gemini API key was rejected. Check GEMINI_API_KEY (Omni needs a paid-tier key).',
    });
  }

  return createError({ statusCode: 502, statusMessage: 'Video generation failed', message: 'The video provider returned an error. Please try again.' });
}
