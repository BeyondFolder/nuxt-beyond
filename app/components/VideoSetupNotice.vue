<template>
  <UAlert
    color="neutral"
    variant="soft"
    icon="i-lucide-info"
    title="Video generation isn't configured"
  >
    <template #description>
      This deployment runs without a Google Gemini API key, so video generation is turned off.
      To enable it on your own deployment, set <code>GEMINI_API_KEY</code> (see <code>.env.example</code>).
    </template>
  </UAlert>
</template>
