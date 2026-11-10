// Lets the video pages show a notice instead of failing when GEMINI_API_KEY isn't set
export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  return { configured: Boolean(getGeminiApiKey()) };
});
