<script setup lang="ts">
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: 'white' },
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en',
  },
});

useSeoMeta({
  ogSiteName: 'NuxtBeyond',
  titleTemplate: '%s - NuxtBeyond',
  ogImage: 'https://nuxtbeyond.com/images/preview.png',
  twitterTitle: 'NuxtBeyond',
  twitterImage: 'https://nuxtbeyond.com/images/preview.png',
  twitterCard: 'summary_large_image'
})

// Datafa.st analytics if needed
// useScript({
//   'src': 'https://datafa.st/js/script.js',
//   'defer': true,
//   'data-domain': 'nuxtbeyond.com',
//   'data-website-id': 'YOUR_WEBSITE_ID',
// });
</script>

<template>
  <UApp :toaster="{ duration: 5_000 }">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
