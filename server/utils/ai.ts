export function sanitizeCustomPrompt(customPrompt: string): string {
  const dangerousPatterns = [
    /ignore (previous|all|above).*/gi,
    /forget (everything|all|instructions)/gi,
    /new (instructions|role|system)/gi,
    /you are now/gi,
    /act as/gi,
    /pretend to be/gi,
    /bypass/gi,
    /override/gi,
    /disregard/gi,
    /\bsystem\s*:/gi,
    /\bassistant\s*:/gi,
  ];

  let sanitized = customPrompt;
  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[REMOVED]');
  });

  const maxLength = 500;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

export function validateUserMessage(message: string): boolean {
  const suspiciousPatterns = [
    'reveal system prompt',
    'show instructions',
    'what are your instructions',
    'repeat everything above',
    'print previous text',
  ];

  const lowerMessage = message.toLowerCase();
  return !suspiciousPatterns.some((pattern) => lowerMessage.includes(pattern));
}

export function sanitizeAIResponse(response: string): string {
  const systemPromptMarkers = ['CORE INSTRUCTIONS', 'IMMUTABLE', 'ADDITIONAL BUSINESS CONTEXT'];

  let cleaned = response;
  systemPromptMarkers.forEach((marker) => {
    const index = cleaned.indexOf(marker);
    if (index !== -1) {
      cleaned = 'I can only help with customer support questions. How can I assist you today?';
    }
  });

  return cleaned;
}
