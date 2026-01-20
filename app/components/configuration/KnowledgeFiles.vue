<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui';
import { ConfirmModal } from '#components';

interface Props {
  knowledgeFiles: {
    files: Array<{ key: string; size: number }>;
    totalCount: number;
  } | null;
  maxNbOfFiles: number;
  projectId: string;
  canRequestProcessing: boolean;
  isLoadingProcessing: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  requestProcessing: [];
}>();

const { handleError, showSuccess } = useErrorHandling();

const overlay = useOverlay();
const confirmDeleteModal = overlay.create(ConfirmModal);

const selectedFiles = ref<TreeItem[]>([]);
const isDeletingFiles = ref(false);

const treeData = computed(() => {
  const pages: TreeItem[] = [];
  const files: TreeItem[] = [];
  const text: TreeItem[] = [];

  props.knowledgeFiles?.files.forEach((file) => {
    const fileNode: TreeItem = {
      id: file.key,
      badge: `${(file.size / 1024).toFixed(1)}KB`,
      onSelect() {
        window.open(`/projects/${props.projectId}/knowledge/${encodeURIComponent(file.key)}`, '_blank');
      },
      slot: 'delete-icon',
    };

    if (file.key.startsWith('pages/')) {
      pages.push({
        ...fileNode,
        icon: 'i-lucide-link-2',
        label: decodeURIComponent(file.key)
          .replace(/^pages\//, '')
          .replace(/.html$/, '')
          .replace(/.pdf$/, ''),
      });
    } else if (file.key.startsWith('text/')) {
      text.push({
        ...fileNode,
        icon: 'i-lucide-file-text',
        label: decodeURIComponent(file.key).replace(/^text\//, ''),
      });
    } else {
      // Files
      files.push({
        ...fileNode,
        icon: 'i-lucide-file',
        label: decodeURIComponent(file.key).replace(/^files\//, ''),
      });
    }
  });

  const tree: TreeItem[] = [];

  if (pages.length > 0) {
    tree.push({
      id: 'pages',
      label: 'Pages',
      icon: 'i-lucide-globe',
      defaultExpanded: true,
      children: pages,
    });
  }

  if (files.length > 0) {
    tree.push({
      id: 'files',
      label: 'Files',
      icon: 'i-lucide-files',
      defaultExpanded: true,
      children: files,
    });
  }

  if (text.length > 0) {
    tree.push({
      id: 'text',
      label: 'Text',
      icon: 'i-lucide-folder',
      defaultExpanded: true,
      children: text,
    });
  }

  return tree;
});

async function deleteSelectedFiles() {
  const filenames = selectedFiles.value.filter((item): item is TreeItem & { id: string } => !!item.id && !item.children).map((item) => item.id);

  if (filenames.length === 0) {
    return;
  }

  const instance = confirmDeleteModal.open({
    title: `Delete ${filenames.length} Item(s)`,
    description: `Are you sure you want to delete ${filenames.length} selected file(s)? This action cannot be undone.`,
    confirmButtonText: 'Delete Files',
  });

  const confirmed = await instance.result;
  if (!confirmed) {
    return;
  }

  try {
    isDeletingFiles.value = true;

    for (const filename of filenames) {
      await $fetch(`/api/projects/${props.projectId}/knowledge/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
    }

    await refreshNuxtData('api/dashboard');
    await refreshNuxtData(`api/projects/${props.projectId}/knowledge`);
    showSuccess(`${filenames.length} file(s) deleted successfully`);

    selectedFiles.value = [];
  } catch (error) {
    handleError(error, 'Failed to delete files');
  } finally {
    isDeletingFiles.value = false;
  }
}

function onSelect(item: TreeItem) {
  if (selectedFiles.value.find((i) => i.id === item.id)) {
    selectedFiles.value = selectedFiles.value.filter((i) => i.id !== item.id);
  } else {
    selectedFiles.value.push(item);
  }
}
</script>

<template>
  <UPageCard class="space-y-4">
    <div class="flex justify-between items-center">
      <h4 class="text-sm font-medium text-primary">
        Knowledge Base Files ({{ knowledgeFiles?.totalCount }} / {{ maxNbOfFiles }}):
      </h4>

      <div class="flex gap-2">
        <UButton
          v-if="selectedFiles.length > 0"
          variant="outline"
          color="error"
          icon="i-lucide-trash"
          :loading="isDeletingFiles"
          @click="deleteSelectedFiles"
        >
          Delete {{ selectedFiles.length }} item(s)
        </UButton>

        <UButton
          v-if="canRequestProcessing"
          variant="outline"
          color="warning"
          :disabled="!knowledgeFiles?.totalCount || knowledgeFiles.totalCount === 0"
          trailing-icon="i-lucide-arrow-right"
          :loading="isLoadingProcessing"
          @click="emit('requestProcessing')"
        >
          Request processing
        </UButton>
      </div>
    </div>

    <UTree :items="treeData" :ui="{ link: 'cursor-pointer' }">
      <template #delete-icon-trailing="{ item }">
        <UCheckbox
          icon="i-lucide-x"
          color="error"
          size="lg"
          tabindex="-1"
          :model-value="!!selectedFiles.find((i) => i.id === (item as any).id)"
          @change="() => onSelect(item as any)"
          @click.stop
        />
      </template>
    </UTree>
  </UPageCard>
</template>
