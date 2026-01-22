<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useSeoMeta({
  title: 'Nuxt Session Password Generator | Free Tool | NuxtBeyond',
  description: 'Generate secure NUXT_SESSION_PASSWORD values for nuxt-auth-utils. Free online tool for Nuxt.js developers.',
});

const password = ref('');
const toast = useToast();

function generatePassword() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  password.value = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(password.value);
    toast.add({
      title: 'Copied!',
      description: 'Password copied to clipboard',
      color: 'success',
    });
  } catch (error) {
    toast.add({
      title: 'Failed to copy',
      description: 'Please copy manually',
      color: 'error',
    });
  }
}

onMounted(() => {
  generatePassword();
});
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Nuxt Session Password Generator
          </h1>
          <p class="text-lg text-neutral-600 dark:text-neutral-400">
            Generate secure <code class="text-primary-600 dark:text-primary-400">NUXT_SESSION_PASSWORD</code> values for nuxt-auth-utils
          </p>
        </div>

        <UCard>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Generated Password
              </label>
              <div class="flex gap-2">
                <UTextarea
                  v-model="password"
                  readonly
                  :rows="3"
                  class="font-mono text-sm flex-1"
                />
              </div>
            </div>

            <div class="flex gap-3">
              <UButton
                color="primary"
                icon="i-lucide-copy"
                @click="copyToClipboard"
              >
                Copy to Clipboard
              </UButton>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-refresh-cw"
                @click="generatePassword"
              >
                Regenerate
              </UButton>
            </div>

            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-info"
              title="What is NUXT_SESSION_PASSWORD?"
              description="This is a required environment variable for nuxt-auth-utils to encrypt and sign session cookies. It should be a long, random string."
            />

            <div class="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                How to use
              </h3>

              <div class="space-y-3">
                <div>
                  <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    1. Add to your .env file
                  </h4>
                  <pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto"><code class="text-sm">NUXT_SESSION_PASSWORD={{ password }}</code></pre>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    2. Configure in nuxt.config.ts
                  </h4>
                  <pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto"><code class="text-sm">export default defineNuxtConfig({
  runtimeConfig: {
    session: {
      password: '' // overridden by NUXT_SESSION_PASSWORD
    }
  }
})</code></pre>
                </div>
              </div>
            </div>

            <div class="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Learn More
              </h3>
              <ul class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>
                  <ULink
                    to="https://github.com/atinux/nuxt-auth-utils"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    nuxt-auth-utils documentation
                  </ULink>
                </li>
                <li>
                  <ULink
                    to="/"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Get NuxtBeyond - Complete Nuxt 4 Boilerplate with Auth
                  </ULink>
                </li>
              </ul>
            </div>
          </div>
        </UCard>

        <div class="text-center mt-8">
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Free tool by <ULink to="/" class="text-primary-600 dark:text-primary-400 hover:underline">NuxtBeyond</ULink>
          </p>
        </div>
      </div>
    </UContainer>
  </div>
</template>
