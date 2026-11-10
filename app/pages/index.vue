<script setup lang="ts">
import { GITHUB_REPO_URL } from '#shared/constants';

const { data: page } = await useAsyncData('index', () => queryCollection('index').first());
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const title = page.value?.seo?.title || page.value?.title;
const description = page.value?.seo?.description || page.value?.description;

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description,
});

const heroBadge = page.value.hero.badge;

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'NuxtBeyond',
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web',
        'description': description,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': page.value?.faqs?.items?.map((faq: { label: string; content: string }) => ({
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
</script>

<template>
  <div v-if="page" class="relative">
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 -z-10">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div class="absolute top-20 right-1/4 w-80 h-80 bg-info/15 rounded-full blur-[100px]" />
      </div>

      <UContainer class="pt-16 sm:pt-20 lg:pt-28 pb-12">
        <div class="text-center max-w-4xl mx-auto mb-12">
          <UBadge v-if="heroBadge" color="primary" variant="subtle" size="lg" class="mb-6">
            <UIcon name="i-simple-icons-github" class="w-4 h-4 mr-1" />
            {{ heroBadge }}
          </UBadge>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <MDC :value="page.title" unwrap="p" />
          </h1>

          <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            {{ page.description }}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton v-for="link in page.hero.links" :key="link.label" v-bind="link" />
          </div>
        </div>

        <div class="max-w-5xl mx-auto mb-12">
          <div class="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src="/images/homepage/demo2.png"
              alt="NuxtBeyond dashboard with AI chat, image generation, and project management"
              class="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
</UContainer>
    </section>

    <UPageSection
      id="problem"
      :ui="{
        container: 'py-4 sm:py-6 lg:py-12',
      }"
    >
      <template #title>
        <MDC :value="page.problem.title" />
      </template>

      <template #description>
        {{ page.problem.description }}
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <div
          v-for="(item, index) in page.problem.items"
          :key="index"
          class="group relative p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-error/10 dark:bg-error/20 flex items-center justify-center shrink-0">
              <UIcon :name="item.icon || 'i-lucide-clock'" class="w-5 h-5 text-error" />
            </div>
            <div>
              <div class="text-2xl font-bold text-error mb-1">{{ item.hours }} hrs</div>
              <h3 class="font-semibold mb-1">
                {{ item.task }}
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <div
          class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary font-semibold"
        >
          <UIcon name="i-lucide-calculator" class="w-5 h-5" />
          <span>= 200+ hours saved with NuxtBeyond</span>
        </div>
      </div>
    </UPageSection>

    <section v-if="page.founder" class="pb-8 sm:pb-10 lg:pb-12">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center">
          <p class="text-sm text-neutral-500 uppercase tracking-wider mb-3">{{ page.founder.title }}</p>
          <blockquote class="text-md text-neutral-600 dark:text-neutral-300 italic mb-3 leading-relaxed">
            "{{ page.founder.story }}"
          </blockquote>
          <div class="flex items-center justify-center gap-3">
            <em class="font-semibold text-lg leading-none">&mdash; {{ page.founder.name }}</em>
            <div class="flex items-center gap-3">
              <NuxtLink
                :to="page.founder.x"
                target="_blank"
                class="inline-flex items-center text-neutral-500 hover:text-primary transition-colors"
                aria-label="X profile"
              >
                <UIcon name="i-simple-icons-x" class="w-4 h-4" />
              </NuxtLink>
              <NuxtLink
                :to="page.founder.linkedin"
                target="_blank"
                class="inline-flex items-center text-neutral-500 hover:text-primary transition-colors"
                aria-label="LinkedIn profile"
              >
                <UIcon name="i-simple-icons-linkedin" class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <USeparator />

    <UPageSection
      id="ai-features"
      :ui="{
        container: 'py-4 sm:py-6 lg:py-12',
      }"
    >
      <template #title>
        <MDC :value="page.aiFeatures.title" />
      </template>

      <template #description>
        {{ page.aiFeatures.description }}
      </template>

      <LandingAiShowcase :items="page.aiShowcase.items" />

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LandingAiFeatureCard
          v-for="category in page.aiFeatures.categories"
          :key="category.title"
          :category="category"
        />
      </div>

      <div class="mb-8 text-center">
        <p class="text-neutral-600 dark:text-neutral-400 mb-4 text-xl">Ready to ship your AI product?</p>
        <UButton label="Get it on GitHub" icon="i-simple-icons-github" size="xl" :to="GITHUB_REPO_URL" target="_blank" />
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="everything-included"
      :ui="{
        container: 'py-4 sm:py-6 lg:py-12',
      }"
    >
      <template #title>
        <MDC :value="page.fullStackFeatures.title" />
      </template>

      <template #description>
        {{ page.fullStackFeatures.description }}
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div
          v-for="feature in page.fullStackFeatures.features"
          :key="feature.title"
          class="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <div class="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
            <UIcon :name="feature.icon" class="w-6 h-6 text-primary" />
          </div>
          <h3 class="text-lg font-semibold mb-2">
            {{ feature.title }}
          </h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ feature.description }}
          </p>
        </div>
      </div>

      <div class="mt-12">
        <h3 class="text-center text-lg font-semibold mb-6 text-neutral-600 dark:text-neutral-400">Powered by</h3>
        <div class="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          <div
            v-for="tech in page.techStack.technologies"
            :key="tech.name"
            class="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            <UIcon :name="tech.icon" class="w-5 h-5" :class="tech.color" />
            <span class="text-sm font-medium">
              {{ tech.name }}
            </span>
          </div>
        </div>
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="developer-experience"
      :ui="{
        container: 'py-4 sm:py-6 lg:py-16',
      }"
    >
      <template #title>
        <MDC :value="page.aiAgents.title" />
      </template>

      <template #description>
        {{ page.aiAgents.description }}
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
        <div>
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div
              v-for="agent in page.aiAgents.agents"
              :key="agent.name"
              class="flex flex-col items-center gap-3 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
            >
              <UIcon :name="agent.icon" class="w-8 h-8 text-neutral-700 dark:text-neutral-300" />
              <span class="text-sm font-medium text-center">
                {{ agent.name }}
              </span>
            </div>
          </div>

          <div class="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950">
            <div class="flex items-center gap-2 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-error/80" />
                <div class="w-3 h-3 rounded-full bg-warning/80" />
                <div class="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <span class="text-xs text-neutral-500 ml-2">CLAUDE.md</span>
            </div>
            <div class="p-4 font-mono text-sm">
              <pre class="text-neutral-300 whitespace-pre-wrap text-xs">{{ page.aiAgents.codeSnippet }}</pre>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-for="item in page.steps.items" :key="item.step" class="flex gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
            >
              <span class="text-lg font-bold text-primary">{{ item.step }}</span>
            </div>
            <div>
              <h3 class="font-semibold mb-1">{{ item.title }}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{{ item.description }}</p>
              <div v-if="item.code" class="rounded-lg bg-neutral-950 p-3 font-mono text-xs">
                <pre class="text-neutral-300 whitespace-pre-wrap">{{ item.code.trim() }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UPageSection>

    <USeparator />

    <section id="pricing" class="py-10 sm:py-16">
      <UContainer>
        <div class="text-center mb-8">
          <UBadge v-if="page.pricing.badge" color="primary" variant="subtle" size="lg" class="mb-5">
            <UIcon name="i-lucide-scale" class="w-4 h-4 mr-1" />
            {{ page.pricing.badge }}
          </UBadge>

          <h2 class="text-3xl sm:text-4xl font-bold mb-4">
            <MDC :value="page.pricing.title" unwrap="p" />
          </h2>

          <p class="text-lg text-neutral-600 dark:text-neutral-400 mb-2 max-w-2xl mx-auto">
            {{ page.pricing.description }}
          </p>
        </div>

        <UPricingPlan
          :title="page.pricing.offer.title"
          :description="page.pricing.offer.description"
          :price="page.pricing.offer.price"
          :billing-cycle="page.pricing.offer.billing_cycle"
          :features="page.pricing.offer.features"
          highlight
          variant="subtle"
          class="max-w-lg mx-auto"
        >
          <template #footer>
            <div class="flex flex-col gap-3 w-full">
              <UButton v-for="link in page.pricing.offer.links" :key="link.label" v-bind="link" block />
            </div>
          </template>
        </UPricingPlan>

        <div class="flex flex-wrap justify-center gap-6 mt-8 text-sm text-neutral-500">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
            <span>Questions? <NuxtLink to="https://x.com/raress96" target="_blank" class="text-primary hover:underline">DM me</NuxtLink></span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-megaphone" class="w-4 h-4" />
            <span>Also by Rareș: <NuxtLink to="https://beyondfolder.com/distribution" target="_blank" class="text-primary hover:underline">Distribution Toolkit</NuxtLink></span>
          </div>
        </div>
      </UContainer>
    </section>

    <USeparator />

    <UPageSection
      id="faqs"
      :ui="{
        container: 'py-4 sm:py-6 lg:py-12',
      }"
    >
      <template #title>
        {{ page.faqs.title }}
      </template>

      <template #description>
        {{ page.faqs.description }}
      </template>

      <UAccordion
        :items="page.faqs.items"
        class="mt-6 max-w-3xl mx-auto"
        :unmount-on-hide="false"
        :ui="{
          item: 'text-base',
          trigger: 'text-lg font-semibold py-4',
          content: 'text-base',
        }"
      >
        <template #body="{ item }">
          <MDC :value="item.content" unwrap="p" />
        </template>
      </UAccordion>
    </UPageSection>

    <USeparator />

    <section class="relative overflow-hidden">
      <div class="absolute inset-0 -z-10">
        <div class="absolute bottom-0 left-1/3 w-96 h-96 bg-primary/15 rounded-full blur-[128px]" />
        <div class="absolute bottom-20 right-1/3 w-80 h-80 bg-info/10 rounded-full blur-[100px]" />
      </div>

      <UContainer class="py-20 sm:py-28 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto">
          <MDC :value="page.cta.title" unwrap="p" />
        </h2>

        <p class="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
          {{ page.cta.description }}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton v-for="link in page.cta.links" :key="link.label" v-bind="link" />
        </div>
      </UContainer>
    </section>
  </div>
</template>
