<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core';
import { capitalize } from '#shared/utils';
import { PLANS_CONSTANTS } from '#shared/constants';

definePageMeta({
  layout: 'dashboard',
  middleware: ['authenticated'],
});

defineRouteRules({
  prerender: false,
});

const route = useRoute();
const router = useRouter();

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });
const projectId = computed(() => dashboardData.value?.currentProject?.id);

const supportsEscalation = computed(() => {
  const planName = dashboardData.value?.currentProject?.planName;
  if (!planName) {
    return false;
  }
  return PLANS_CONSTANTS[planName]?.SUPPORT_ESCALATION || false;
});

const supportsSelfLearning = computed(() => {
  const planName = dashboardData.value?.currentProject?.planName;
  if (!planName) {
    return false;
  }
  return PLANS_CONSTANTS[planName]?.SELF_LEARNING || false;
});

watch(supportsEscalation, (value) => {
  if (!value) {
    router.push('/dashboard');
  }
}, { immediate: true });

const { data: questionsData, refresh: refreshQuestions } = await useFetch(
  () => `/api/projects/${projectId.value}/questions`,
  {
    key: `questions-${projectId.value}`,
    watch: [projectId],
  }
);

const selectedTab = ref('all');
const selectedQuestionId = ref<string | null>((route.query.questionId as string) || null);
const selectedQuestionIds = ref<Set<string>>(new Set());

watch(selectedQuestionId, (newId) => {
  if (newId) {
    router.push({ query: { ...route.query, questionId: newId } });
  } else {
    const query = { ...route.query };
    delete query.questionId;
    router.push({ query });
  }
});

const tabs = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: 'pending',
    label: 'Pending',
  },
  {
    value: 'answered',
    label: 'Answered',
  },
];

const filteredQuestions = computed(() => {
  if (!questionsData.value?.questions) {
    return [];
  }

  if (selectedTab.value === 'all') {
    return questionsData.value.questions;
  }

  return questionsData.value.questions.filter((q) => q.status === selectedTab.value);
});

const selectedQuestion = computed(() => {
  if (!selectedQuestionId.value || !questionsData.value?.questions) {
    return null;
  }

  return questionsData.value.questions.find((q) => q.id === selectedQuestionId.value);
});

watch(filteredQuestions, (newQuestions) => {
  if (selectedQuestionId.value) {
    const stillExists = newQuestions.find((q) => q.id === selectedQuestionId.value);
    if (!stillExists && newQuestions.length > 0) {
      selectedQuestionId.value = newQuestions[0]!.id;
    } else if (!stillExists) {
      selectedQuestionId.value = null;
    }
  }
});

const isQuestionPanelOpen = computed({
  get: () => !!selectedQuestion.value,
  set: (value) => {
    if (!value) {
      selectedQuestionId.value = null;
    }
  },
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller('lg');

watch(selectedTab, () => {
  selectedQuestionIds.value.clear();
});

function toggleQuestionSelection(questionId: string) {
  if (selectedQuestionIds.value.has(questionId)) {
    selectedQuestionIds.value.delete(questionId);
  } else {
    selectedQuestionIds.value.add(questionId);
  }
}

const selectedQuestions = computed(() => {
  if (!questionsData.value?.questions) {
    return [];
  }
  return questionsData.value.questions.filter(q => selectedQuestionIds.value.has(q.id));
});

const bulkActionType = computed(() => {
  if (selectedQuestions.value.length === 0) {
    return null;
  }

  const statuses = new Set(selectedQuestions.value.map(q => q.status));

  if (statuses.size === 1) {
    if (statuses.has('answered')) {
      return 'add_to_kb';
    }
    if (statuses.has('added_to_rag')) {
      return 'remove_from_kb';
    }
  }

  return null;
});

const isBulkActionLoading = ref(false);

async function handleBulkAction() {
  if (!bulkActionType.value || !projectId.value) {
    return;
  }

  isBulkActionLoading.value = true;

  try {
    const addToRag = bulkActionType.value === 'add_to_kb';
    const questionIds = Array.from(selectedQuestionIds.value);

    await $fetch(`/api/projects/${projectId.value}/questions/rag`, {
      method: 'PUT',
      body: {
        questionIds,
        addToRag,
      },
    });

    await $fetch(`/api/projects/${projectId.value}/knowledge/sync`, {
      method: 'POST',
    });

    await refreshNuxtData('api/dashboard');

    const toast = useToast();
    toast.add({
      title: addToRag ? 'Added to knowledge base' : 'Removed from knowledge base',
      description: `${selectedQuestions.value.length} question${selectedQuestions.value.length > 1 ? 's' : ''} ${addToRag ? 'added to' : 'removed from'} knowledge base`,
      color: 'success',
    });

    selectedQuestionIds.value.clear();
    await refreshQuestions();
  } catch (error: any) {
    const toast = useToast();
    toast.add({
      title: 'Failed to update questions',
      description: error.message || 'Please try again',
      color: 'error',
    });
  } finally {
    isBulkActionLoading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="questions" resizable :default-size="25" :min-size="20" :max-size="30">
    <template #header>
      <UDashboardNavbar title="Questions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge v-if="questionsData" :label="filteredQuestions.length.toString()" variant="subtle" />
        </template>

        <template #right>
          <UTabs v-model="selectedTab" :items="tabs" size="sm" class="w-64" :content="false" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="!questionsData || questionsData.questions.length === 0"
        class="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <UIcon name="i-lucide-inbox" class="text-4xl text-neutral mb-4" />
        <h3 class="text-lg font-semibold mb-2">No support questions</h3>
        <p class="text-sm text-neutral">Customer support questions will appear here</p>
      </div>

      <div v-else class="space-y-2">
        <UCard
          v-for="question in filteredQuestions"
          :key="question.id"
          :ui="{
            body: 'p-4',
            ...(selectedQuestionId === question.id
              ? {
                  ring: 'ring-2 ring-primary',
                  background: 'bg-primary-50 dark:bg-primary-950',
                }
              : {}),
          }"
        >
          <div class="flex items-start gap-3">
            <UCheckbox
              v-if="supportsSelfLearning"
              :model-value="selectedQuestionIds.has(question.id)"
              class="mt-0.5"
              @click.stop="toggleQuestionSelection(question.id)"
            />
            <div class="flex items-start justify-between gap-4 flex-1 min-w-0 cursor-pointer" @click="selectedQuestionId = question.id">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-medium text-sm truncate">{{ question.userName || question.userEmail }}</p>
                  <UBadge
                    :label="question.status === 'added_to_rag' ? 'In Knowledge Base' : capitalize(question.status)"
                    :color="
                      question.status === 'pending'
                        ? 'warning'
                        : question.status === 'answered'
                          ? 'success'
                          : question.status === 'closed'
                            ? 'error'
                            : 'info'
                    "
                    variant="subtle"
                    size="md"
                  />
                </div>
                <p class="text-sm text-neutral line-clamp-2">{{ question.initialQuestion }}</p>
                <p class="text-xs text-neutral mt-1">{{ formatDate(question.createdAt) }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-neutral shrink-0" />
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <template v-if="supportsSelfLearning && bulkActionType" #footer>
      <div class="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">{{ selectedQuestions.length }} question{{ selectedQuestions.length > 1 ? 's' : '' }} selected</p>
            <p class="text-xs text-neutral">
              {{ bulkActionType === 'add_to_kb' ? 'Add to knowledge base to train the AI' : 'Remove from knowledge base' }}
            </p>
          </div>
          <UButton
            :label="bulkActionType === 'add_to_kb' ? 'Add to KB' : 'Remove from KB'"
            :icon="bulkActionType === 'add_to_kb' ? 'i-lucide-book-plus' : 'i-lucide-trash-2'"
            :color="bulkActionType === 'add_to_kb' ? 'primary' : 'error'"
            :variant="bulkActionType === 'add_to_kb' ? 'solid' : 'soft'"
            :loading="isBulkActionLoading"
            @click="handleBulkAction"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <QuestionsDetail
    v-if="selectedQuestion && questionsData"
    :key="selectedQuestion.id"
    :question-id="selectedQuestion.id"
    :project-id="projectId!"
    :supports-self-learning="supportsSelfLearning"
    class="hidden lg:flex"
    @answered="refreshQuestions"
    @close="selectedQuestionId = null"
  />

  <UDashboardPanel v-else class="hidden lg:flex">
    <div class="flex flex-col items-center justify-center h-full text-center p-8">
      <UIcon name="i-lucide-message-circle" class="text-4xl text-neutral mb-4" />
      <h3 class="text-lg font-semibold mb-2">Select a question</h3>
      <p class="text-sm text-neutral">Choose a question from the list to view details and respond</p>
    </div>
  </UDashboardPanel>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isQuestionPanelOpen">
      <template #content>
        <QuestionsDetail
          v-if="selectedQuestion && questionsData"
          :question-id="selectedQuestion.id"
          :project-id="projectId!"
          :supports-self-learning="supportsSelfLearning"
          @answered="refreshQuestions"
          @close="selectedQuestionId = null"
        />
      </template>
    </USlideover>
  </ClientOnly>
</template>
