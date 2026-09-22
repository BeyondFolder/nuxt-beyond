<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

interface ImageMessage {
  id: string;
  role: 'user' | 'assistant';
  prompt: string | null;
  imageUrl: string | null;
  sourceImageUrl: string | null;
  createdAt: string;
}

const route = useRoute();
const toast = useToast();

const { data, error, refresh } = await useFetch<{
  id: string;
  title: string | null;
  messages: ImageMessage[];
}>(`/api/images/${route.params.id}`);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Image chat not found' });
}

useSeoMeta({
  title: data.value.title || 'AI Image Generation',
});

const input = ref('');
const loading = ref(false);

const lastAssistantImage = computed(() => {
  const assistantMessages = data.value?.messages.filter((m) => m.role === 'assistant' && m.imageUrl) || [];
  return assistantMessages.at(-1)?.imageUrl ?? null;
});

async function generateImage() {
  if (!input.value.trim()) {
    return;
  }

  loading.value = true;

  try {
    await $fetch(`/api/images/${route.params.id}`, {
      method: 'POST',
      body: {
        prompt: input.value,
        sourceImageUrl: lastAssistantImage.value,
      },
    });

    input.value = '';
    await refresh();
    refreshNuxtData('image-chats');
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.data?.message || 'Failed to generate image',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function downloadImage(imageUrl: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = 'generated-image.png';
  link.click();
}
</script>

<template>
  <UDashboardPanel id="images-chat" :ui="{ body: 'p-0 sm:p-0' }">
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
              <div class="group relative rounded-lg overflow-hidden border border-default">
                <img
                  v-if="message.imageUrl"
                  :src="message.imageUrl"
                  :alt="message.prompt || 'Generated image'"
                  class="w-full max-w-md rounded-lg"
                >

                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="solid"
                    size="xs"
                    @click="downloadImage(message.imageUrl!)"
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
              :disabled="loading"
              placeholder="Describe the changes you want..."
              class="flex-1"
              @keydown.meta.enter="generateImage"
              @keydown.ctrl.enter="generateImage"
            />
          </div>

          <div class="flex justify-end mt-2">
            <UButton
              :loading="loading"
              :disabled="!input.trim()"
              icon="i-lucide-edit"
              label="Edit Image"
              @click="generateImage"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
