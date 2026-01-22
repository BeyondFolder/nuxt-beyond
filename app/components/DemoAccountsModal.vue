<script setup lang="ts">
import { DEMO_CONFIG } from '~~/shared/demo';

const isOpen = defineModel<boolean>('open', { default: false });

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    useToast().add({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      color: 'success',
    });
  } catch (error) {
    useToast().add({
      title: 'Failed to copy',
      description: 'Please copy manually',
      color: 'error',
    });
  }
};
</script>

<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Demo Accounts
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          title="Demo Mode"
          description="This is a demo environment. Use one of the accounts below to explore NuxtBeyond's features."
        />

        <div class="space-y-4">
          <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                  Admin Account
                </h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Full access to all features and settings
                </p>
              </div>
              <UBadge color="primary" variant="subtle">
                Admin
              </UBadge>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <code class="text-sm text-neutral-700 dark:text-neutral-300">{{ DEMO_CONFIG.adminEmail }}</code>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-copy"
                  @click="copyToClipboard(DEMO_CONFIG.adminEmail, 'Email')"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <code class="text-sm text-neutral-700 dark:text-neutral-300">{{ DEMO_CONFIG.password }}</code>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-copy"
                  @click="copyToClipboard(DEMO_CONFIG.password, 'Password')"
                />
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                  Member Account
                </h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Limited access, can view and use basic features
                </p>
              </div>
              <UBadge color="neutral" variant="subtle">
                Member
              </UBadge>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <code class="text-sm text-neutral-700 dark:text-neutral-300">{{ DEMO_CONFIG.memberEmail }}</code>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-copy"
                  @click="copyToClipboard(DEMO_CONFIG.memberEmail, 'Email')"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded">
                <code class="text-sm text-neutral-700 dark:text-neutral-300">{{ DEMO_CONFIG.password }}</code>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-copy"
                  @click="copyToClipboard(DEMO_CONFIG.password, 'Password')"
                />
              </div>
            </div>
          </div>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          description="Limited to 5 AI conversations per day to manage demo costs."
        />
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="primary"
            @click="isOpen = false"
          >
            Got it
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
