<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'authenticated',
});

useSeoMeta({
  title: 'AI Video Generation',
  description: 'Generate videos with AI',
});

const input = ref('');
const loading = ref(false);
const toast = useToast();
const imageFiles = ref<File | null>(null);

async function validateImageDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      resolve(img.width === 720 && img.height === 1280);
    };

    img.onerror = () => resolve(false);
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generateVideo() {
  if (!input.value.trim()) {
    return;
  }

  loading.value = true;

  try {
    let imageBase64 = null;

    if (imageFiles.value) {
      const file = imageFiles.value;

      if (!file.type.startsWith('image/')) {
        toast.add({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          color: 'error',
        });
        loading.value = false;
        return;
      }

      const isValidDimensions = await validateImageDimensions(file);
      if (!isValidDimensions) {
        toast.add({
          title: 'Invalid image dimensions',
          description: 'Image must be exactly 720x1280 pixels',
          color: 'error',
        });
        loading.value = false;
        return;
      }

      imageBase64 = await convertImageToBase64(file);
    }

    const result = await $fetch('/api/videos', {
      method: 'POST',
      body: {
        prompt: input.value,
        imageBase64,
      },
    });

    input.value = '';
    imageFiles.value = null;

    refreshNuxtData('video-chats');
    navigateTo(`/videos/${result.id}`);
  } catch (error: any) {
    console.error(error);
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to generate video',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function createVideo(prompt: string) {
  input.value = prompt;
  await generateVideo();
}

const quickPrompts = [
  {
    label: 'A drone flying over a futuristic city',
    icon: 'i-lucide-plane',
  },
  {
    label: 'Ocean waves crashing on a beach at sunset',
    icon: 'i-lucide-waves',
  },
  {
    label: 'A cat playing with a ball of yarn',
    icon: 'i-lucide-cat',
  },
  {
    label: 'Time-lapse of clouds moving across the sky',
    icon: 'i-lucide-cloud',
  },
  {
    label: 'A rocket launching into space',
    icon: 'i-lucide-rocket',
  },
  {
    label: 'Northern lights dancing in the night sky',
    icon: 'i-lucide-sparkles',
  },
];
</script>

<template>
  <UDashboardPanel id="videos-home" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          What video would you like to create?
        </h1>

        <div class="flex gap-2">
          <UTextarea
            v-model="input"
            :rows="3"
            :disabled="loading"
            placeholder="Describe the video you want to generate..."
            class="flex-1"
            @keydown.meta.enter="generateVideo"
            @keydown.ctrl.enter="generateVideo"
          />
        </div>

        <UFileUpload
          v-model="imageFiles"
          accept="image/*"
          :disabled="loading"
          label="Click or drag and drop to upload reference image"
          description="Optional: Upload an image to guide video generation (must be 720x1280 pixels)"
          icon="i-lucide-image"
          color="primary"
          highlight
          variant="area"
          size="lg"
          layout="list"
          position="outside"
          class="w-full cursor-pointer"
        />

        <div class="flex justify-end">
          <UButton
            :loading="loading"
            :disabled="!input.trim()"
            icon="i-lucide-video"
            label="Generate"
            @click="generateVideo"
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
            @click="createVideo(prompt.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
