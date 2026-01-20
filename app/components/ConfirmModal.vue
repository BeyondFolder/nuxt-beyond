<script setup lang="ts">
interface Props {
  title: string;
  description: string;
  confirmButtonText: string;
  confirmButtonColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
}

withDefaults(defineProps<Props>(), {
  confirmButtonColor: 'error',
});

const emit = defineEmits<{
  close: [boolean];
}>();

const isLoading = ref(false);

const handleConfirm = async () => {
  isLoading.value = true;
  try {
    emit('close', true);
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  emit('close', false);
};
</script>

<template>
  <UModal :close="{ onClick: () => handleCancel() }" :ui="{ footer: 'justify-end' }">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-alert-triangle" :class="`text-${confirmButtonColor} text-xl`" />
        <h3 class="text-lg font-semibold">{{ title }}</h3>
      </div>
    </template>

    <template #body>
      <UAlert variant="soft" :color="confirmButtonColor" :description="description" />
    </template>

    <template #footer>
      <UButton variant="ghost" color="neutral" :disabled="isLoading" @click="handleCancel">Cancel</UButton>
      <UButton :color="confirmButtonColor" :loading="isLoading" @click="handleConfirm">
        <UIcon name="i-lucide-trash" class="mr-2" />
        {{ confirmButtonText }}
      </UButton>
    </template>
  </UModal>
</template>
