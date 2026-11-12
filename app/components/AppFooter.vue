<script setup lang="ts">
import { GITHUB_REPO_URL } from '#shared/constants';

const columns = [
  {
    label: 'Free Tools',
    children: [
      {
        label: 'Nuxt Session Password Generator',
        to: '/resources/nuxt-session-password-generator',
      },
      {
        label: 'SaaS Ideas Generator',
        to: '/resources/saas-ideas-generator',
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
      {
        label: 'About',
        to: '/about',
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
            <div class="w-auto mx-auto mb-6 flex gap-5 justify-center grid grid-cols-4">
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

              <div class="flex">
                <a href="https://twelve.tools" target="_blank"
                  ><img
                    src="https://twelve.tools/badge0-dark.svg"
                    alt="Featured on Twelve Tools"
                    width="120"
                    height="54"
                /></a>
              </div>

              <div class="flex">
                <a href="https://wired.business" target="_blank"
                  ><img
                    src="https://wired.business/badge0-dark.svg"
                    alt="Featured on Wired Business"
                    width="120"
                    height="54"
                /></a>
              </div>

              <div class="flex">
                <a href="https://fazier.com" target="_blank"
                  ><img
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=dark"
                    width="120"
                    alt="Fazier badge"
                /></a>
              </div>

              <div class="flex">
                <a href="https://open-launch.com/projects/nuxtbeyond" target="_blank" rel="noopener">
                  <img
                    src="https://open-launch.com/api/badge/a46dd585-3a6b-4448-a327-be7bd03afa0d/featured-dark.svg"
                    alt="Featured on Open-Launch"
                    width="120"
                    height="50"
                  />
                </a>
              </div>
            </div>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <div class="flex flex-col gap-1">
        <p class="text-sm text-muted">
          Copyright © {{ new Date().getFullYear() }} Rareș Serban. NuxtBeyond is open source under the
          <ULink :to="GITHUB_REPO_URL" target="_blank" rel="noopener" class="text-primary">MIT License</ULink>.
        </p>
        <p class="text-sm text-muted">
          Also by Rareș:
          <ULink to="https://mailyond.com" target="_blank" rel="noopener" class="text-primary">Mailyond</ULink>
        </p>
      </div>
    </template>

    <template #right>
      <em class="text-xs text-ellipsis">Made By Raress96</em>
      <UButton
        :to="GITHUB_REPO_URL"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="NuxtBeyond on GitHub"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://x.com/raress96"
        target="_blank"
        icon="i-simple-icons-x"
        aria-label="raress96 on X"
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
