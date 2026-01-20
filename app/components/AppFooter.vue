<script setup lang="ts">
const columns = [
  {
    label: 'Free Tools',
    children: [
      {
        label: 'Free AI Chatbot Generator',
        to: '/resources/free-ai-chatbot-generator',
      },
    ],
  },
  {
    label: 'Resources',
    children: [
      {
        label: 'Blog',
        to: '/blog',
      },
    ],
  },
  {
    label: 'Legal',
    children: [
      {
        label: 'Privacy Policy',
        to: '/privacy-policy',
      },
      {
        label: 'Terms of Service',
        to: '/terms-of-service',
      },
    ],
  },
];
</script>

<template>
  <USeparator class="h-px" />

  <UFooter :ui="{ top: 'py-4 lg:py-8 border-b border-default', container: 'py-4 lg:py-8' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns" :ui="{ right: 'flex flex-col gap-1' }">
          <template #right>
            <div class="flex gap-1">
              <a href="https://www.uneed.best/tool/nuxtbeyond-self-learning-customer-support-project">
                <img src="https://www.uneed.best/EMBED3.png" alt="Uneed Embed Badge" width="120">
              </a>
            </div>

            <div class="flex gap-1">
              <ULink href="https://startupfa.me/s/nuxtbeyond?utm_source=nuxtbeyond.com" target="_blank">
                <img src="https://startupfa.me/badges/featured-badge.webp" alt="Featured on Startup Fame" width="140">
              </ULink>

              <ULink href="https://fazier.com/launches/nuxtbeyond.com" target="_blank">
                <img
                  src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&amp;theme=light"
                  width="180"
                  alt="Fazier badge"
                >
              </ULink>

              <a
href="https://postmake.io"
target="_blank"
rel="noopener"
><img
                  src="https://postmake.io/postmake_badge_colored.png"
                  alt="Postmake feature full-color badge"
                  width="140"
              ></a>
            </div>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">Copyright © {{ new Date().getFullYear() }} NuxtBeyond. All rights reserved.</p>
    </template>

    <template #right>
      <em class="text-xs text-ellipsis">Made By Raress96</em>
      <UButton
        to="https://www.linkedin.com/in/raress96/"
        target="_blank"
        icon="i-simple-icons-linkedin"
        aria-label="Raress96 on Linkedin"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://x.com/Raress96_"
        target="_blank"
        icon="i-simple-icons-x"
        aria-label="Raress96_ on X"
        color="neutral"
        variant="ghost"
      />
      <NuxtLink
        href="https://beyondfolder.com"
        external
        target="_blank"
        class="text-sm text-primary hover:text-secondary transition-colors"
      >
        BeyondFolder
      </NuxtLink>
    </template>
  </UFooter>
</template>
