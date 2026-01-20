<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first());
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const {
  public: { siteUrl },
} = useRuntimeConfig();

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

useHead({
  script: [
    {
      textContent: `(function(){if(!window.nuxtbeyond || !window.__nuxtbeyond_loaded){window.nuxtbeyond=(...arguments)=>{if(!window.nuxtbeyond.q){window.nuxtbeyond.q=[];}window.nuxtbeyond.q.push(arguments);};window.nuxtbeyond=new Proxy(window.nuxtbeyond,{get(target,prop){if(prop==='q'){return target.q;}return(...args)=> target(prop,...args);},});}const config={"projectId":"047a6c7d-bb21-43d0-bdcb-5aa7536ec784","primaryColor":"#0d9488","position":"bottom-right","logo":"/projects/047a6c7d-bb21-43d0-bdcb-5aa7536ec784/logo"};const onLoad=function(){window.__nuxtbeyond_config=config;const embedScript=document.createElement('script');embedScript.src='${siteUrl}/embed.js';embedScript.onerror=()=>{console.error('NuxtBeyond:Failed to load embed script');};document.body.appendChild(embedScript);};if(document.readyState==='complete'){onLoad();}else{window.addEventListener('load',onLoad);}})();`,
      type: 'text/javascript',
      tagPosition: 'bodyClose',
    },
  ],
  style: [
    {
      textContent: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `,
    },
  ],
});

function openProject() {
  console.log('works', window.nuxtbeyond.open());

  if (window.nuxtbeyond && typeof window.nuxtbeyond.open === 'function') {
    window.nuxtbeyond.open();
  }
}
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

    <SubscribeForm />

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
      id="live-demo"
      orientation="horizontal"
      :title="page.liveDemo.title"
      :description="page.liveDemo.description"
      :ui="{
        container: 'py-12 sm:py-16 lg:py-20 lg:grid-cols-2 max-w-4xl',
        title: 'lg:text-right',
        description: 'lg:text-right',
      }"
    >
      <template #title>
        <MDC :value="page.liveDemo.title" />
      </template>

      <div class="relative flex items-center justify-center mt-8">
        <UButton
          size="xl"
          color="primary"
          variant="solid"
          icon="i-lucide-message-circle"
          class="cursor-pointer z-1"
          @click="openProject"
        >
          Try Live Demo
        </UButton>

        <div class="absolute -right-50 -bottom-40 hidden lg:block animate-bounce-slow">
          <svg
            width="350"
            height="350"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-secondary"
          >
            <path
              d="M 40 40 Q 120 60, 160 135"
              stroke="currentColor"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
              stroke-dasharray="5,5"
            />
            <path
              d="M 160 140 L 150 135 M 160 140 L 165 128"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <div class="absolute -right-5 -bottom-20 block lg:hidden animate-bounce-slow">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="text-primary"
          >
            <path
              d="M 30 30 Q 90 40, 120 80 Q 140 110, 145 160"
              stroke="currentColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
              stroke-dasharray="5,5"
            />
            <path
              d="M 145 160 L 137 153 M 145 160 L 152 152"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
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
        />
      </UPricingPlans>

      <UAlert
        class="w-auto mx-auto"
        color="neutral"
        variant="soft"
        title="*Self Learning"
        description="After your support team handles a case, the answer can be automatically included in the AI's training data for future responses"
      />
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
