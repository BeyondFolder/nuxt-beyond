<script setup lang="ts">
interface Props {
  initialQuestion1?: string;
  initialQuestion2?: string;
  initialQuestion3?: string;
  initialCustomPrompt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialQuestion1: '',
  initialQuestion2: '',
  initialQuestion3: '',
  initialCustomPrompt: '',
});

const emit = defineEmits<{
  update: [data: { initialQuestion1?: string; initialQuestion2?: string; initialQuestion3?: string; customPrompt?: string }];
}>();

const state = ref({
  initialQuestion1: props.initialQuestion1,
  initialQuestion2: props.initialQuestion2,
  initialQuestion3: props.initialQuestion3,
  customPrompt: props.initialCustomPrompt,
});

watch(() => props.initialQuestion1, (newValue) => {
  state.value.initialQuestion1 = newValue;
});

watch(() => props.initialQuestion2, (newValue) => {
  state.value.initialQuestion2 = newValue;
});

watch(() => props.initialQuestion3, (newValue) => {
  state.value.initialQuestion3 = newValue;
});

watch(() => props.initialCustomPrompt, (newValue) => {
  state.value.customPrompt = newValue;
});

watch(
  () => state.value,
  (newValue) => {
    emit('update', newValue);
  },
  { deep: true }
);
</script>

<template>
  <UPageCard>
    <template #header>
      <h3 class="font-semibold">Behavior (Optional)</h3>
    </template>

    <div class="space-y-4">
      <div class="space-y-3">
        <div>
          <span class="font-medium">Initial Questions</span>
          <p class="text-sm text-neutral mt-1">Suggested questions to help users get started with the project.</p>
        </div>

        <!-- Example questions - Customize these placeholders for your specific business domain -->
        <UFormField name="initialQuestion1">
          <UInput v-model="state.initialQuestion1" placeholder="How can I track my order?" class="w-full" />
        </UFormField>

        <UFormField name="initialQuestion2">
          <UInput v-model="state.initialQuestion2" placeholder="What are your business hours?" class="w-full" />
        </UFormField>

        <UFormField name="initialQuestion3">
          <UInput v-model="state.initialQuestion3" placeholder="How do I return a product?" class="w-full" />
        </UFormField>
      </div>

      <UFormField name="customPrompt">
        <template #label>
          <span class="font-medium">Custom Prompt</span>
        </template>

        <template #description>
          <p class="text-sm text-neutral">
            Add a custom system prompt to customize the AI agent's behavior and personality.
          </p>
        </template>

        <!-- Example prompt - Customize this placeholder to match your brand voice and requirements -->
        <UTextarea
          v-model="state.customPrompt"
          placeholder="You are a helpful customer support chatbot. Be friendly and professional..."
          :rows="4"
          class="w-full"
        />
      </UFormField>
    </div>
  </UPageCard>
</template>
