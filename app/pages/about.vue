<script setup lang="ts">
const { data: page } = await useAsyncData('about', () => queryCollection('about').first());
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const title = page.value.seo.title;
const description = page.value.seo.description;

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description,
});

defineOgImage('NuxtSeo.takumi');

useSchemaOrg([
  defineWebPage({ '@type': 'AboutPage' }),
  defineOrganization({
    name: 'NuxtBeyond',
    description: page.value.description,
    address: {
      addressLocality: 'Cluj-Napoca',
      addressCountry: 'RO',
    },
    founder: defineSiteAuthor(),
  }),
]);
</script>

<template>
  <UContainer v-if="page" class="max-w-3xl">
    <UPageHeader :title="page.title" :description="page.description" />

    <UPageBody>
      <div class="space-y-12">
        <section v-for="section in page.sections" :key="section.title" class="space-y-3">
          <h2 class="text-2xl font-bold text-highlighted">
            {{ section.title }}
          </h2>
          <MDC
            v-for="(paragraph, index) in section.paragraphs"
            :key="index"
            :value="paragraph"
            tag="p"
            unwrap="p"
            class="text-muted leading-relaxed"
          />
          <ul v-if="section.items" class="list-disc pl-6 space-y-1 text-muted">
            <li v-for="item in section.items" :key="item">
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="space-y-4">
          <h2 class="text-2xl font-bold text-highlighted">
            {{ page.facts.title }}
          </h2>
          <dl class="rounded-lg border border-default divide-y divide-default">
            <div v-for="row in page.facts.rows" :key="row.label" class="grid sm:grid-cols-[12rem_1fr] gap-1 sm:gap-4 p-4">
              <dt class="text-sm font-semibold text-highlighted">
                {{ row.label }}
              </dt>
              <MDC :value="row.value" tag="dd" unwrap="p" class="text-sm text-muted leading-relaxed" />
            </div>
          </dl>
        </section>

        <div class="text-center">
          <UButton
            :to="page.cta.to"
            :target="page.cta.target"
            :label="page.cta.label"
            size="xl"
            color="primary"
            icon="i-simple-icons-github"
          />
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
