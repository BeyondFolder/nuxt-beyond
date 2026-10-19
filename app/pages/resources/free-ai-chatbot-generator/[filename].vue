<script setup lang="ts">
import type { UIMessage } from 'ai';
import { getTextFromMessage } from '@nuxt/ui/utils/ai';
import { useClipboard } from '@vueuse/core';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const clipboard = useClipboard();
const route = useRoute();
const filename = route.params.filename as string;

const decodedFilename = decodeURIComponent(filename);

useSeoMeta({
  title: `Free AI Chatbot Preview - ${decodedFilename} | NuxtBeyond`,
  description: 'Test your AI-powered chatbot trained on your website content. Free tool to preview customer support automation - no sign-up, no code required.',
  robots: 'noindex, nofollow',
});

const isLoading = ref(true);
const contentExists = ref(false);
const appName = ref('');
const appIcon = ref('');
let pollInterval: ReturnType<typeof setInterval> | undefined;

const primaryColor = THEME_PRIMARY_COLOR;
const isProjectOpen = ref(true);

onMounted(checkContentStatus);

onUnmounted(() => {
  clearInterval(pollInterval);
});

async function checkContentStatus() {
  try {
    const response = await $fetch<{ isProcessed: boolean; appName?: string; appIcon?: string }>(
      `/api/resources/free-ai-chatbot-generator/${encodeURIComponent(filename)}`
    );

    if (response.isProcessed) {
      isLoading.value = false;
      contentExists.value = true;
      appName.value = response.appName || decodedFilename.replace(/^\d+-/, '').replace('.html', '');
      appIcon.value = response.appIcon || '';

      clearInterval(pollInterval);
      pollInterval = undefined;
    } else if (!pollInterval) {
      pollInterval = setInterval(checkContentStatus, 10_000);
    }
  } catch (error) {
    console.error('Error checking content status:', error);

    clearInterval(pollInterval);
    pollInterval = undefined;
    isLoading.value = false;
    contentExists.value = false;
  }
}

const input = ref('');
const messages = ref<UIMessage[]>([]);
const chatStatus = ref<'submitted' | 'error' | 'ready'>('ready');
const chatTurnstile = ref();
const chatTurnstileToken = ref('');
const { handleError } = useErrorHandling();

const allMessages = computed<UIMessage[]>(() => [
  {
    id: 'welcome-1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: `Hi there! 👋 Welcome to ${appName.value || 'our chat'}. How can I help you today?`,
      },
    ],
  },
  ...messages.value,
]);

async function handleChatSubmit(e: Event) {
  e.preventDefault();
  if (!input.value.trim() || !chatTurnstileToken.value) {
    return;
  }

  const currentQuery = input.value;

  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    parts: [{ type: 'text', text: currentQuery }],
  });
  chatStatus.value = 'submitted';
  input.value = '';

  try {
    const response = await $fetch<{ response: string }>(`/api/resources/free-ai-chatbot-generator/${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: {
        query: currentQuery,
        turnstileToken: chatTurnstileToken.value,
      },
    });

    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      parts: [{ type: 'text', text: response.response }],
    });
    chatStatus.value = 'ready';
  } catch (error) {
    chatStatus.value = 'error';
    handleError(error, 'Failed to get AI response');

    setTimeout(() => {
      chatStatus.value = 'ready';
    }, 3000);
  } finally {
    chatTurnstile.value?.reset();
  }
}
</script>

<template>
  <div class="bg-muted flex flex-col">
    <div class="w-full bg-default shadow-sm border-b border-default">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <UButton
            to="/resources/free-ai-chatbot-generator"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            size="sm"
          >
            Back to Generator
          </UButton>

          <div class="flex gap-2">
            <UButton
              :to="`https://x.com/intent/tweet?text=${encodeURIComponent(`Just tested an AI chatbot for ${appName || 'my business'} using NuxtBeyond by @raress96`)}`"
              target="_blank"
              variant="ghost"
              color="neutral"
              icon="i-simple-icons-x"
              size="sm"
            >
              Share
            </UButton>

            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-copy"
              size="sm"
              @click="clipboard.copy(`https://nuxtbeyond.com/resources/free-ai-chatbot-generator/${encodeURIComponent(filename)}`)"
            >
              Copy Link
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div class="w-full max-w-lg">
        <UCard v-if="isLoading" class="shadow-xl">
          <div class="text-center p-12 space-y-4">
            <UIcon name="i-lucide-loader" class="text-primary text-4xl animate-spin mx-auto" />
            <h3 class="text-xl font-semibold">Processing Your Content</h3>
            <p class="text-neutral">Our AI is analyzing the web page. This usually takes a few minutes.</p>
          </div>
        </UCard>

        <UCard v-else-if="!contentExists" class="shadow-xl">
          <div class="text-center p-12 space-y-4">
            <UIcon name="i-lucide-file-x" class="text-error text-4xl mx-auto" />
            <h3 class="text-xl font-semibold">Content Not Found</h3>
            <p class="text-neutral">The requested content could not be found or may have expired.</p>
            <UButton to="/resources/free-ai-chatbot-generator" icon="i-lucide-plus" class="mt-4">
              Try Another Page
            </UButton>
          </div>
        </UCard>

        <div
          v-else
          class="relative border border-default rounded-lg p-4 bg-muted min-h-[790px] sm:min-h-[770px] min-w-full sm:min-w-[454px] mx-auto"
        >
          <div class="max-w-sm text-center mx-auto mb-5">
            <div class="px-4 py-2 bg-default/80 backdrop-blur-sm rounded-lg shadow-sm mx-auto">
              <p class="text-sm text-muted">👇 This is how your chatbot will look on your website</p>
            </div>
          </div>

          <button
            type="button"
            :aria-label="isProjectOpen ? 'Close chat' : 'Open chat'"
            class="absolute w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 z-10 bottom-4 right-8"
            :style="{ backgroundColor: primaryColor }"
            @click="isProjectOpen = !isProjectOpen"
          >
            <UIcon v-if="isProjectOpen" name="i-lucide-x" class="size-8 text-white" />
            <img v-else :src="appIcon || '/images/logo.png'" alt="Logo" class="size-10 object-contain">
          </button>

          <div class="flex items-end justify-center h-full">
            <div class="relative w-full sm:w-[420px]">
              <div
                v-show="isProjectOpen"
                class="bg-default overflow-hidden rounded-none sm:rounded-2xl w-full h-[600px] mb-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
              >
                <div
                  class="flex items-center justify-between px-4 py-1 rounded-t-xl"
                  :style="{ backgroundColor: primaryColor }"
                >
                  <div class="flex items-center gap-2 py-2">
                    <p class="font-semibold text-sm text-white">{{ appName || 'Chat Support' }}</p>
                  </div>
                </div>

                <div class="flex flex-col h-[calc(100%-46px)]">
                  <div class="flex-1 overflow-y-auto p-4">
                    <UChatMessages
                      :messages="allMessages"
                      :status="chatStatus"
                      :assistant="{ avatar: appIcon ? { src: appIcon } : undefined, variant: 'outline', side: 'left' }"
                      :user="{ variant: 'subtle', side: 'right' }"
                      :auto-scroll="true"
                      :should-auto-scroll="true"
                      :should-scroll-to-bottom="false"
                      :ui="{ root: 'p-0' }"
                    >
                      <template #content="{ message }">
                        <MDCCached
                          :value="getTextFromMessage(message)"
                          :cache-key="message.id"
                          unwrap="p"
                          :parser-options="{ highlight: false }"
                          class="text-sm"
                        />
                      </template>
                    </UChatMessages>
                  </div>

                  <div class="px-4 space-y-3">
                    <UChatPrompt
                      v-model="input"
                      placeholder="Ask me anything..."
                      variant="outline"
                      class="rounded-2xl"
                      :disabled="!chatTurnstileToken || chatStatus === 'submitted'"
                      @submit="handleChatSubmit"
                    >
                      <UChatPromptSubmit class="rounded-full" :style="{ backgroundColor: primaryColor }" />
                    </UChatPrompt>
                    <div class="flex justify-center">
                      <NuxtTurnstile ref="chatTurnstile" v-model="chatTurnstileToken" />
                    </div>
                  </div>

                  <div class="text-center py-2">
                    <ULink
                      to="https://nuxtbeyond.com"
                      target="_blank"
                      class="text-sm italic text-dimmed hover:text-muted no-underline"
                    >
                      Powered by <span class="font-semibold">NuxtBeyond</span>
                    </ULink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-3xl mx-auto px-4 pb-8">
      <UCard class="shadow-lg">
        <div class="text-center space-y-4 py-6">
          <div>
            <h2 class="text-2xl font-bold mb-2">Want to embed a chatbot like this on your website?</h2>
            <p class="text-neutral">
              NuxtBeyond gives you the embeddable chat widget, AI Search knowledge base, auth and payments out of the box.
            </p>
          </div>

          <UButton to="/#pricing" size="xl" icon="i-lucide-rocket" color="primary">Get NuxtBeyond</UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
