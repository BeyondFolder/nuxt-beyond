<script setup lang="ts">
import { ALLOWED_LOGO_TYPES, THEME_PRIMARY_COLOR, MAX_LOGO_SIZE } from '#shared/constants';
import { formatBytesToMB } from '#shared/utils';

interface Props {
  initialPrimaryColor?: string;
  initialPosition?: 'bottom-right' | 'bottom-left';
  initialLogoUrl?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialPrimaryColor: THEME_PRIMARY_COLOR,
  initialPosition: 'bottom-right',
  initialLogoUrl: null,
});

const emit = defineEmits<{
  update: [data: { primaryColor?: string; position?: 'bottom-right' | 'bottom-left'; logo?: any }];
}>();

const positionOptions = [
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Bottom Right', value: 'bottom-right' },
];

const { handleError } = useErrorHandling();

const state = ref({
  primaryColor: props.initialPrimaryColor,
  position: props.initialPosition,
});

const logoUrl = ref<string | null>(props.initialLogoUrl);
const logoFile = ref<File | null>(null);

watch(
  () => props.initialPrimaryColor,
  (newColor) => {
    state.value.primaryColor = newColor;
  }
);

watch(
  () => props.initialPosition,
  (newPosition) => {
    state.value.position = newPosition;
  }
);

watch(
  () => props.initialLogoUrl,
  (newLogoUrl) => {
    logoUrl.value = newLogoUrl;
  }
);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

watch(logoFile, async (file) => {
  if (!file) {
    return;
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    handleError(new Error('Invalid file type'), 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
    logoFile.value = null;
    return;
  }

  if (file.size > MAX_LOGO_SIZE) {
    handleError(new Error('File too large'), `Image size must be less than ${formatBytesToMB(MAX_LOGO_SIZE)}`);
    logoFile.value = null;
    return;
  }

  try {
    const base64 = await fileToBase64(file);
    const logoData = {
      data: base64,
      filename: file.name,
      contentType: file.type,
    };
    logoUrl.value = URL.createObjectURL(file);
    emit('update', { logo: logoData });
  } catch (error) {
    handleError(error, 'Failed to process image');
    logoFile.value = null;
  }
});

function handleLogoDelete() {
  logoUrl.value = null;
  logoFile.value = null;
  emit('update', { logo: null });
}

watch(
  () => state.value.primaryColor,
  (newColor) => {
    emit('update', { primaryColor: newColor });
  }
);

watch(
  () => state.value.position,
  (newPosition) => {
    emit('update', { position: newPosition });
  }
);
</script>

<template>
  <UPageCard>
    <template #header>
      <h3 class="font-semibold">Appearance</h3>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UFormField name="primaryColor">
          <template #label>
            <span class="font-medium">Primary Color</span>
          </template>

          <template #description>
            <p class="text-sm text-neutral">Choose the primary color for your project's interface elements.</p>
          </template>

          <UColorPicker v-model="state.primaryColor" />

          <UFormField name="primaryColor" class="w-32 pt-2">
            <UInput v-model="state.primaryColor" :placeholder="THEME_PRIMARY_COLOR" />
          </UFormField>
        </UFormField>

        <UFormField name="logo">
          <template #label>
            <div class="flex items-center gap-2">
              <span class="font-medium">Logo</span>
              <UTooltip text="Recommended size: 128x128 pixels">
                <UIcon name="i-lucide-info" class="text-neutral" />
              </UTooltip>
            </div>
          </template>

          <template #description>
            <p class="text-sm text-neutral">
              Upload a logo to display in your project (128x128px recommended, max
              {{ formatBytesToMB(MAX_LOGO_SIZE) }}).
            </p>
          </template>

          <div class="space-y-3">
            <div v-if="logoUrl" class="flex items-center gap-3">
              <img
                :src="logoUrl"
                alt="Project logo"
                class="w-16 h-16 rounded-full object-cover"
                :style="{ backgroundColor: state.primaryColor }"
              >
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" @click="handleLogoDelete">
                Remove
              </UButton>
            </div>
            <UFileUpload
              v-else
              v-model="logoFile"
              :accept="ALLOWED_LOGO_TYPES.join(',')"
              label="Click or drag and drop to upload logo"
              :description="`JPEG, PNG, GIF, or WebP (max ${formatBytesToMB(MAX_LOGO_SIZE)})`"
              icon="i-lucide-image"
              color="primary"
              highlight
              variant="area"
              size="md"
              class="w-full cursor-pointer"
            />
          </div>
        </UFormField>
      </div>

      <UFormField name="position">
        <template #label>
          <span class="font-medium">Project Position</span>
        </template>

        <template #description>
          <p class="text-sm text-neutral">Choose where the project will appear on your website.</p>
        </template>

        <div class="flex gap-3">
          <div
            v-for="option in positionOptions"
            :key="option.value"
            class="relative cursor-pointer"
            @click="state.position = option.value as 'bottom-right' | 'bottom-left'"
          >
            <input
              :id="`position-${option.value}`"
              v-model="state.position"
              :value="option.value"
              type="radio"
              name="position"
              class="sr-only"
            >
            <UBadge
              :variant="state.position === option.value ? 'solid' : 'outline'"
              :color="state.position === option.value ? 'primary' : 'neutral'"
              size="lg"
              class="px-4 py-2 cursor-pointer transition-colors"
            >
              {{ option.label }}
            </UBadge>
          </div>
        </div>
      </UFormField>
    </div>
  </UPageCard>
</template>
