import { VIDEO_GENERATION } from '#shared/constants';

// Minimal fetch client for video generation with Google Gemini Omni Flash (Interactions API).
// Guide: https://aistudio.google.com/docs/omni
// Reference: https://aistudio.google.com/api-reference/interactions-api
//
// Flow: POST /interactions with `background: true` returns an interaction id right away
// (https://aistudio.google.com/docs/background-execution). The id is stored as the message jobId, and the
// video page polls GET /interactions/{id} until the interaction completes. Interactions are stored by Google
// (55 days on the paid tier), which is what lets a follow-up prompt edit the previous video through
// `previous_interaction_id`.

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiContent {
  type: string;
  text?: string;
  data?: string; // base64
  uri?: string;
  mime_type?: string;
}

export interface GeminiInteraction {
  id: string;
  // in_progress, completed, failed, cancelled, incomplete, requires_action or requires_continuation
  status: string;
  steps?: { type: string; content?: GeminiContent[] }[];
  errors?: { code?: string; message?: string }[];
}

interface GeminiFile {
  name: string;
  state?: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED';
  error?: { message?: string };
}

export class GeminiApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
    this.code = code;
  }
}

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

// Video generation is optional: without a key the endpoints answer 503 and the page shows the message as a toast.
export function requireGeminiApiKey() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Video generation isn't configured",
      message: 'Video generation is turned off. Set GEMINI_API_KEY to enable it.',
    });
  }

  return apiKey;
}

async function geminiFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${GEMINI_API_BASE}/${path}`, {
    ...init,
    headers: {
      'x-goog-api-key': apiKey,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (!response.ok) {
    // Errors come back as { "error": { "code": "invalid_request", "message": "..." } }: https://aistudio.google.com/docs/api-errors
    const body = (await response.json().catch(() => null)) as { error?: { code?: string | number; message?: string } } | null;
    const code = body?.error?.code === undefined ? undefined : String(body.error.code);
    throw new GeminiApiError(response.status, body?.error?.message || `Gemini API request failed (${response.status})`, code);
  }

  return response;
}

export async function startVideoInteraction(
  apiKey: string,
  options: {
    prompt: string;
    image?: { data: string; mimeType: string };
    previousInteractionId?: string | null;
  }
) {
  const input = options.image
    ? [
        { type: 'image', data: options.image.data, mime_type: options.image.mimeType },
        { type: 'text', text: options.prompt },
      ]
    : options.prompt;

  const response = await geminiFetch(apiKey, 'interactions', {
    method: 'POST',
    body: JSON.stringify({
      model: VIDEO_GENERATION.MODEL,
      input,
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
    }),
  });

  return (await response.json()) as GeminiInteraction;
}

export async function getInteraction(apiKey: string, id: string) {
  const response = await geminiFetch(apiKey, `interactions/${encodeURIComponent(id)}`);
  return (await response.json()) as GeminiInteraction;
}

export async function deleteInteraction(apiKey: string, id: string) {
  await geminiFetch(apiKey, `interactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

function modelOutputs(interaction: GeminiInteraction) {
  return (interaction.steps || []).filter((step) => step.type === 'model_output').flatMap((step) => step.content || []);
}

// The video is a `video` item in the model_output step: https://aistudio.google.com/docs/omni#rest-response-schema
export function findVideoOutput(interaction: GeminiInteraction) {
  return modelOutputs(interaction)
    .filter((content) => content.type === 'video' && (content.data || content.uri))
    .at(-1);
}

export function getInteractionError(interaction: GeminiInteraction) {
  const error = interaction.errors?.find((e) => e.message)?.message;
  // Without a video or an error, any text the model returned is the best explanation available
  const text = modelOutputs(interaction)
    .filter((content) => content.type === 'text' && content.text)
    .map((content) => content.text)
    .join(' ');

  return error || text || `Video generation ended with status "${interaction.status}"`;
}

// Returns the video bytes, or null while a URI-delivered file is still processing.
// GET /interactions/{id} currently returns the video inline as base64; the URI branch covers
// `delivery: "uri"` results: https://aistudio.google.com/docs/omni#retrieving-videos-with-an-uri
export async function downloadVideo(apiKey: string, video: GeminiContent) {
  if (video.data) {
    return Buffer.from(video.data, 'base64');
  }

  // Only follow Gemini Files API URIs, since the request carries the API key
  const fileName = video.uri?.match(/^(?:https:\/\/generativelanguage\.googleapis\.com\/v1beta\/)?(files\/[\w-]+)/)?.[1];

  if (!fileName) {
    throw new GeminiApiError(502, `Unexpected video URI: ${video.uri}`);
  }

  const file = (await (await geminiFetch(apiKey, fileName)).json()) as GeminiFile;

  if (file.state === 'PROCESSING') {
    return null;
  }

  if (file.state === 'FAILED') {
    throw new GeminiApiError(502, file.error?.message || 'Video file processing failed');
  }

  const media = await geminiFetch(apiKey, `${fileName}:download?alt=media`);
  return new Uint8Array(await media.arrayBuffer());
}

// Pass on errors the user can act on (bad input, blocked prompts, rate limits); log and hide the rest
export function toVideoHttpError(error: unknown) {
  if (error instanceof GeminiApiError && (error.status === 400 || error.status === 429)) {
    return createError({ statusCode: error.status, statusMessage: 'Video generation failed', message: error.message });
  }

  if (isError(error)) {
    return error;
  }

  return createError({ statusCode: 502, statusMessage: 'Video generation failed', message: 'The video provider returned an error. Please try again.' });
}
