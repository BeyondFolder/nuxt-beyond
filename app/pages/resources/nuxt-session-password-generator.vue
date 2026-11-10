<script setup lang="ts">
import { GITHUB_REPO_URL } from '#shared/constants';

definePageMeta({
  layout: 'default',
});

const route = useRoute();

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('resources').path(route.path).first()
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

useSeoMeta({
  titleTemplate: '',
  title: page.value.seo.title,
  ogTitle: page.value.seo.ogTitle || page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.ogDescription || page.value.seo.description,
});

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': (page.value.faqs ?? []).map((faq: { label: string; content: string }) => ({
          '@type': 'Question',
          'name': faq.label,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.content,
          },
        })),
      }),
    },
  ],
});

const secretTypes = {
  NUXT_SESSION_PASSWORD: {
    hint: '32 random bytes as hex (64 characters), for nuxt-auth-utils',
    encode: toHex,
  },
  NUXT_APP_SECRET: {
    hint: '32 random bytes as base64, same as openssl rand -base64 32, for Nuxt 4.6+',
    encode: toBase64,
  },
};

type SecretName = keyof typeof secretTypes;

const tabs = (Object.keys(secretTypes) as SecretName[]).map(name => ({ label: name, value: name }));

const useSessionExample = `import { defineEventHandler, useSession } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const session = await useSession<{ visits: number }>(event)
  await session.update(data => ({ visits: (data.visits ?? 0) + 1 }))
  return { visits: session.data.visits }
})`;

const selected = ref<SecretName>('NUXT_SESSION_PASSWORD');
const secrets = reactive<Record<SecretName, string>>({ NUXT_SESSION_PASSWORD: '', NUXT_APP_SECRET: '' });
const toast = useToast();

function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function generateSecret() {
  secrets[selected.value] = secretTypes[selected.value].encode(randomBytes(32));
}

function selectSecret(name: string | number) {
  selected.value = name as SecretName;
  if (!secrets[selected.value]) {
    generateSecret();
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(secrets[selected.value]);
    toast.add({
      title: 'Copied!',
      description: `${selected.value} copied to clipboard`,
      color: 'success',
    });
  } catch {
    toast.add({
      title: 'Failed to copy',
      description: 'Please copy manually',
      color: 'error',
    });
  }
}

onMounted(generateSecret);
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {{ page!.title }}
          </h1>
          <p class="text-lg text-neutral-600 dark:text-neutral-400">
            {{ page!.description }}
          </p>
        </div>

        <UCard>
          <div class="space-y-6">
            <UTabs
              :model-value="selected"
              :items="tabs"
              :unmount-on-hide="false"
              class="w-full"
              @update:model-value="selectSecret"
            >
              <template #content="{ item }">
                <div class="space-y-6 pt-4">
                  <div>
                    <label
                      :for="item.value"
                      class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                    >
                      Your {{ item.value }}
                    </label>
                    <p
                      :id="`${item.value}-hint`"
                      class="text-xs text-neutral-500 dark:text-neutral-400 mb-2"
                    >
                      {{ secretTypes[item.value].hint }}. Generated in your browser, never sent to a server.
                    </p>
                    <UTextarea
                      :id="item.value"
                      :aria-describedby="`${item.value}-hint`"
                      :model-value="secrets[item.value]"
                      readonly
                      :rows="3"
                      :ui="{ base: 'font-mono' }"
                      class="w-full"
                    />
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
                      @click="generateSecret"
                    >
                      Regenerate
                    </UButton>
                  </div>

                  <div class="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      How to use {{ item.value }}
                    </h2>

                    <div class="space-y-3">
                      <div>
                        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          1. Add to your .env file
                        </h3>
                        <pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto"><code class="text-sm">{{ item.value }}={{ secrets[item.value] }}</code></pre>
                      </div>

                      <div v-if="item.value === 'NUXT_SESSION_PASSWORD'">
                        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          2. Configure in nuxt.config.ts
                        </h3>
                        <pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto"><code class="text-sm">export default defineNuxtConfig({
  runtimeConfig: {
    session: {
      password: '' // overridden by NUXT_SESSION_PASSWORD
    }
  }
})</code></pre>
                      </div>

                      <div v-else class="space-y-2">
                        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          2. Use the Nuxt 4.6 useSession from nuxt/server
                        </h3>
                        <pre class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg overflow-x-auto"><code class="text-sm">{{ useSessionExample }}</code></pre>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                          Runtime config keys starting with <code>app</code>, including <code>runtimeConfig.appSecret</code>, are reserved for Nuxt, so keep your own config under other names.
                          Built-in <code>useSession</code> covers simple sealed-cookie sessions, while nuxt-auth-utils adds OAuth, passkeys and user session helpers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UTabs>

            <div class="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Which one do I need?
              </h2>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                On nuxt-auth-utils v0.5.x (latest is v0.5.31), set <code>NUXT_SESSION_PASSWORD</code>.
                On Nuxt 4.6+, set <code>NUXT_APP_SECRET</code> in production if a module or server feature uses it, such as <code>useSession</code> from <code>nuxt/server</code>: dev generates one for you, but builds never do.
                Heads-up: an open nuxt-auth-utils pull request,
                <ULink
                  to="https://github.com/atinux/nuxt-auth-utils/pull/546"
                  target="_blank"
                  class="text-primary-600 dark:text-primary-400 hover:underline"
                >#546</ULink>, proposes moving to <code>appSecret</code> for v0.6, which would ignore <code>NUXT_SESSION_PASSWORD</code> and log every user out once (checked October 10, 2026).
              </p>
            </div>

            <div class="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Frequently asked questions
              </h2>
              <UAccordion :items="page!.faqs" :unmount-on-hide="false" />
            </div>

            <div class="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Learn more
              </h2>
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
                    to="https://nuxt.com/blog/v4-6"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Nuxt 4.6 release post: appSecret and useSession
                  </ULink>
                </li>
                <li>
                  <ULink
                    to="https://github.com/atinux/nuxt-auth-utils/pull/546"
                    target="_blank"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    nuxt-auth-utils PR #546: proposed move to appSecret for v0.6
                  </ULink>
                </li>
                <li>
                  <ULink
                    to="/blog/multi-tenant-saas-cloudflare-workers-nuxt-4"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Deploying Nuxt 4 on Cloudflare Workers with env vars and secrets
                  </ULink>
                </li>
                <li>
                  <ULink
                    to="/"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Get NuxtBeyond, the complete Nuxt 4 boilerplate with auth
                  </ULink>
                </li>
              </ul>
            </div>
          </div>
        </UCard>

        <div class="text-center mt-8 space-y-2">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Nuxt Beyond ships auth (nuxt-auth-utils), Stripe and Cloudflare deploy wired up, free and open source
            <ULink :to="GITHUB_REPO_URL" target="_blank" class="text-primary-600 dark:text-primary-400 hover:underline">on GitHub</ULink>.
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Free tool by <ULink to="/" class="text-primary-600 dark:text-primary-400 hover:underline">NuxtBeyond</ULink>
          </p>
        </div>
      </div>
    </UContainer>
  </div>
</template>
