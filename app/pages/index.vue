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
    <UPageHero
      :headline="page.hero.headline"
      :description="page.description"
      :links="page.hero.links"
      :ui="{
        container: 'pt-18 sm:pt-18 md:pt-18 lg:pt-24 pb-0 sm:pb-0 lg:pb-4 gap-y-6 sm:gap-y-6',
        title: 'max-w-3xl mx-auto',
        wrapper: '',
        links: '',
        footer: 'mt-6 sm:mt-6 lg:mt-6',
      }"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        <MDC :value="page.title" unwrap="p" />
      </template>
    </UPageHero>

    <UPageSection
      id="problem"
      :description="page.problem.description"
      class="relative overflow-hidden"
    >
      <template #title>
        <MDC :value="page.problem.title" />
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div
          v-for="(item, index) in page.problem.items"
          :key="index"
          class="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
        >
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
            {{ item.hours }}
          </div>
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {{ item.task }}
          </h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ item.description }}
          </p>
        </div>
      </div>
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/50' }" />

    <UPageSection
      id="ai-agents"
      :description="page.aiAgents.description"
      class="relative overflow-hidden"
    >
      <template #title>
        <MDC :value="page.aiAgents.title" />
      </template>

      <div class="flex flex-wrap justify-center gap-8 mt-8">
        <div
          v-for="agent in page.aiAgents.agents"
          :key="agent.name"
          class="flex flex-col items-center gap-3 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 min-w-[140px]"
        >
          <UIcon
            :name="agent.icon"
            class="w-12 h-12 text-neutral-700 dark:text-neutral-300"
          />
          <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center">
            {{ agent.name }}
          </span>
        </div>
      </div>
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/50' }" />

    <UPageSection
      :description="page.section.description"
      :features="page.section.features"
      orientation="horizontal"
      :ui="{
        container: 'lg:px-0 2xl:px-20 mx-0 max-w-none md:mr-10',
        features: 'gap-0',
      }"
      reverse
    >
      <template #title>
        <MDC :value="page.section.title" class="sm:*:leading-11" />
      </template>
      <img
        :src="page.section.images.desktop"
        :alt="page.section.title"
        class="hidden lg:block 2xl:hidden w-full max-w-4xl rounded-lg shadow-2xl"
      >
      <img
        :src="page.section.images.mobile"
        :alt="page.section.title"
        class="block lg:hidden 2xl:block w-full 2xl:max-w-4xl rounded-lg shadow-xl"
      >
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/50' }" />

    <UPageSection
      id="features"
      :description="page.features.description"
      :features="page.features.features"
      :ui="{
        title: 'text-left @container relative flex',
        description: 'text-left',
      }"
      class="relative overflow-hidden"
      :links="page.cta.links"
      data-fast-scroll="scroll_to_features"
    >
      <div class="absolute rounded-full -left-10 top-10 size-[300px] z-10 bg-secondary opacity-30 blur-[200px]" />
      <div class="absolute rounded-full -right-10 -bottom-10 size-[300px] z-10 bg-secondary opacity-30 blur-[200px]" />
      <template #title>
        <MDC :value="page.features.title" class="*:leading-9" />
        <div class="hidden @min-[920px]:block">
          <img
            src="/images/homepage/line-2.svg"
            alt="Line to the right"
            class="absolute top-0 right-0 size-full transform scale-95 translate-x-[70%]"
          >
        </div>
      </template>
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/30' }" />

    <UPageSection
      id="steps"
      :description="page.steps.description"
      class="relative overflow-hidden"
      data-fast-scroll="scroll_to_steps"
    >
      <template #headline>
        <img
          src="/images/homepage/line-3.svg"
          alt="Line center to the bottom"
          class="absolute -top-10 sm:top-0 right-1/2 h-24"
        >
      </template>
      <template #title>
        <MDC :value="page.steps.title" />
      </template>

      <template #features>
        <UPageCard
          v-for="(step, index) in page.steps.items"
          :key="index"
          class="group"
          :ui="{ container: 'p-4 sm:p-4', title: 'flex items-center gap-1' }"
        >
          <img v-if="step.image" :src="step.image" :alt="step.title" class="size-full">

          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">
              {{ step.title }}
            </span>
            <span class="text-sm text-muted">
              {{ step.description }}
            </span>
          </div>
        </UPageCard>
      </template>
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/30' }" />

    <UPageSection
      id="tech-stack"
      :description="page.techStack.description"
      class="relative overflow-hidden"
    >
      <template #title>
        <MDC :value="page.techStack.title" />
      </template>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-8">
        <div
          v-for="tech in page.techStack.technologies"
          :key="tech.name"
          class="flex flex-col items-center gap-3 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <UIcon
            :name="tech.icon"
            class="w-12 h-12"
            :class="tech.color"
          />
          <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center">
            {{ tech.name }}
          </span>
        </div>
      </div>
    </UPageSection>

    <UPageSection
      id="pricing"
      class="overflow-hidden"
      :title="page.pricing.title"
      :description="page.pricing.description"
      :plans="page.pricing.plans"
      :ui="{ title: 'text-left @container relative', description: 'text-left', container: 'max-w-7xl' }"
      data-fast-scroll="scroll_to_pricing"
    >
      <template #title>
        <MDC :value="page.pricing.title" />

        <div class="hidden @min-[1120px]:block">
          <img
            src="/images/homepage/line-4.svg"
            alt="Line to the right"
            class="absolute top-0 right-0 size-full transform translate-x-[60%]"
          >
        </div>
      </template>

      <PricingProgress
        :current-price="59"
        :original-price="249"
        :sales-count="0"
        :price-increment="10"
        :sales-per-increment="5"
      />

      <UPricingPlans scale compact>
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

    <UPageSection
      id="testimonials"
      :title="page.testimonials.title"
      :description="page.testimonials.description"
      :items="page.testimonials.items"
    >
      <template #headline>
        <img src="/images/homepage/line-5.svg" class="absolute -top-10 sm:top-0 right-1/2 h-24" alt="Small line center towards down">
      </template>
      <template #title>
        <MDC :value="page.testimonials.title" />
      </template>

      <UContainer>
        <UPageColumns class="xl:columns-3">
          <UPageCard
            v-for="(testimonial, index) in page.testimonials.items"
            :key="index"
            variant="subtle"
            :description="testimonial.quote"
            :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
          >
            <template #footer>
              <UUser v-bind="testimonial.user" size="xl" />
            </template>
          </UPageCard>
        </UPageColumns>
      </UContainer>
    </UPageSection>
    <USeparator />

    <UPageSection
      id="faqs"
      :description="page.faqs.description"
      :ui="{
        container: 'pt-8 sm:pt-8 md:pt-8 lg:pt-12 pb-12 sm:pb-12 lg:pb-20',
      }"
      data-fast-scroll="scroll_to_faqs"
    >
      <template #title>
        <MDC :value="page.faqs.title" class="sm:*:leading-11" />
      </template>

      <UAccordion
        :items="page.faqs.items"
        :ui="{
          item: '',
        }"
      >
        <template #body="{ item }">
          <MDC :value="item.content" unwrap="p" />
        </template>
      </UAccordion>
    </UPageSection>

    <USeparator />

    <UPageCTA
      v-bind="page.cta"
      variant="naked"
      class="overflow-hidden @container"
      :ui="{
        container: 'relative',
      }"
      data-fast-scroll="scroll_to_cta"
    >
      <template #title>
        <MDC :value="page.cta.title" />
      </template>

      <HeroBackground />
    </UPageCTA>
  </div>
</template>
