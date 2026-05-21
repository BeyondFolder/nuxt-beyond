<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { ProjectConfiguration } from '#shared/types';
import { THEME_PRIMARY_COLOR } from '#shared/constants';
import { generateIframeCode, generateLoaderCode } from '~/utils/embedCode';

defineRouteRules({
  prerender: false,
});

const { data: dashboardData, refresh: refreshDashboard } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

if (!isAdmin.value) {
  navigateTo('/configuration/knowledge');
}

const { handleError, showSuccess } = useErrorHandling();
const { copy } = useClipboard();

const schema = z.object({
  allowedDomains: z.string().min(1, 'Enter at least one domain'),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color')
    .optional(),
  position: z.enum(['bottom-right', 'bottom-left']).optional(),
  logo: z.any().optional(),
  initialQuestion1: z.string().optional(),
  initialQuestion2: z.string().optional(),
  initialQuestion3: z.string().optional(),
  customPrompt: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const currentConfig = computed(() => (dashboardData.value.currentProject?.configuration as ProjectConfiguration) || {});

const state = ref<Schema>({
  allowedDomains: currentConfig.value.security?.allowedDomains?.join('\n') || '',
  primaryColor: currentConfig.value.appearance?.primaryColor || THEME_PRIMARY_COLOR,
  position: currentConfig.value.appearance?.position || 'bottom-right',
  logo: undefined,
  initialQuestion1: currentConfig.value.chat?.initialQuestions?.[0] || '',
  initialQuestion2: currentConfig.value.chat?.initialQuestions?.[1] || '',
  initialQuestion3: currentConfig.value.chat?.initialQuestions?.[2] || '',
  customPrompt: currentConfig.value.chat?.customPrompt || '',
});

const logoUrl = ref<string | null>(
  currentConfig.value.appearance?.logo ? `/projects/${dashboardData.value.currentProject?.id}/logo` : null
);

const isLoading = ref(false);
const saveTimeout = ref<NodeJS.Timeout | null>(null);

watch(currentConfig, (newConfig) => {
  state.value.allowedDomains = newConfig.security?.allowedDomains?.join('\n') || '';
  state.value.primaryColor = newConfig.appearance?.primaryColor || THEME_PRIMARY_COLOR;
  state.value.position = newConfig.appearance?.position || 'bottom-right';
  state.value.initialQuestion1 = newConfig.chat?.initialQuestions?.[0] || '';
  state.value.initialQuestion2 = newConfig.chat?.initialQuestions?.[1] || '';
  state.value.initialQuestion3 = newConfig.chat?.initialQuestions?.[2] || '';
  state.value.customPrompt = newConfig.chat?.customPrompt || '';
  logoUrl.value = newConfig.appearance?.logo ? `/projects/${dashboardData.value.currentProject?.id}/logo` : null;
});

watch(
  state,
  () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value);
    }
    saveTimeout.value = setTimeout(() => {
      saveConfiguration();
    }, 1_000);
  },
  { deep: true }
);

function formatDomains(domainsText: string): string[] {
  return domainsText
    .split('\n')
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0)
    .map((domain) => {
      domain = domain.replace(/^https?:\/\//, '');
      domain = domain.replace(/^www\./, '');
      domain = domain.replace(/\/.*$/, '');
      return domain;
    })
    .filter((domain) => domain.length > 0);
}

const toast = useToast();

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Demo Mode',
    description: 'Editing project configuration is disabled',
    color: 'info',
  });
}

function handleAppearanceUpdate(data: any) {
  if (data.primaryColor !== undefined) {
    state.value.primaryColor = data.primaryColor;
  }
  if (data.position !== undefined) {
    state.value.position = data.position;
  }
  if (data.logo !== undefined) {
    state.value.logo = data.logo;
  }
}

function handleChatUpdate(data: any) {
  state.value.initialQuestion1 = data.initialQuestion1 || '';
  state.value.initialQuestion2 = data.initialQuestion2 || '';
  state.value.initialQuestion3 = data.initialQuestion3 || '';
  state.value.customPrompt = data.customPrompt || '';
}

function handleSecurityUpdate(allowedDomains: string) {
  state.value.allowedDomains = allowedDomains;
}

const loaderCode = computed(() => {
  if (!dashboardData.value?.currentProject?.id) {
    return '';
  }

  return generateLoaderCode({
    projectId: dashboardData.value.currentProject.id,
    primaryColor: currentConfig.value?.appearance?.primaryColor,
    position: currentConfig.value?.appearance?.position,
    logo: logoUrl.value,
  });
});

const iframeCode = computed(() => {
  if (!dashboardData.value?.currentProject?.id) {
    return '';
  }

  return generateIframeCode(dashboardData.value.currentProject.id);
});

async function copyLoaderCode() {
  try {
    await copy(loaderCode.value);
    showSuccess('Embed code copied to clipboard');
  } catch (error) {
    handleError(error, 'Failed to copy embed code');
  }
}

async function copyIframeCode() {
  try {
    await copy(iframeCode.value);
    showSuccess('iFrame code copied to clipboard');
  } catch (error) {
    handleError(error, 'Failed to copy iframe code');
  }
}
</script>

<template>
  <div class="mx-auto">
    <div class="mb-8 max-w-7xl mx-auto">
      <h2 class="text-xl font-semibold mb-2">Project Customization</h2>
      <p class="text-primary">Customize your project's appearance, behavior and configure security settings.</p>
    </div>

    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
          <UPageCard variant="naked">
            <div class="flex justify-between items-center">
              <UButton variant="ghost" color="neutral" to="/configuration/knowledge">
                <UIcon name="i-lucide-arrow-left" />
                Back to Knowledge Base
              </UButton>

              <UButton type="submit" :loading="isLoading" trailing-icon="i-lucide-check"> Save Configuration </UButton>
            </div>
          </UPageCard>

          <ConfigurationCustomizationAppearance
            :initial-primary-color="state.primaryColor"
            :initial-position="state.position"
            :initial-logo-url="logoUrl"
            @update="handleAppearanceUpdate"
          />

          <ConfigurationCustomizationChatSettings
            :initial-question1="state.initialQuestion1"
            :initial-question2="state.initialQuestion2"
            :initial-question3="state.initialQuestion3"
            :initial-custom-prompt="state.customPrompt"
            @update="handleChatUpdate"
          />

          <ConfigurationCustomizationSecuritySettings
            :initial-allowed-domains="state.allowedDomains"
            @update="handleSecurityUpdate"
          />

          <UPageCard variant="naked">
            <div class="flex justify-between items-center">
              <UButton variant="ghost" color="neutral" to="/configuration/knowledge">
                <UIcon name="i-lucide-arrow-left" />
                Back to Knowledge Base
              </UButton>

              <UButton type="submit" :loading="isLoading" trailing-icon="i-lucide-check"> Save Configuration </UButton>
            </div>
          </UPageCard>
        </UForm>
      </div>

      <div class="space-y-6">
        <ConfigurationCustomizationWidgetPreview
          v-if="dashboardData.currentProject?.id"
          :project-id="dashboardData.currentProject.id"
          :primary-color="currentConfig.appearance?.primaryColor || ''"
          :position="currentConfig.appearance?.position"
          :logo="logoUrl"
        />

        <UPageCard :ui="{ header: 'mb-0' }">
          <template #header>
            <h3 class="font-semibold">Embed Code</h3>
          </template>

          <UTabs
            :items="[
              { label: 'Script', slot: 'script', icon: 'i-lucide-code' },
              { label: 'iFrame (Advanced)', slot: 'iframe', icon: 'i-lucide-frame' },
            ]"
            :ui="
              {
                list: {
                  base: 'bg-transparent',
                  marker: {
                    base: 'bg-primary',
                  },
                },
              } as any
            "
          >
            <template #script>
              <div class="space-y-3 pt-4">
                <p class="text-sm text-neutral">
                  Copy this code and paste it into your website's HTML to embed the project:
                </p>

                <div class="relative">
                  <pre
                    class="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded border whitespace-pre-wrap break-all"
                  ><code>{{ loaderCode }}</code></pre>
                  <UButton
                    size="xs"
                    variant="solid"
                    icon="i-lucide-copy"
                    class="absolute top-2 right-2"
                    @click="copyLoaderCode"
                  >
                    Copy
                  </UButton>
                </div>
              </div>
            </template>

            <template #iframe>
              <div class="space-y-3 pt-4">
                <p class="text-sm text-neutral">Use this iFrame code for direct integration (advanced users):</p>

                <div class="relative">
                  <pre
                    class="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded border whitespace-pre-wrap break-all"
                  ><code>{{ iframeCode }}</code></pre>
                  <UButton
                    size="xs"
                    variant="solid"
                    icon="i-lucide-copy"
                    class="absolute top-2 right-2"
                    @click="copyIframeCode"
                  >
                    Copy
                  </UButton>
                </div>
              </div>
            </template>
          </UTabs>
        </UPageCard>
      </div>
    </div>
  </div>
</template>
