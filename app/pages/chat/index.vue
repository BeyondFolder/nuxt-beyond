<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

useSeoMeta({
  title: 'AI Chat',
  description: 'Start a new AI chat conversation',
});

const input = ref('');
const loading = ref(false);
const chatId = crypto.randomUUID();

async function createChat(prompt: string) {
  input.value = prompt;
  loading.value = true;

  const parts = [{ type: 'text', text: prompt }];

  const chat = await $fetch('/api/chat', {
    method: 'POST',
    body: {
      id: chatId,
      message: {
        role: 'user',
        parts,
      },
    },
  });

  refreshNuxtData('user-chats');
  navigateTo(`/chat/${chat?.id}`);
}

async function onSubmit() {
  if (!input.value.trim()) {
    return;
  }
  await createChat(input.value);
}

const quickChats = [
  {
    label: 'Explain quantum computing',
    icon: 'i-lucide-atom',
  },
  {
    label: 'Help me write a Vue composable',
    icon: 'i-logos-vue',
  },
  {
    label: 'Summarize a long article',
    icon: 'i-lucide-file-text',
  },
  {
    label: 'Debug my JavaScript code',
    icon: 'i-logos-javascript',
  },
  {
    label: 'Create a marketing email',
    icon: 'i-lucide-mail',
  },
  {
    label: 'Plan a project roadmap',
    icon: 'i-lucide-map',
  },
];
</script>

<template>
  <UDashboardPanel id="chat-home" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          How can I help you today?
        </h1>

        <UChatPrompt
          v-model="input"
          :status="loading ? 'streaming' : 'ready'"
          class="[view-transition-name:chat-prompt]"
          variant="subtle"
          :ui="{ base: 'px-1.5' }"
          placeholder="Ask me anything..."
          @submit="onSubmit"
        >
          <template #footer>
            <div class="flex items-center gap-1" />
            <UChatPromptSubmit color="neutral" size="sm" />
          </template>
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickChat in quickChats"
            :key="quickChat.label"
            :icon="quickChat.icon"
            :label="quickChat.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            @click="createChat(quickChat.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
