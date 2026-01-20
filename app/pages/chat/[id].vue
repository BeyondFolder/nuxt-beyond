<script setup lang="ts">
import type { DefineComponent } from 'vue';
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { getTextFromMessage } from '@nuxt/ui/utils/ai';
import ProseStreamPre from '~/components/prose/PreStream.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

const components = {
  pre: ProseStreamPre as unknown as DefineComponent,
};

const route = useRoute();
const toast = useToast();

const { data, error } = await useFetch(`/api/chat/${route.params.id}`, {
  cache: 'force-cache',
});

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found' });
}

useSeoMeta({
  title: data.value.title || 'AI Chat',
});

const input = ref('');

const chat = new Chat({
  id: data.value.id,
  messages: data.value.messages,
  transport: new DefaultChatTransport({
    api: `/api/chat/${data.value.id}`,
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      refreshNuxtData('user-chats');
    }
  },
  onError(err) {
    const { message } = typeof err.message === 'string' && err.message[0] === '{' ? JSON.parse(err.message) : err;
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0,
    });
  },
});

async function handleSubmit(e: Event) {
  e.preventDefault();
  if (input.value.trim()) {
    chat.sendMessage({
      text: input.value,
    });
    input.value = '';
  }
}

const copied = ref(false);

function copy(_: MouseEvent, message: UIMessage) {
  navigator.clipboard.writeText(getTextFromMessage(message));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onMounted(() => {
  if (data.value?.messages.length === 1) {
    chat.regenerate();
  }
});
</script>

<template>
  <UDashboardPanel id="chat" class="relative" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :assistant="
            chat.status !== 'streaming'
              ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] }
              : { actions: [] }
          "
          :spacing-offset="160"
          class="pt-4 sm:pt-6 pb-4 sm:pb-6"
        >
          <template #content="{ message }">
            <template
              v-for="(part, index) in message.parts"
              :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
            >
              <UButton
                v-if="part.type === 'reasoning' && part.state !== 'done'"
                label="Thinking..."
                variant="link"
                color="neutral"
                class="p-0"
                loading
              />
              <MDCCached
                v-else-if="part.type === 'text'"
                :value="part.text"
                :cache-key="`${message.id}-${index}`"
                :components="components"
                :parser-options="{ highlight: false }"
                class="*:first:mt-0 *:last:mb-0"
              />
            </template>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          :ui="{ base: 'px-1.5' }"
          placeholder="Continue the conversation..."
          @submit="handleSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-1" />
            <UChatPromptSubmit
              :status="chat.status"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
