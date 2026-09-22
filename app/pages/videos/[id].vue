<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

interface VideoMessage {
  id: string;
  role: 'user' | 'assistant';
  prompt: string | null;
  videoUrl: string | null;
  jobId: string | null;
  status: 'processing' | 'completed' | 'failed' | null;
  previousVideoId: string | null;
  createdAt: string;
}

const route = useRoute();
const toast = useToast();

const { data, error, refresh } = await useFetch<{
  id: string;
  title: string | null;
  messages: VideoMessage[];
}>(`/api/videos/${route.params.id}`);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
}

useSeoMeta({
  title: data.value.title || 'AI Video Generation',
});

const input = ref('');
const loading = ref(false);
const polling = ref(false);
let pollInterval: NodeJS.Timeout | null = null;

const lastAssistantVideo = computed(() => {
  const assistantMessages = data.value?.messages.filter((m) => m.role === 'assistant' && m.jobId) || [];
  return assistantMessages.at(-1)?.jobId ?? null;
});

const hasProcessingVideos = computed(() => {
  return data.value?.messages.some((m) => m.status === 'processing') || false;
});

async function pollVideoStatus() {
  if (polling.value) {
    return;
  }

  polling.value = true;

  try {
    const result = await $fetch(`/api/videos/${route.params.id}/poll`);

    if ('updates' in result && result.updates.length > 0) {
      await refresh();
    }

    if (!result.hasProcessing && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } catch (err: any) {
    console.error('Polling error:', err);
  } finally {
    polling.value = false;
  }
}

async function generateVideo() {
  if (!input.value.trim()) {
    return;
  }

  loading.value = true;

  try {
    await $fetch(`/api/videos/${route.params.id}`, {
      method: 'POST',
      body: {
        prompt: input.value,
        previousVideoId: lastAssistantVideo.value,
      },
    });

    input.value = '';
    await refresh();
    refreshNuxtData('video-chats');

    if (!pollInterval) {
      pollInterval = setInterval(pollVideoStatus, 10_000);
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to generate video',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function downloadVideo(videoUrl: string) {
  const link = document.createElement('a');
  link.href = videoUrl;
  link.download = 'generated-video.mp4';
  link.click();
}

onMounted(() => {
  if (hasProcessingVideos.value) {
    pollInterval = setInterval(pollVideoStatus, 5000);
  }
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <UDashboardPanel id="videos-chat" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6 py-4">
        <div class="flex-1 overflow-y-auto space-y-4">
          <div
            v-for="message in data?.messages"
            :key="message.id"
            :class="[
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              v-if="message.role === 'user'"
              class="max-w-[70%] rounded-lg bg-primary/10 px-4 py-2"
            >
              <p class="text-sm">{{ message.prompt }}</p>
            </div>

            <div
              v-else
              class="max-w-[70%] flex flex-col gap-2"
            >
              <div v-if="message.status === 'processing'" class="rounded-lg border border-default p-4">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-loader-circle" class="animate-spin" />
                  <p class="text-sm text-muted">Generating video...</p>
                </div>
              </div>

              <div v-else-if="message.status === 'failed'" class="rounded-lg border border-error p-4">
                <p class="text-sm text-error">Failed to generate video</p>
              </div>

              <div
                v-else-if="message.videoUrl"
                class="group relative rounded-lg overflow-hidden border border-default"
              >
                <video
                  :src="message.videoUrl"
                  controls
                  class="w-full max-w-md rounded-lg"
                />

                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="solid"
                    size="xs"
                    @click="downloadVideo(message.videoUrl!)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 bg-default pt-4 border-t border-default">
          <div class="flex gap-2">
            <UTextarea
              v-model="input"
              :rows="2"
              :disabled="loading || hasProcessingVideos"
              placeholder="Describe the changes you want..."
              class="flex-1"
              @keydown.meta.enter="generateVideo"
              @keydown.ctrl.enter="generateVideo"
            />
          </div>

          <div class="flex justify-end mt-2">
            <UButton
              :loading="loading"
              :disabled="!input.trim() || hasProcessingVideos"
              icon="i-lucide-video"
              label="Edit Video"
              @click="generateVideo"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
