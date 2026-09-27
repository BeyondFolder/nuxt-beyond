<script setup lang="ts">
import { createProjectAvatar } from '~/utils/avatar';
import type { EmbedProject, ProjectConfiguration } from '#shared/types';
import ProseStreamPre from '~/components/prose/PreStream.vue';
import type { DefineComponent } from 'vue';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const components = {
  pre: ProseStreamPre as unknown as DefineComponent,
};

const props = defineProps<{
  initialQuestions?: string[];
  projectName?: string;
  projectId: string;
  project: EmbedProject;
}>();

const input = ref('');
const loading = ref(false);
const chat = ref<any>(null);
const previousChat = ref<any>(null);
const errorMessage = ref<string | null>(null);

const config = computed(() => (props.project?.configuration as ProjectConfiguration) || {});

const primaryColor = computed(() => config.value?.appearance?.primaryColor || THEME_PRIMARY_COLOR);

async function tryGetPreviousChat() {
  const embedSession = getSession();

  if (!embedSession) {
    return;
  }

  loading.value = true;

  try {
    const data = await $fetch(`/api/embed/chats?projectId=${props.projectId}`, {
      credentials: 'include',
      headers: {
        'X-Embed-Session': embedSession,
      },
    });

    previousChat.value = data;
  } catch (error) {
    console.error('Failed to fetch chat:', error);
  } finally {
    loading.value = false;
  }
}

onNuxtReady(async () => {
  await tryGetPreviousChat();
});

const { saveSession, getSession } = useEmbedSession(props.projectId);
const { requestStorageAccess } = useStorageAccess();

async function createChat(prompt: string) {
  input.value = prompt;
  loading.value = true;
  errorMessage.value = null;

  try {
    let sessionToken: string | null = null;

    const response = await $fetch.raw(`/api/embed/chats?projectId=${props.projectId}`, {
      method: 'POST',
      body: { input: prompt },
      credentials: 'include',
      onResponse({ response }) {
        sessionToken = response.headers.get('X-Embed-Session');
      },
    });

    if (sessionToken) {
      await requestStorageAccess();

      saveSession(sessionToken);
    }

    chat.value = response._data;
    previousChat.value = null;
  } catch (error: any) {
    console.error('Failed to create chat:', error);
    if (error.statusCode === 429) {
      errorMessage.value =
        error.data?.message || error.message || 'Chatbot is currently unavailable. Please contact the site owner.';
    } else {
      errorMessage.value = 'Failed to start chat. Please try again.';
    }
  } finally {
    loading.value = false;
  }
}

function handleSubmit(event: Event) {
  event.preventDefault();
  if (input.value.trim()) {
    createChat(input.value.trim());
  }
}

const welcomeMessages = computed(() => [
  {
    id: 'welcome-1',
    role: 'assistant' as const,
    parts: [
      {
        type: 'text' as const,
        text: `Hi there! 👋 Welcome to ${props.projectName || 'our chat'}. How can I help you today?`,
      },
    ],
  },
]);

const quickChats = computed(() => {
  if (props.initialQuestions && props.initialQuestions.length > 0) {
    return props.initialQuestions.map((question) => ({
      label: question,
      icon: 'i-lucide-message-circle',
    }));
  }

  return [];
});

const {
  public: { siteUrl },
} = useRuntimeConfig();
</script>

<template>
  <div class="h-full flex flex-col overflow-x-hidden">
    <div class="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
      <template v-if="!chat">
        <div class="flex-1 flex flex-col p-4">
          <UChatMessages
            :messages="welcomeMessages"
            :assistant="{
              avatar: {
                ...createProjectAvatar(project, siteUrl),
                style: { backgroundColor: primaryColor },
              },
              variant: 'outline',
              side: 'left',
            }"
            :should-scroll-to-bottom="false"
            :ui="{
              root: 'p-0',
            }"
          >
            <template #content="{ message }">
              <div class="space-y-4">
                <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
                  <MDCCached
                    v-if="part.type === 'text'"
                    :value="part.text"
                    :cache-key="`${message.id}-${index}`"
                    :components="components"
                    :parser-options="{ highlight: false }"
                    class="*:first:mt-0 *:my-3 *:last:mb-0 *:leading-snug text-sm"
                  />
                </template>
              </div>
            </template>
          </UChatMessages>

          <div v-if="quickChats.length > 0" class="mt-auto flex flex-wrap gap-2 justify-end p-4">
            <UButton
              v-for="quickChat in quickChats"
              :key="quickChat.label"
              :label="quickChat.label"
              :icon="quickChat.icon"
              size="sm"
              color="neutral"
              variant="soft"
              class="rounded-full cursor-pointer"
              :disabled="!!errorMessage"
              @click="createChat(quickChat.label)"
            />
          </div>

          <UAlert v-if="errorMessage" color="error" variant="soft" :title="errorMessage" icon="i-lucide-alert-circle" />
        </div>

        <UChatPrompt
          v-model="input"
          :loading="loading"
          :disabled="!!errorMessage"
          placeholder="Ask me anything..."
          variant="outline"
          class="mx-auto w-[90%] rounded-2xl mb-2"
          @submit="handleSubmit"
        >
          <template v-if="previousChat && !errorMessage" #footer>
            <UButton
              :label="`Resume Previous Chat ${previousChat.title ? '(' + previousChat.title + ')' : ''}`"
              icon="i-lucide-history"
              size="sm"
              color="primary"
              variant="soft"
              class="rounded-full cursor-pointer ml-auto"
              @click="chat = previousChat"
            />
          </template>
          <UChatPromptSubmit
            color="neutral"
            class="rounded-full cursor-pointer"
            :style="{ backgroundColor: primaryColor }"
          />
        </UChatPrompt>
      </template>
      <EmbedMainChat
        v-else
        :chat="chat"
        :project-name="projectName"
        :project-id="projectId"
        :project="project"
        @back="
          (chatData) => {
            previousChat = chatData;
            chat = null;
          }
        "
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.group\/message [role='article'] > div > div) {
  min-height: 0 !important;
}
</style>
