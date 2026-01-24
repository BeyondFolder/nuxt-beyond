<script setup lang="ts">
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
</script>

<template>
  <div v-if="page" class="relative">
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 -z-10">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div class="absolute top-20 right-1/4 w-80 h-80 bg-info/15 rounded-full blur-[100px]" />
      </div>

      <UContainer class="pt-16 sm:pt-20 lg:pt-28 pb-12 sm:pb-16">
        <div class="text-center max-w-4xl mx-auto mb-12">
          <UBadge
            v-if="page.hero.badge"
            color="primary"
            variant="subtle"
            size="lg"
            class="mb-6"
          >
            <UIcon name="i-lucide-sparkles" class="w-4 h-4 mr-1" />
            {{ page.hero.badge }}
          </UBadge>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <MDC :value="page.title" unwrap="p" />
          </h1>

          <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            {{ page.description }}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              v-for="link in page.hero.links"
              :key="link.label"
              v-bind="link"
            />
          </div>
        </div>

        <LandingAiShowcase :items="page.aiShowcase.items" />
      </UContainer>
    </section>

    <USeparator />

    <UPageSection
      id="problem"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.problem.title" />
      </template>

      <template #description>
        {{ page.problem.description }}
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        <div
          v-for="(item, index) in page.problem.items"
          :key="index"
          class="group relative p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-error/10 dark:bg-error/20 flex items-center justify-center shrink-0">
              <UIcon
                :name="item.icon || 'i-lucide-clock'"
                class="w-5 h-5 text-error"
              />
            </div>
            <div>
              <div class="text-2xl font-bold text-error mb-1">
                {{ item.hours }} hrs
              </div>
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

      <div class="mt-10 text-center">
        <div class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary font-semibold">
          <UIcon name="i-lucide-calculator" class="w-5 h-5" />
          <span>= 215+ hours saved with NuxtBeyond</span>
        </div>
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="ai-features"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.aiFeatures.title" />
      </template>

      <template #description>
        {{ page.aiFeatures.description }}
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        <LandingAiFeatureCard
          v-for="category in page.aiFeatures.categories"
          :key="category.title"
          :category="category"
        />
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="features"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.fullStackFeatures.title" />
      </template>

      <template #description>
        {{ page.fullStackFeatures.description }}
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
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
    </UPageSection>

    <USeparator />

    <UPageSection
      id="ai-agents"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.aiAgents.title" />
      </template>

      <template #description>
        {{ page.aiAgents.description }}
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 items-center">
        <div class="order-2 lg:order-1">
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
              <pre class="text-neutral-300 whitespace-pre-wrap">{{ page.aiAgents.codeSnippet }}</pre>
            </div>
          </div>
        </div>

        <div class="order-1 lg:order-2">
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="agent in page.aiAgents.agents"
              :key="agent.name"
              class="flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50 transition-colors"
            >
              <UIcon
                :name="agent.icon"
                class="w-10 h-10 text-neutral-700 dark:text-neutral-300"
              />
              <span class="text-sm font-medium text-center">
                {{ agent.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="tech-stack"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.techStack.title" />
      </template>

      <template #description>
        {{ page.techStack.description }}
      </template>

      <div class="flex flex-wrap justify-center gap-4 mt-10 max-w-4xl mx-auto">
        <div
          v-for="tech in page.techStack.technologies"
          :key="tech.name"
          class="flex items-center gap-3 px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50 transition-colors"
        >
          <UIcon
            :name="tech.icon"
            class="w-5 h-5"
            :class="tech.color"
          />
          <span class="text-sm font-medium">
            {{ tech.name }}
          </span>
        </div>
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="steps"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.steps.title" />
      </template>

      <template #description>
        {{ page.steps.description }}
      </template>

      <div class="space-y-8 mt-10">
        <LandingStepCard
          v-for="item in page.steps.items"
          :key="item.step"
          :step="item.step"
          :title="item.title"
          :description="item.description"
          :code="item.code"
        />
      </div>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="pricing"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.pricing.title" />
      </template>

      <template #description>
        {{ page.pricing.description }}
      </template>

      <PricingProgress
        :current-price="59"
        :original-price="249"
        :sales-count="0"
        :price-increment="10"
        :sales-per-increment="5"
        class="mt-10"
      />

      <UPricingPlans scale compact class="mt-8">
        <UPricingPlan
          v-for="(plan, index) in page.pricing.plans"
          :key="index"
          :title="plan.title"
          :description="plan.description"
          :price="plan.price"
          :discount="plan.discount"
          :billing-period="plan.billing_period"
          :billing-cycle="plan.billing_cycle"
          :highlight="plan.highlight"
          :scale="plan.highlight"
          variant="subtle"
          :features="plan.features"
          :button="plan.button"
          :badge="plan.badge"
        >
          <template v-if="plan.comingSoon" #badge>
            <UBadge color="warning" size="md">
              Coming Soon
            </UBadge>
          </template>
        </UPricingPlan>
      </UPricingPlans>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="testimonials"
      :ui="{
        container: 'py-16 sm:py-20',
      }"
    >
      <template #title>
        <MDC :value="page.testimonials.title" />
      </template>

      <template #description>
        {{ page.testimonials.description }}
      </template>

      <UContainer class="mt-10">
        <UPageColumns class="xl:columns-3">
          <UPageCard
            v-for="(testimonial, index) in page.testimonials.items"
            :key="index"
            variant="subtle"
            :description="testimonial.quote"
            :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
          >
            <template #footer>
              <UUser v-bind="testimonial.user" size="lg" />
            </template>
          </UPageCard>
        </UPageColumns>
      </UContainer>
    </UPageSection>

    <USeparator />

    <UPageSection
      id="faqs"
      :ui="{
        container: 'py-16 sm:py-20',
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
        class="mt-10 max-w-3xl mx-auto"
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
          <UButton
            v-for="link in page.cta.links"
            :key="link.label"
            v-bind="link"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>
