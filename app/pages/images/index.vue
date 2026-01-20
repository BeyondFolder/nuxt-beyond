<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

useSeoMeta({
  title: 'AI Image Generation',
  description: 'Generate images with AI',
});

const input = ref('');
const loading = ref(false);
const toast = useToast();

async function generateImage() {
  if (!input.value.trim()) {
    return;
  }

  loading.value = true;

  try {
    const result = await $fetch('/api/images', {
      method: 'POST',
      body: {
        prompt: input.value,
      },
    });

    refreshNuxtData('image-chats');
    navigateTo(`/images/${result.id}`);
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to generate image',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function createImage(prompt: string) {
  input.value = prompt;
  await generateImage();
}

const quickPrompts = [
  {
    label: 'A serene mountain landscape at sunset',
    icon: 'i-lucide-mountain',
  },
  {
    label: 'A futuristic city with flying cars',
    icon: 'i-lucide-building-2',
  },
  {
    label: 'A cozy coffee shop interior',
    icon: 'i-lucide-coffee',
  },
  {
    label: 'An astronaut floating in space',
    icon: 'i-lucide-rocket',
  },
  {
    label: 'A magical forest with glowing mushrooms',
    icon: 'i-lucide-trees',
  },
  {
    label: 'A cute robot playing with a cat',
    icon: 'i-lucide-bot',
  },
];
</script>

<template>
  <UDashboardPanel id="images-home" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          What would you like to create?
        </h1>

        <div class="flex gap-2">
          <UTextarea
            v-model="input"
            :rows="3"
            :disabled="loading"
            placeholder="Describe the image you want to generate..."
            class="flex-1"
            @keydown.meta.enter="generateImage"
            @keydown.ctrl.enter="generateImage"
          />
        </div>

        <div class="flex justify-end">
          <UButton
            :loading="loading"
            :disabled="!input.trim()"
            icon="i-lucide-sparkles"
            label="Generate"
            @click="generateImage"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="prompt in quickPrompts"
            :key="prompt.label"
            :icon="prompt.icon"
            :label="prompt.label"
            :disabled="loading"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            @click="createImage(prompt.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
