<script setup lang="ts">
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const route = useRoute()

const { data: post } = await useAsyncData(route.path, () => queryCollection('posts').path(route.path).first())
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('posts', route.path, {
    fields: ['description']
  })
})

const title = post.value.seo?.title || post.value.title
const description = post.value.seo?.description || post.value.description

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

if (post.value.image?.src) {
  useSeoMeta({ ogImage: post.value.image.src })
} else {
  defineOgImage('NuxtSeo', {
    theme: THEME_PRIMARY_COLOR,
    headline: 'NuxtBeyond Blog'
  });
}
</script>

<template>
  <UContainer v-if="post">
    <UPageHeader
      :title="post.title"
      :description="post.description"
    >
      <template #headline>
        <UBadge
          v-bind="post.badge"
          variant="subtle"
        />
        <span class="text-muted">&middot;</span>
        <time class="text-muted">{{ new Date(post.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) }}</time>
      </template>

      <div class="flex flex-wrap items-center gap-3 mt-4">
        <UButton
          v-for="(author, index) in post.authors"
          :key="index"
          :to="author.to"
          color="neutral"
          variant="subtle"
          target="_blank"
          size="sm"
        >
          <UAvatar
            v-bind="author.avatar"
            alt="Author avatar"
            size="2xs"
          />

          {{ author.name }}
        </UButton>
      </div>
    </UPageHeader>

    <UPage>
      <UPageBody>
        <ContentRenderer
          v-if="post"
          :value="post"
        />

        <div class="mt-12 text-center">
          <UPageCard>
            <div class="space-y-6 py-8">
              <div>
                <h3 class="text-3xl font-bold mb-3">
                  Ready to Transform Your Customer Support?
                </h3>
                <p class="text-lg text-neutral max-w-2xl mx-auto">
                  Join businesses already using NuxtBeyond to reduce costs, improve satisfaction, and deliver 24/7 AI-powered support. Get started in minutes.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <UButton
                  to="/signup"
                  size="xl"
                  icon="i-lucide-rocket"
                  color="primary"
                >
                  Start Free Trial
                </UButton>
                <UButton
                  to="/#pricing"
                  size="xl"
                  variant="outline"
                  icon="i-lucide-eye"
                >
                  View All Plans
                </UButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div class="text-center">
                  <UIcon
                    name="i-lucide-zap"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    5-Minute Setup
                  </div>
                  <div class="text-sm text-neutral">
                    No coding required
                  </div>
                </div>
                <div class="text-center">
                  <UIcon
                    name="i-lucide-shield-check"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    7-Day Free Trial
                  </div>
                  <div class="text-sm text-neutral">
                    Cancel anytime, no credit card
                  </div>
                </div>
                <div class="text-center">
                  <UIcon
                    name="i-lucide-trending-up"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    Up to 67% Cost Reduction
                  </div>
                  <div class="text-sm text-neutral">
                    Typical customer savings
                  </div>
                </div>
              </div>
            </div>
          </UPageCard>
        </div>

        <USeparator v-if="surround?.length" />

        <UContentSurround :surround="surround" />
      </UPageBody>

      <template
        v-if="post?.body?.toc?.links?.length"
        #right
      >
        <UContentToc :links="post.body.toc.links" />
      </template>
    </UPage>
  </UContainer>
</template>
