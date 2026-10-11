<script setup lang="ts">
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
  defineOgImage('NuxtSeo.takumi');
}

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
const toIsoDate = (date: string | Date) => new Date(date).toISOString().slice(0, 10)

useSchemaOrg([
  defineArticle({
    '@type': 'BlogPosting',
    'headline': post.value.title,
    description,
    'image': post.value.image?.src || '/images/preview.png',
    'datePublished': post.value.date,
    'dateModified': post.value.updatedAt ?? post.value.date,
    'author': post.value.authors.map(definePostAuthor)
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Blog', item: '/blog' },
      { name: post.value.title, item: route.path }
    ]
  })
])
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
        <time
          :datetime="toIsoDate(post.date)"
          class="text-muted"
        >
          {{ formatDate(post.date) }}
        </time>
        <template v-if="post.updatedAt">
          <span class="text-muted">&middot;</span>
          <span class="text-muted">Last updated <time :datetime="toIsoDate(post.updatedAt)">{{ formatDate(post.updatedAt) }}</time></span>
        </template>
      </template>

      <div class="flex flex-wrap items-center gap-3 mt-4">
        <UButton
          v-for="(author, index) in post.authors"
          :key="index"
          :to="author.to"
          color="neutral"
          variant="subtle"
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
                  Build your AI SaaS on NuxtBeyond
                </h3>
                <p class="text-lg text-neutral max-w-2xl mx-auto">
                  NuxtBeyond is a Nuxt 4 boilerplate with login, Stripe or Polar billing, AI chat with RAG and Cloudflare deploys already wired. You buy the source code once and use it on unlimited projects.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <UButton
                  to="/#pricing"
                  size="xl"
                  icon="i-lucide-zap"
                  color="primary"
                >
                  See the price
                </UButton>
                <UButton
                  to="/login"
                  size="xl"
                  variant="outline"
                  icon="i-lucide-arrow-right"
                >
                  Try the demo
                </UButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div class="text-center">
                  <UIcon
                    name="i-lucide-code"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    Source code you own
                  </div>
                  <div class="text-sm text-neutral">
                    Clone it and change anything
                  </div>
                </div>
                <div class="text-center">
                  <UIcon
                    name="i-lucide-receipt"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    One-time price
                  </div>
                  <div class="text-sm text-neutral">
                    Lifetime updates through GitHub
                  </div>
                </div>
                <div class="text-center">
                  <UIcon
                    name="i-lucide-briefcase"
                    class="text-primary text-3xl mb-2 mx-auto"
                  />
                  <div class="font-semibold mb-1">
                    Unlimited projects
                  </div>
                  <div class="text-sm text-neutral">
                    Client work included
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
