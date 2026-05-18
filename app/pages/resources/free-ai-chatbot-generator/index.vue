<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const route = useRoute();
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('pages').path(`/pages${route.path}`).first()
);

const title = page.value?.seo?.title || page.value?.title;
const description = page.value?.seo?.description || page.value?.description;

defineOgImage('NuxtSeo', {
  theme: THEME_PRIMARY_COLOR,
});

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
});

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: 'https://nuxtbeyond.com' },
      { name: 'Resources', item: 'https://nuxtbeyond.com/resources' },
      { name: 'Free AI Chatbot Generator', item: 'https://nuxtbeyond.com/resources/free-ai-chatbot-generator' },
    ],
  }),
  defineQuestion({
    name: 'Is the AI chatbot generator really free?',
    acceptedAnswer: 'Yes! This tool is completely free to use. Simply enter your business URL, and we\'ll create an AI chatbot trained on that webpage\'s content. No credit card or sign-up required to test it.',
  }),
  defineQuestion({
    name: 'How does the free AI chatbot generator work?',
    acceptedAnswer: 'Enter a webpage URL, and our AI instantly extracts and analyzes the content. You can then chat with an AI assistant trained specifically on that page. Perfect for testing how an AI chatbot would work with your business content.',
  }),
  defineQuestion({
    name: 'Can I embed this chatbot on my website?',
    acceptedAnswer: 'To embed an AI chatbot on your website, sign up for NuxtBeyond. Our paid plans start at $0/month (Free plan) with easy embed codes that work on any website.',
  }),
  defineQuestion({
    name: 'What can I use the chatbot for?',
    acceptedAnswer: 'Use it to test customer support automation, answer product questions, provide documentation assistance, or any use case where AI can help answer questions based on your website content.',
  }),
]);

const { handleError, showSuccess } = useErrorHandling();

const schema = z.object({
  url: z.url('Please enter a valid URL'),
});

type Schema = z.output<typeof schema>;

const state = ref<Schema>({
  url: '',
});

const isLoading = ref(false);
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
    turnstileToken.value = '';
  } catch (error: any) {
    handleError(error, 'Failed to process web page content');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <section class="bg-gradient-to-br from-primary to-secondary py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="mb-8" aria-label="Breadcrumb">
          <ol class="flex items-center gap-2 text-sm text-white/80">
            <li>
              <ULink to="/" class="hover:text-secondary visited:text-white transition-colors">Home</ULink>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span class="text-white font-medium">Free AI Chatbot Generator</span>
            </li>
          </ol>
        </nav>

        <div class="text-center">
          <h1 class="text-4xl lg:text-5xl font-bold text-white mb-6">
            Free AI Chatbot Generator
          </h1>
          <h2 class="text-xl text-white mb-2 max-w-2xl mx-auto font-semibold">
            Train Your Bot on Your Business Content
          </h2>
          <p class="text-lg text-white/90 max-w-2xl mx-auto">
            Instantly create a powerful, intelligent chatbot for your business - no sign-up, no code.
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

              <NuxtTurnstile v-model="turnstileToken" />

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

        <div class="mt-12 text-center">
          <UPageCard>
            <div class="space-y-6 py-8">
              <div>
                <h2 class="text-3xl font-bold mb-3">Want to Embed on your Website?</h2>
                <p class="text-lg text-neutral max-w-2xl mx-auto">
                  Sign up and get started with NuxtBeyond today to have your AI-powered chatbot live on your
                  website in minutes.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <UButton to="/signup" size="xl" icon="i-lucide-rocket" color="primary"> Start Free Trial </UButton>
                <UButton to="/#pricing" size="xl" variant="outline" icon="i-lucide-eye"> View All Plans </UButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div class="text-center">
                  <UIcon name="i-lucide-zap" class="text-primary text-3xl mb-2 mx-auto" />
                  <div class="font-semibold mb-1">5-Minute Setup</div>
                  <div class="text-sm text-neutral">No coding required</div>
                </div>
                <div class="text-center">
                  <UIcon name="i-lucide-shield-check" class="text-primary text-3xl mb-2 mx-auto" />
                  <div class="font-semibold mb-1">Free or 7-Day Free Trial</div>
                  <div class="text-sm text-neutral">Start for free and scale as you go</div>
                </div>
                <div class="text-center">
                  <UIcon name="i-lucide-trending-up" class="text-primary text-3xl mb-2 mx-auto" />
                  <div class="font-semibold mb-1">Up to 67% Support Cost Reduction</div>
                  <div class="text-sm text-neutral">Typical customer savings</div>
                </div>
              </div>
            </div>
          </UPageCard>
        </div>

        <div class="mt-12">
          <UPageCard>
            <template #header>
              <h2 class="text-2xl font-bold">Frequently Asked Questions</h2>
            </template>

            <UAccordion
              :items="[
                {
                  label: 'Is the AI chatbot generator really free?',
                  content: 'Yes! This tool is completely free to use. Simply enter your business URL, and we\'ll create an AI chatbot trained on that webpage\'s content. No credit card or sign-up required to test it.'
                },
                {
                  label: 'How does the free AI chatbot generator work?',
                  content: 'Enter a webpage URL, and our AI instantly extracts and analyzes the content. You can then chat with an AI assistant trained specifically on that page. Perfect for testing how an AI chatbot would work with your business content.'
                },
                {
                  label: 'Can I embed this chatbot on my website?',
                  content: 'The free tool is for testing only. To embed an AI chatbot on your website, sign up for NuxtBeyond. Our paid plans start at $0/month (Free plan) with easy embed codes that work on any website.'
                },
                {
                  label: 'What can I use the chatbot for?',
                  content: 'Use it to test customer support automation, answer product questions, provide documentation assistance, or any use case where AI can help answer questions based on your website content.'
                }
              ]"
              class="space-y-3"
            />
          </UPageCard>
        </div>
      </div>
    </section>
  </div>
</template>
