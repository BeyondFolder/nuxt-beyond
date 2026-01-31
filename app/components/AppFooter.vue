<script setup lang="ts">
const columns = [
  {
    label: 'Free Tools',
    children: [
      {
        label: 'Nuxt Session Password Generator',
        to: '/resources/nuxt-session-password-generator',
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
            <div class="w-auto mx-auto mb-6 flex gap-5 justify-center">
              <div class="flex">
                <!--                <a href="https://www.uneed.best/tool/claude-code-distribution-framework" target="_blank">-->
                <!--                  <img src="https://www.uneed.best/POTD2A.png" width="150" alt="Uneed POTD2 Badge" />-->
                <!--                </a>-->
              </div>

              <div class="flex">
                <a href="https://www.aidirectori.es" target="_blank"
                  ><img
                    src="https://cdn.aidirectori.es/ai-tools/badges/no-background.png"
                    width="150"
                    alt="Featured on AI Directories"
                  />
                </a>
              </div>

              <div class="flex">
                <a href="https://startupfa.me/s/nuxtbeyond?utm_source=nuxtbeyond.com" target="_blank"
                  ><img
                    src="https://startupfa.me/badges/featured-badge.webp"
                    alt="NuxtBeyond - Featured on Startup Fame"
                    width="100"
                /></a>
              </div>
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
        to="https://x.com/Raress96_"
        target="_blank"
        icon="i-simple-icons-x"
        aria-label="Raress96_ on X"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://www.linkedin.com/in/raress96/"
        target="_blank"
        icon="i-simple-icons-linkedin"
        aria-label="Raress96 on Linkedin"
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
