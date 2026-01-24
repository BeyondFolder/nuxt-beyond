<script setup lang="ts">
interface Props {
  initialAllowedDomains?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialAllowedDomains: '',
});

const emit = defineEmits<{
  update: [allowedDomains: string];
}>();

const state = ref({
  allowedDomains: props.initialAllowedDomains,
});

watch(() => props.initialAllowedDomains, (newValue) => {
  state.value.allowedDomains = newValue;
});

watch(
  () => state.value.allowedDomains,
  (newValue) => {
    emit('update', newValue);
  }
);
</script>

<template>
  <UPageCard>
    <template #header>
      <h3 class="font-semibold">Security Settings</h3>
    </template>

    <UFormField name="allowedDomains" required>
      <template #label>
        <span class="font-medium">Allowed Domains</span>
      </template>

      <template #description>
        <p class="text-sm text-neutral">
          Enter the domains where your project will be allowed to function. Leave empty to allow all domains. Enter
          one domain per line (e.g., "example.com", "subdomain.example.com").
        </p>
      </template>

      <UTextarea
        v-model="state.allowedDomains"
        placeholder="example.com&#10;blog.example.com&#10;shop.example.com"
        :rows="4"
        class="w-full"
        disabled
      />
    </UFormField>
  </UPageCard>
</template>
