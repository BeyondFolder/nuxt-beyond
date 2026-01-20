<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { ConfirmModal } from '#components';
import { createProjectAvatar } from '~/utils/avatar';
import type { ProjectConfiguration } from '#shared/types';

const props = defineProps<{
  collapsed?: boolean;
}>();

const overlay = useOverlay();
const { session } = useUserSession();
const { switchProject, deleteProject } = useProjectOperations();

const confirmDeleteModal = overlay.create(ConfirmModal);
const { data: projectsResponse, pending, error, refresh } = await useFetch('/api/projects', { key: 'api/projects' });

const { public: { siteUrl } } = useRuntimeConfig();

const projects = computed(() => {
  if (!projectsResponse.value) {
    return [];
  }

  return projectsResponse.value.map((project) => ({
    ...project,
    avatar: {
      ...createProjectAvatar(project as any, siteUrl),
      style: {
        backgroundColor: (project?.configuration as ProjectConfiguration)?.appearance?.primaryColor,
      },
    },
  }));
});

const selectedProject = computed(() => {
  if (projects.value.length === 0) {
    return null;
  }

  const currentProjectId = session.value?.projectId;
  const found = projects.value.find((w) => w.id === currentProjectId);
  return found || projects.value[0];
});

const handleSwitchProject = async (projectId: string) => {
  if (projectId === selectedProject.value?.id) {
    return;
  }
  await switchProject(projectId);
  await refreshNuxtData('api/dashboard');
};

const confirmDeleteProject = async () => {
  if (!selectedProject.value) {
    return;
  }

  const instance = confirmDeleteModal.open({
    title: `Delete Project ${selectedProject.value.name}`,
    description:
      'All project data, conversations, and configurations will be permanently deleted, and the project will stop working in all sites where it is embedded.',
    confirmButtonText: 'Delete Project',
  });

  const confirmed = await instance.result;
  if (!confirmed) {
    return;
  }

  await deleteProject(selectedProject.value.id);
  await refreshNuxtData('api/projects');
  await refreshNuxtData('api/dashboard');
};

const canCreateProject = computed(() => projects.value.length < 5);
const hasSelectedProject = computed(() => Boolean(selectedProject.value));

const projectItems = computed(() =>
  projects.value.map((project) => ({
    label: project.name,
    avatar: project.avatar,
    onSelect() {
      handleSwitchProject(project.id);
    },
  }))
);

const actionItems = computed(() => [
  ...(canCreateProject.value
    ? [
        {
          label: 'Create project',
          icon: 'i-lucide-circle-plus',
          to: '/configuration/basic?create=true',
        },
      ]
    : []),
  ...(hasSelectedProject.value
    ? [
        {
          label: 'Delete project',
          icon: 'i-lucide-trash',
          color: 'error' as const,
          onSelect() {
            confirmDeleteProject();
          },
        },
      ]
    : []),
]);

const items = computed<DropdownMenuItem[][]>(() => {
  if (projects.value.length === 0) {
    return [[]];
  }

  return [projectItems.value, actionItems.value];
});

const buttonProps = computed(() => ({
  avatar: selectedProject.value?.avatar,
  label: props.collapsed ? undefined : selectedProject.value?.name,
  trailingIcon: props.collapsed ? undefined : 'i-lucide-chevrons-up-down',
}));

const buttonClasses = computed(() => [!props.collapsed && 'py-2']);
</script>

<template>
  <div>
    <UDropdownMenu
      v-if="!pending && selectedProject"
      :items="items"
      :content="{ align: 'center', collisionPadding: 12 }"
      :ui="{ content: props.collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        v-bind="buttonProps"
        color="neutral"
        variant="ghost"
        block
        :square="props.collapsed"
        class="data-[state=open]:bg-elevated"
        :class="buttonClasses"
        :ui="{ trailingIcon: 'text-dimmed' }"
      />
    </UDropdownMenu>
    <UButton
      v-else-if="pending"
      color="neutral"
      variant="ghost"
      block
      :square="props.collapsed"
      :class="buttonClasses"
      disabled
    >
      <USkeleton v-if="!props.collapsed" class="h-4 w-20" />
      <USkeleton v-else class="h-4 w-4" />
    </UButton>
    <UButton
      v-else-if="error"
      color="error"
      variant="ghost"
      block
      :square="props.collapsed"
      :class="buttonClasses"
      @click="() => refresh()"
    >
      <template v-if="!props.collapsed">
        <UIcon name="i-lucide-alert-circle" class="mr-2" />
        Retry
      </template>
      <UIcon v-else name="i-lucide-alert-circle" />
    </UButton>
  </div>
</template>
