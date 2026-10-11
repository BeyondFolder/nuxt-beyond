<script setup lang="ts">
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

interface SaasIdea {
  name: string;
  oneLiner: string;
  problem: string;
  targetAudience: string;
  monetization: string;
  complexity: string;
  techStack: string[];
}

const description = ref('');
const category = ref<string | undefined>(undefined);
const complexity = ref<string | undefined>(undefined);
const generatedIdeas = ref<SaasIdea[]>([]);
const isLoading = ref(false);
const error = ref('');

const monetizationColors: Record<string, string> = {
  freemium: 'info',
  subscription: 'primary',
  'one-time': 'success',
  'usage-based': 'warning',
};

const complexityColors: Record<string, string> = {
  weekend: 'success',
  'side-project': 'warning',
  'full-product': 'error',
};

async function generateIdeas() {
  if (!description.value || description.value.length < 10) {
    error.value = 'Please tell us a bit more about yourself (at least 10 characters).';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const { ideas } = await $fetch<{ ideas: SaasIdea[] }>('/api/resources/generate-ideas', {
      method: 'POST',
      body: {
        description: description.value,
        category: category.value,
        complexity: complexity.value,
      },
    });
    generatedIdeas.value = ideas;
  } catch (err: any) {
    if (err.response?.status === 429 || err.statusCode === 429) {
      error.value = err.data?.message || 'Too many requests. Please wait a few minutes.';
    } else {
      error.value = 'Failed to generate ideas. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-10">
          <h1 class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {{ page!.title }}
          </h1>
          <p class="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            {{ page!.description }}
          </p>
        </div>

        <div class="flex justify-center gap-8 mb-10 text-sm text-neutral-500 dark:text-neutral-400">
          <div
            v-for="stat in page!.stats"
            :key="stat.label"
            class="flex items-center gap-2"
          >
            <UIcon :name="stat.icon" class="text-primary" />
            <span>{{ stat.label }}</span>
          </div>
        </div>

        <UCard class="mb-10">
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Tell us about yourself <span class="text-error">*</span>
              </label>
              <UTextarea
                v-model="description"
                :rows="5"
                placeholder="I'm a developer who loves building tools for other developers. I work in fintech and have experience with APIs and data pipelines..."
                :maxlength="500"
                class="w-full"
              />
              <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {{ description.length }}/500 characters
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Interest area <span class="text-neutral-400">(optional)</span>
                </label>
                <USelectMenu
                  v-model="category"
                  :items="page!.categoryOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Any category"
                  :search-input="false"
                  clear
                  :ui="{ base: 'w-full sm:w-50' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Preferred complexity <span class="text-neutral-400">(optional)</span>
                </label>
                <USelectMenu
                  v-model="complexity"
                  :items="page!.complexityOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Any complexity"
                  :search-input="false"
                  clear
                  :ui="{ base: 'w-full sm:w-50' }"
                />
              </div>
            </div>

            <UAlert
              v-if="error"
              color="error"
              variant="subtle"
              icon="i-lucide-alert-circle"
              :title="error"
            />

            <UButton
              color="primary"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading"
              icon="i-lucide-sparkles"
              class="w-full"
              @click="generateIdeas"
            >
              {{ isLoading ? 'Generating ideas...' : 'Generate Ideas' }}
            </UButton>

            <p v-if="isLoading" class="text-xs text-neutral-400 dark:text-neutral-500">
              This can take 10-30 seconds. The AI is generating personalized ideas for you.
            </p>
          </div>
        </UCard>

        <div v-if="generatedIdeas.length > 0" class="mb-10">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Your SaaS Ideas
            </h2>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="isLoading"
              @click="generateIdeas"
            >
              Generate More
            </UButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div
              v-for="(idea, index) in generatedIdeas"
              :key="index"
              class="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl p-6 flex flex-col gap-4"
            >
              <div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  {{ idea.name }}
                </h3>
                <p class="text-neutral-600 dark:text-neutral-400 text-sm">
                  {{ idea.oneLiner }}
                </p>
              </div>

              <div>
                <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                  Problem
                </p>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">
                  {{ idea.problem }}
                </p>
              </div>

              <div>
                <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                  Target Audience
                </p>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">
                  {{ idea.targetAudience }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  :color="(monetizationColors[idea.monetization] || 'neutral') as any"
                  variant="subtle"
                  size="sm"
                >
                  {{ idea.monetization }}
                </UBadge>
                <UBadge
                  :color="(complexityColors[idea.complexity] || 'neutral') as any"
                  variant="subtle"
                  size="sm"
                >
                  {{ idea.complexity }}
                </UBadge>
              </div>

              <div>
                <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Tech Stack
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tech in idea.techStack"
                    :key="tech"
                    class="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded"
                  >
                    {{ tech }}
                  </span>
                </div>
              </div>

              <div class="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <ULink
                  to="/#pricing"
                  class="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  Build this with NuxtBeyond
                  <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
                </ULink>
              </div>
            </div>
          </div>

          <UAlert
            color="primary"
            variant="subtle"
            icon="i-lucide-rocket"
            title="Have your idea?"
          >
            <template #description>
              NuxtBeyond ships with auth, payments, AI chat, and edge deployment — start building today.
              <ULink to="/#pricing" class="font-medium underline ml-1">Get NuxtBeyond →</ULink>
            </template>
          </UAlert>
        </div>

        <USeparator class="my-12" />

        <div class="prose prose-neutral dark:prose-invert max-w-none space-y-10">
          <div
            v-for="section in page!.seoSections"
            :key="section.title"
          >
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              {{ section.title }}
            </h2>
            <div class="space-y-3 text-neutral-600 dark:text-neutral-400">
              <MDC :value="section.content" />
            </div>
          </div>

          <div>
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Frequently Asked Questions
            </h2>
            <UAccordion :items="page!.faqs" :unmount-on-hide="false" />
          </div>
        </div>

        <USeparator class="my-12" />

        <div class="text-center py-8">
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
      </div>
    </UContainer>
  </div>
</template>
