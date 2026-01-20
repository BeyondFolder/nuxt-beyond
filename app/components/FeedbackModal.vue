<script setup lang="ts">
const modelValue = defineModel<boolean>();

const message = ref('');
const loading = ref(false);
const turnstileToken = ref('');

const toast = useToast();

async function submitFeedback() {
  if (!message.value.trim() || !turnstileToken.value) {
    return;
  }

  loading.value = true;

  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        message: message.value,
        turnstileToken: turnstileToken.value,
      },
    });

    toast.add({
      title: 'Feedback sent',
      description: 'Thank you for your feedback!',
      color: 'success',
    });

    message.value = '';
    turnstileToken.value = '';
    modelValue.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Failed to send feedback',
      description: error.message || 'Please try again',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="modelValue" :ui="{ footer: 'justify-end' }">
    <template #header>
      <h3 class="text-lg font-semibold">Support & Feedback</h3>
      <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" @click="modelValue = false" />
    </template>

    <template #body>
      <UForm @submit="submitFeedback">
        <div class="space-y-4">
          <UTextarea
            v-model="message"
            placeholder="How can we help? Share your feedback, report a bug, or request a feature..."
            :rows="6"
            autoresize
            required
            :disabled="loading || !turnstileToken"
            :ui="{ root: 'w-full' }"
          />
          <NuxtTurnstile v-model="turnstileToken" />
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
      <UButton variant="ghost" color="neutral" :disabled="loading" @click="modelValue = false"> Cancel </UButton>
      <UButton :loading="loading" :disabled="!message.trim()" @click="submitFeedback"> Send Feedback </UButton>
      </div>
    </template>
  </UModal>
</template>
