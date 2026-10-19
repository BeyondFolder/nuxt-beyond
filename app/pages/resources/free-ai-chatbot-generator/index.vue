<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

const route = useRoute();

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('resources').path(route.path).first()
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

defineOgImage('NuxtSeo.takumi');

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

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: page.value.title, item: route.path },
    ],
  }),
]);

const { handleError, showSuccess } = useErrorHandling();

const schema = z.object({
  url: z.url({ protocol: /^https?$/, error: 'Please enter a valid http(s) URL' }),
});

type Schema = z.output<typeof schema>;

const state = ref<Schema>({
  url: '',
});

const isLoading = ref(false);
const turnstile = ref();
const turnstileToken = ref('');

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!turnstileToken.value) {
    return;
  }

  try {
    isLoading.value = true;

    const response = await $fetch('/api/resources/free-ai-chatbot-generator', {
      method: 'POST',
      body: {
        url: event.data.url,
        turnstileToken: turnstileToken.value,
      },
    });

    showSuccess('Content processed successfully! Redirecting to chatbot...');

    await navigateTo(`/resources/free-ai-chatbot-generator/${encodeURIComponent(response.fileName)}`);

    state.value.url = '';
  } catch (error) {
    handleError(error, 'Failed to process web page content');
  } finally {
    isLoading.value = false;
    turnstileToken.value = '';
    turnstile.value?.reset();
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted">
    <section class="bg-gradient-to-br from-primary to-secondary py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="mb-8" aria-label="Breadcrumb">
          <ol class="flex items-center gap-2 text-sm text-white/80">
            <li>
              <ULink to="/" class="hover:text-secondary visited:text-white transition-colors">Home</ULink>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span class="text-white font-medium">{{ page!.title }}</span>
            </li>
          </ol>
        </nav>

        <div class="text-center">
          <h1 class="text-4xl lg:text-5xl font-bold text-white mb-6">
            {{ page!.title }}
          </h1>
          <h2 class="text-xl text-white mb-2 max-w-2xl mx-auto font-semibold">
            Train Your Bot on Your Business Content
          </h2>
          <p class="text-lg text-white/90 max-w-2xl mx-auto">
            {{ page!.description }}
          </p>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <UPageCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-globe" class="text-primary text-xl" />
              <h2 class="text-xl font-semibold">Import Your Business Content</h2>
            </div>
          </template>

          <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
            <div class="space-y-4">
              <p class="text-sm text-primary">
                Enter a URL from your website to automatically extract and analyze its content. You then get an AI
                agent trained directly on the information found on the page.
              </p>

              <UFormField name="url" required>
                <template #label>
                  <span class="font-medium">Your Business URL</span>
                </template>

                <UInput
                  v-model="state.url"
                  type="url"
                  placeholder="https://your-business.com"
                  size="lg"
                  class="w-full"
                />
              </UFormField>

              <NuxtTurnstile ref="turnstile" v-model="turnstileToken" />

              <div class="flex justify-end">
                <UButton
                  type="submit"
                  :loading="isLoading"
                  :disabled="!state.url.trim() || !turnstileToken"
                  icon="i-lucide-message-circle"
                  size="lg"
                >
                  Generate Chatbot
                </UButton>
              </div>
            </div>
          </UForm>
        </UPageCard>

        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <UPageCard>
            <div class="text-center p-4">
              <UIcon name="i-lucide-zap" class="text-primary text-2xl mb-3 mx-auto" />
              <h3 class="font-semibold mb-2">Instant Processing</h3>
              <p class="text-sm text-neutral">
                Extract and analyze website content in seconds with AI-powered processing.
              </p>
            </div>
          </UPageCard>

          <UPageCard>
            <div class="text-center p-4">
              <UIcon name="i-lucide-brain" class="text-primary text-2xl mb-3 mx-auto" />
              <h3 class="font-semibold mb-2">Intelligent Analysis</h3>
              <p class="text-sm text-neutral">Ask questions, get summaries, and explore insights from your business content.</p>
            </div>
          </UPageCard>

          <UPageCard>
            <div class="text-center p-4">
              <UIcon name="i-lucide-shield-check" class="text-primary text-2xl mb-3 mx-auto" />
              <h3 class="font-semibold mb-2">Secure & Private</h3>
              <p class="text-sm text-neutral">
                Your data is processed securely with enterprise-grade privacy protection.
              </p>
            </div>
          </UPageCard>
        </div>

        <div class="mt-12 text-center py-8">
          <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            {{ page!.cta!.title }}
          </h2>
          <p class="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
            {{ page!.cta!.description }}
          </p>
          <UButton
            :to="page!.cta!.button.to"
            color="primary"
            size="lg"
            icon="i-lucide-rocket"
          >
            {{ page!.cta!.button.label }}
          </UButton>
        </div>

        <div class="mt-12">
          <UPageCard>
            <template #header>
              <h2 class="text-2xl font-bold">Frequently Asked Questions</h2>
            </template>

            <UAccordion :items="page!.faqs" :unmount-on-hide="false" />
          </UPageCard>
        </div>
      </div>
    </section>
  </div>
</template>
