<script setup lang="ts">
import { capitalize } from '#shared/utils';

const props = defineProps<{
  questionId: string;
  projectId: string;
  supportsSelfLearning: boolean;
}>();

const emit = defineEmits<{
  answered: [];
  close: [];
}>();

const { data: questionDataRaw } = await useFetch(
  () => `/api/projects/${props.projectId}/questions/${props.questionId}`,
  {
    key: `question-detail-${props.projectId}-${props.questionId}`,
    watch: [() => props.questionId, () => props.projectId],
  }
);

const questionData = computed(() => questionDataRaw.value as any);

const replyText = ref('');
const isSubmitting = ref(false);
const isClosing = ref(false);
const isDeleting = ref(false);
const toast = useToast();

async function submitAnswer() {
  toast.add({
    title: 'Demo Mode',
    description: 'Question replies are disabled in demo mode.',
    color: 'info',
  });
}

const hasReplies = computed(() => {
  return questionData.value?.replies && questionData.value.replies.length > 0;
});

const canReply = computed(() => {
  return questionData.value?.status === 'pending';
});

const canDelete = computed(() => {
  return questionData.value?.status === 'answered' || questionData.value?.status === 'closed';
});

async function closeQuestion() {
  toast.add({
    title: 'Demo Mode',
    description: 'Closing questions is disabled in demo mode.',
    color: 'info',
  });
}

async function confirmDeleteQuestion() {
  toast.add({
    title: 'Demo Mode',
    description: 'Deleting questions is disabled in demo mode.',
    color: 'info',
  });
}
</script>

<template>
  <UDashboardPanel v-if="questionData" id="question-detail">
    <template #header>
      <UDashboardNavbar :title="questionData.userName || questionData.userEmail">
        <template #leading>
          <UButton icon="i-lucide-x" variant="ghost" size="xs" color="neutral" @click="emit('close')" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Customer Information</h3>
              <UBadge
                :label="questionData.status === 'added_to_rag' ? 'In Knowledge Base' : capitalize(questionData.status)"
                :color="
                  questionData.status === 'pending'
                    ? 'warning'
                    : questionData.status === 'answered'
                      ? 'success'
                      : questionData.status === 'added_to_rag'
                        ? 'info'
                        : questionData.status === 'closed'
                          ? 'error'
                          : 'neutral'
                "
                variant="subtle"
              />
            </div>
          </template>

          <div class="space-y-3">
            <div>
              <p><strong>Question:</strong> {{ questionData.initialQuestion }}</p>
            </div>
            <div v-if="questionData.userName">
              <label class="text-xs font-medium text-neutral">Name</label>
              <p class="text-sm">{{ questionData.userName }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral">Email</label>
              <p class="text-sm">{{ questionData.userEmail }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral">Submitted</label>
              <p class="text-sm">{{ formatDate(questionData.createdAt) }}</p>
            </div>
          </div>
        </UCard>

        <UCard v-if="questionData.chat">
          <template #header>
            <h3 class="font-semibold">Chat History</h3>
          </template>

          <div class="space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="message in questionData.chat.messages"
              :key="message.id"
              :class="['flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start']"
            >
              <div
                v-if="message.parts.filter((p: any) => p.type === 'text').length > 0"
                :class="[
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.role === 'user' ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-800',
                ]"
              >
                <p class="text-sm whitespace-pre-wrap">
                  {{
                    message.parts
                      .filter((p: any) => p.type === 'text')
                      .map((p: any) => p.text)
                      .join(' ')
                  }}
                </p>
                <p class="text-xs opacity-75 mt-1">{{ formatDate(message.createdAt) }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard v-if="hasReplies">
          <template #header>
            <h3 class="font-semibold">Conversation</h3>
          </template>

          <div class="space-y-4">
            <div v-for="reply in questionData.replies" :key="reply.id" class="border-l-2 border-primary pl-4">
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-lucide-user-circle" class="text-primary" />
                <p class="text-sm font-medium">{{ reply.user?.email || 'Team member' }}</p>
              </div>
              <p class="text-sm whitespace-pre-wrap">{{ reply.replyText }}</p>
              <p class="text-xs text-neutral mt-1">{{ formatDate(reply.createdAt) }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <div v-if="canReply" class="shrink-0 pb-4 px-4 sm:px-6">
        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-reply" class="size-5" />
              <span>Reply to {{ questionData.userName || questionData.userEmail }}</span>
            </div>
          </template>

          <UForm class="w-full" @submit="submitAnswer">
            <UTextarea
              v-model="replyText"
              color="neutral"
              variant="none"
              autoresize
              placeholder="Write your answer..."
              :rows="4"
              required
              disabled
              :ui="{ base: 'p-0 resize-none', root: 'w-full' }"
            />
          </UForm>

          <template #footer>
            <div class="flex items-center justify-between">
              <UButton
                color="error"
                variant="outline"
                icon="i-lucide-x"
                :loading="isClosing"
                @click="closeQuestion"
              >
                Close Question
              </UButton>
              <UButton type="submit" :loading="isSubmitting" :disabled="!replyText.trim()" @click="submitAnswer">
                Send Answer
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
      <div v-else-if="questionData.answer" class="shrink-0 pb-4 px-4 sm:px-6">
        <UCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-book-check" class="size-5" />
              <span>Knowledge Base Entry</span>
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="text-xs font-medium text-neutral">Question</label>
              <p class="text-sm whitespace-pre-wrap">{{ questionData.initialQuestion }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-neutral">Answer</label>
              <p class="text-sm whitespace-pre-wrap">{{ questionData.answer }}</p>
            </div>
          </div>
        </UCard>
      </div>
      <div v-else-if="canDelete" class="shrink-0 pb-4 px-4 sm:px-6">
        <UButton
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          :loading="isDeleting"
          @click="confirmDeleteQuestion"
        >
          Delete Question
        </UButton>
      </div>

      <div v-if="!supportsSelfLearning && (questionData.status === 'answered' || questionData.status === 'added_to_rag')" class="shrink-0 pb-4 px-4 sm:px-6">
        <UAlert
          color="warning"
          variant="soft"
          title="Upgrade to improve your AI chatbot"
          icon="i-lucide-lock"
        >
          <template #description>
            <p class="mb-3">
              Add customer questions and answers to your knowledge base automatically to continuously improve your AI agent. Upgrade to
              <UBadge :color="getPlanColor('boilerplate')" variant="subtle" size="lg" class="capitalize">
                Pro Plan
              </UBadge>
              or higher to enable self-learning.
            </p>
          </template>
          <template #actions>
            <UButton to="/dashboard/billing" color="warning" variant="solid">
              Upgrade Plan
            </UButton>
          </template>
        </UAlert>
      </div>
    </template>
  </UDashboardPanel>

  <UDashboardPanel v-else>
    <div class="flex flex-col items-center justify-center h-full text-center p-8">
      <UIcon name="i-lucide-loader-circle" class="text-4xl text-neutral animate-spin mb-4" />
      <p class="text-neutral">Loading question details...</p>
    </div>
  </UDashboardPanel>
</template>
