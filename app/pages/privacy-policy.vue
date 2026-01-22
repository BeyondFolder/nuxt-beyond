<script setup lang="ts">
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const route = useRoute();

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('pages').path(`/pages${route.path}`).first()
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const title = page.value?.seo?.title || page.value?.title;
const description = page.value?.seo?.description || page.value?.description;

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
});

defineOgImageComponent('NuxtSeo', {
  theme: THEME_PRIMARY_COLOR,
});
</script>

<template>
  <UContainer>
    <UPageBody class="py-12 sm:py-16 lg:py-20">
      <div class="max-w-4xl mx-auto">
        <div class="mb-12">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4">
            {{ page?.title }}
          </h1>
          <p class="text-muted text-lg">
            Last updated: {{ page?.meta?.lastUpdated }}
          </p>
        </div>

        <div class="prose prose-neutral dark:prose-invert max-w-none">
          <div
            v-for="(section, index) in page?.meta?.sections || []"
            :key="index"
            class="mb-12"
          >
            <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-primary">
              {{ section.title }}
            </h2>

            <div
              v-if="section.content"
              class="text-neutral leading-relaxed mb-2 space-y-2"
            >
              <MDC :value="section.content" />
            </div>

            <div v-if="section.subsections" class="space-y-2">
              <div
                v-for="(subsection, subIndex) in section.subsections"
                :key="subIndex"
                class="ml-0 sm:ml-4"
              >
                <h3 class="text-xl font-semibold mb-3">
                  {{ subsection.subtitle }}
                </h3>
                <div class="text-neutral leading-relaxed space-y-2">
                  <MDC :value="subsection.content" />
                </div>
              </div>
            </div>

            <USeparator
              v-if="index < (page?.meta?.sections?.length ?? 0) - 1"
              class="my-10"
            />
          </div>
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
