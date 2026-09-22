<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import { computed, type DefineComponent, onMounted, ref } from 'vue';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { getTextFromMessage } from '#ui/utils/ai';
import { createProjectAvatar } from '~/utils/avatar';
import type { EmbedProject, ProjectConfiguration, Chat as DbChat } from '#shared/types';
import ProseStreamPre from '../../components/prose/PreStream.vue';
import { THEME_PRIMARY_COLOR } from '#shared/constants';

const components = {
  pre: ProseStreamPre as unknown as DefineComponent,
};

const props = defineProps<{
  chat: DbChat & { messages: UIMessage[] };
  projectName?: string;
  projectId: string;
  project: EmbedProject;
}>();

const { chat, projectId } = props;

const config = computed(() => (props.project?.configuration as ProjectConfiguration) || {});

const primaryColor = computed(() => config.value?.appearance?.primaryColor || THEME_PRIMARY_COLOR);

const emit = defineEmits<{
  back: [chat: typeof props.chat];
}>();

const input = ref('');

const { getSession } = useEmbedSession(projectId);

const toast = useToast();

const aiChat = new Chat({
  id: chat.id,
  transport: new DefaultChatTransport({
    api: `/api/embed/chats/${chat.id}?projectId=${projectId}`,
    credentials: 'include',
    headers: (): Record<string, string> => {
      const session = getSession();
      if (session) {
        return { 'X-Embed-Session': session };
      }
      return {};
    },
  }),
  messages: chat.messages || [],
  onError: (error: Error) => {
    console.error('There has been an error', error);
    const messageJson = JSON.parse(error.message);
    toast.add({
      title: 'Error',
      description: messageJson?.message || 'An error occurred while processing your message',
      color: 'error',
    });
  },
});

const messages = computed(() => {
  if (!aiChat.messages) {
    return [];
  }

  return aiChat.messages; // Use the AI SDK messages directly
});
const handleSubmit = (e: Event) => {
  e.preventDefault();

  aiChat.sendMessage({ text: input.value });
  input.value = '';
};
const reload = () => {
  aiChat.regenerate();
};
const stop = () => {
  aiChat.stop();
};
const status = computed(() => aiChat.status);
const error = computed(() => aiChat.error);

const copied = ref(false);

function copy(_: MouseEvent, message: UIMessage) {
  navigator.clipboard.writeText(getTextFromMessage(message));

  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onMounted(() => {
  if (chat?.messages?.length === 1) {
    reload();
  }
});

const {
  public: { siteUrl },
} = useRuntimeConfig();

const supportEmail = ref('');
const supportName = ref('');

const assistantMessages = computed(() => messages.value.filter((m) => m.role === 'assistant'));
const isRequestEmailInLastMessage = computed(() => {
  if (assistantMessages.value.length === 0) {
    return false;
  }

  const lastAssistantMessage = assistantMessages.value[assistantMessages.value.length - 1];

  return lastAssistantMessage!.parts.some((part: any) => part.type === 'tool-requestEmailForSupport');
});
const hasContactHumanSupport = computed(() => {
  if (assistantMessages.value.length === 0) {
    return false;
  }

  const lastAssistantMessage = assistantMessages.value[assistantMessages.value.length - 1];

  return lastAssistantMessage!.parts.some((part: any) => part.type === 'tool-contactHumanSupport');
});

const submitEmail = () => {
  aiChat.sendMessage({
    text: `My email is ${supportEmail.value}${supportName.value ? ` and my name is ${supportName.value}` : ''}`,
  });

  supportEmail.value = '';
  supportName.value = '';
};
</script>

<template>
  <div class="h-full flex flex-col overflow-x-hidden">
    <div class="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
      <div class="flex-1 flex flex-col p-4">
        <div class="mb-4 flex items-center gap-2">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            size="xs"
            color="neutral"
            class="cursor-pointer"
            @click="emit('back', { ...chat, messages })"
          >
            Back
          </UButton>
          <em class="text-xs ml-auto">{{ chat.title }}</em>
        </div>

        <UChatMessages
          :messages="messages"
          :status="status"
          :assistant="{
            avatar: {
              ...createProjectAvatar(project, siteUrl),
              style: { backgroundColor: primaryColor },
            },
            actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }],
            variant: 'outline',
            side: 'left',
          }"
          :user="{
            variant: 'subtle',
            side: 'right',
          }"
          :auto-scroll="true"
          :should-auto-scroll="true"
          :should-scroll-to-bottom="false"
          :ui="{
            root: 'p-0',
          }"
        >
          <template #content="{ message }">
            <div class="space-y-4">
              <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
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
                  class="*:first:mt-0 *:mt-3 [&_ul]:my-0 [&_li]:my-0 *:mb-1 *:leading-snug text-sm"
                />
                <template v-else-if="part.type === 'tool-getInformation'">
                  <p v-if="part.state !== 'output-available'" class="text-sm text-muted">
                    Searching "<em>{{ (part.input as any)?.question }}</em>"...
                  </p>
                </template>
                <template v-else-if="part.type === 'tool-requestEmailForSupport'">
                  <p v-if="!isRequestEmailInLastMessage" class="text-sm mt-0">User provided contact details.</p>
                  <UForm v-else @submit="submitEmail">
                    <p class="text-sm mb-3">Please provide contact details:</p>
                    <UInput v-model="supportEmail" type="email" placeholder="your@email.com" required class="w-full" />
                    <UInput v-model="supportName" placeholder="Your name (optional)" class="my-2 w-full" />
                    <UButton type="submit" class="flex"> Contact Support </UButton>
                  </UForm>
                </template>
                <template v-else-if="part.type === 'tool-contactHumanSupport'">
                  <p class="text-sm mt-0">Query has been forwarded to human support.</p>
                </template>
              </template>
            </div>

            <template v-if="message.role === 'assistant'">
              <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
                <template v-if="part.type === 'tool-getInformation'">
                  <div v-if="part.state === 'output-available'" class="mt-3 pt-3 border-t border-neutral-200 space-y-1">
                    <p class="text-xs text-neutral-500 font-medium">Sources:</p>
                    <div class="flex flex-wrap gap-2">
                      <UButton
                        v-for="(result, idx) in (part.output as any[])"
                        :key="`source-${idx}`"
                        :label="result.url || (result.type === 'unknown' ? 'Knowledge Base' : result.source)"
                        :icon="result.type === 'url' ? 'i-lucide-link' : 'i-lucide-file-text'"
                        size="xs"
                        color="neutral"
                        variant="soft"
                        class="rounded-full"
                        :to="result.url"
                        :target="result.url ? '_blank' : undefined"
                      />
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </template>
        </UChatMessages>
      </div>

      <UChatPrompt
        v-model="input"
        :loading="status === 'streaming'"
        :error="error"
        placeholder="Ask me anything..."
        variant="outline"
        class="mx-auto w-[90%] rounded-2xl mb-2"
        :disabled="hasContactHumanSupport"
        @submit="handleSubmit"
      >
        <UButton
          v-if="hasContactHumanSupport"
          label="Back"
          icon="i-lucide-arrow-left"
          size="sm"
          color="primary"
          variant="soft"
          class="rounded-full cursor-pointer"
          @click="emit('back', { ...chat, messages })"
        />
        <UChatPromptSubmit
          v-else
          color="neutral"
          class="rounded-full cursor-pointer"
          :style="{ backgroundColor: primaryColor }"
          @stop="stop"
          @reload="reload"
        />
      </UChatPrompt>
    </div>
  </div>
</template>
