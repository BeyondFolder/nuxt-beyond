<script setup lang="ts">
const props = defineProps<{
  projectId: string;
  primaryColor: string;
  position?: 'bottom-right' | 'bottom-left';
  logo?: string | null;
}>();

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const isProjectOpen = ref(false);
const isProjectLoaded = ref(false);
const iframeSrc = ref('');
const showLoader = ref(false);

function buildIframeSrc() {
  return `/embed?projectId=${props.projectId}`;
}

function toggleProject() {
  isProjectOpen.value = !isProjectOpen.value;

  if (isProjectOpen.value && !isProjectLoaded.value && !iframeSrc.value) {
    showLoader.value = true;
    iframeSrc.value = buildIframeSrc();
  }
}

function onProjectLoad() {
  showLoader.value = false;
  isProjectLoaded.value = true;
}

watch(
  dashboardData,
  async () => {
    if (iframeSrc.value) {
      showLoader.value = true;
      isProjectLoaded.value = false;
      iframeSrc.value = '';
      await nextTick();
      iframeSrc.value = buildIframeSrc();
    }
  },
  {
    deep: true,
  }
);

const closeIconSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

const bubbleIcon = computed(() => {
  if (props.logo) {
    return `<img src="${props.logo}" alt="Logo" style="width: 64px; height: 64px; object-fit: contain;" />`;
  }
  return `<img src="/images/logo.png" alt="Logo" style="width: 64px; height: 64px; object-fit: contain;" />`;
});

const spinnerSVG = computed(
  () => `
  <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <style>
      .spinner {
        animation: rotate 2s linear infinite;
        transform-origin: center center;
      }
      .path {
        stroke: ${props.primaryColor};
        stroke-linecap: round;
        animation: dash 1.5s ease-in-out infinite;
      }
      @keyframes rotate {
        100% { transform: rotate(360deg); }
      }
      @keyframes dash {
        0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
        100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
      }
    </style>
    <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
  </svg>
`
);
</script>

<template>
  <UPageCard>
    <template #header>
      <h3 class="font-semibold">Live Preview</h3>
    </template>

    <div
      class="relative border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[550px] sm:min-h-[720px] min-w-full sm:min-w-[454px] mx-auto"
    >
      <button
        class="absolute w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 z-10"
        :class="{
          'bottom-4 right-4': !position || position === 'bottom-right',
          'bottom-4 left-4': position === 'bottom-left',
        }"
        :style="{ backgroundColor: primaryColor }"
        @click="toggleProject"
        v-html="isProjectOpen ? closeIconSVG : bubbleIcon"
      />

      <div
        class="absolute bg-white shadow-2xl overflow-hidden z-20 transition-all duration-300 rounded-none sm:rounded-2xl"
        :class="{
          'left-0 right-0 top-0 bottom-24': isProjectOpen,
          'sm:inset-auto sm:w-[420px] sm:h-[600px] sm:bottom-24 sm:right-4':
            isProjectOpen && !position || position === 'bottom-right',
          'sm:inset-auto sm:w-[420px] sm:h-[600px] sm:bottom-24 sm:left-4': isProjectOpen && position === 'bottom-left',
          'opacity-0 scale-95 pointer-events-none': !isProjectOpen,
          'opacity-100 scale-100': isProjectOpen,
        }"
      >
        <div
          v-show="showLoader"
          class="absolute inset-0 flex items-center justify-center bg-white z-30"
          v-html="spinnerSVG"
        />
        <iframe
          v-if="iframeSrc"
          :src="iframeSrc"
          class="absolute inset-0 w-full h-full border-0"
          :style="{ visibility: isProjectLoaded ? 'visible' : 'hidden' }"
          title="Project Preview"
          @load="onProjectLoad"
        />
      </div>
    </div>
  </UPageCard>
</template>
