// AutoRAG Limits: https://developers.cloudflare.com/autorag/platform/limits-pricing/#limits
// - max file size is 4MB
// - max files per AutoRAG is 100,000 (should not hit this only in the future if we have a lot of customers)
// - max vectors per index is 5,000,000, need to check this periodically: https://developers.cloudflare.com/vectorize/platform/limits/

export interface PlanConfig {
  MAX_TEXT_LENGTH: number;
  MAX_FILE_SIZE: number;
  MAX_NB_OF_FILES: number;
  MAX_NB_OF_AI_REPLIES: number;
  SUPPORT_ESCALATION: boolean;
  SELF_LEARNING: boolean;
  WEBSITE_CRAWLING: boolean;
}

export const planNames = ['free', 'pro', 'advanced',] as const;
export type PlanName = typeof planNames[number];

export const PLANS_CONSTANTS: Record<PlanName, PlanConfig> = {
  free: {
    MAX_TEXT_LENGTH: 20000,
    MAX_FILE_SIZE: 0.1 * 1024 * 1024, // 0.1MB in bytes
    MAX_NB_OF_FILES: 5,
    MAX_NB_OF_AI_REPLIES: 200,
    SUPPORT_ESCALATION: false,
    SELF_LEARNING: false,
    WEBSITE_CRAWLING: false,
  },
  pro: {
    MAX_TEXT_LENGTH: 100000,
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB in bytes
    MAX_NB_OF_FILES: 50,
    MAX_NB_OF_AI_REPLIES: 5000,
    SUPPORT_ESCALATION: true,
    SELF_LEARNING: true,
    WEBSITE_CRAWLING: false,
  },
  advanced: {
    MAX_TEXT_LENGTH: 200000,
    MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB in bytes (AutoRAG limit)
    MAX_NB_OF_FILES: 100,
    MAX_NB_OF_AI_REPLIES: 10000,
    SUPPORT_ESCALATION: true,
    SELF_LEARNING: true,
    WEBSITE_CRAWLING: true,
  },
};

export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
];

export const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_LOGO_SIZE = 0.5 * 1024 * 1024; // 0.5MB in bytes

export const THEME_PRIMARY_COLOR = '#0d9488';

// Video generation with Google Gemini Omni Flash (Interactions API): https://aistudio.google.com/docs/omni
// Paid tier only. At 720p it costs about $0.07 per second of video, so about $0.56 for an 8s clip;
// 1080p and 4k are upscaled and cost more: https://aistudio.google.com/docs/pricing#gemini-omni-1.2-flash
export const VIDEO_GENERATION = {
  MODEL: 'gemini-omni-1.2-flash',
  ASPECT_RATIO: '16:9', // '16:9' or '9:16'
  RESOLUTION: '720p', // '360p', '720p', '1080p' or '4k'
  DURATION_SECONDS: 8, // whole seconds, 3 to 15
  MAX_REFERENCE_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB, checked before base64 encoding
  REFERENCE_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'],
} as const;
