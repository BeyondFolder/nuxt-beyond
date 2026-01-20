<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { ProjectConfiguration } from '#shared/types';
import { PLANS_CONSTANTS } from '#shared/constants';
import ProjectsMenu from '~/components/ProjectsMenu.vue';
import { ConfirmModal } from '#components';

useSeoMeta({
  title: 'Dashboard',
  description: 'User dashboard',
});

const route = useRoute();
const toast = useToast();
const overlay = useOverlay();

const open = ref(false);
const feedbackModalOpen = ref(false);

const { data: dashboardData } = await useFetch('/api/dashboard', { key: 'api/dashboard' });

const deleteChatModal = overlay.create(ConfirmModal, {
  props: {
    title: 'Delete chat',
    description: 'Are you sure you want to delete this chat? This cannot be undone.',
    confirmButtonText: 'Delete',
  },
});

const deleteImageChatModal = overlay.create(ConfirmModal, {
  props: {
    title: 'Delete image chat',
    description: 'Are you sure you want to delete this image chat and all generated images? This cannot be undone.',
    confirmButtonText: 'Delete',
  },
});

const deleteVideoChatModal = overlay.create(ConfirmModal, {
  props: {
    title: 'Delete video chat',
    description: 'Are you sure you want to delete this video chat and all generated videos? This cannot be undone.',
    confirmButtonText: 'Delete',
  },
});

interface ChatData {
  id: string;
  title: string | null;
  createdAt: string;
}

const { data: chats, refresh: refreshChats } = await useFetch('/api/chat', {
  key: 'user-chats',
  transform: (data: ChatData[]) =>
    data.map((chat) => ({
      id: chat.id,
      label: chat.title || 'Untitled',
      to: `/chat/${chat.id}`,
      icon: 'i-lucide-message-circle',
      createdAt: chat.createdAt,
    })),
});

const { data: imageChats, refresh: refreshImageChats } = await useFetch('/api/images', {
  key: 'image-chats',
  transform: (data: ChatData[]) =>
    data.map((chat) => ({
      id: chat.id,
      label: chat.title || 'Untitled',
      to: `/images/${chat.id}`,
      icon: 'i-lucide-image',
      createdAt: chat.createdAt,
    })),
});

const { data: videoChats, refresh: refreshVideoChats } = await useFetch('/api/videos', {
  key: 'video-chats',
  transform: (data: ChatData[]) =>
    data.map((chat) => ({
      id: chat.id,
      label: chat.title || 'Untitled',
      to: `/videos/${chat.id}`,
      icon: 'i-lucide-video',
      createdAt: chat.createdAt,
    })),
});

const { groups: chatGroups } = useChats(chats);
const { groups: imageChatGroups } = useChats(imageChats);
const { groups: videoChatGroups } = useChats(videoChats);

const isProcessing = ref(false);
const pollingInterval = ref<NodeJS.Timeout | null>(null);
const processingToastId = ref<string | number | null>(null);

const projectId = computed(() => dashboardData.value?.currentProject?.id);
const isAdmin = computed(() => dashboardData.value?.currentProjectRole === 'admin');

watch(isProcessing, (newValue, oldValue) => {
  if (import.meta.server) {
    return;
  }

  if (newValue && !processingToastId.value) {
    processingToastId.value = toast.add({
      title: 'Processing knowledge base...',
      description: 'It may take a few minutes for new information to be available to the chatbot',
      icon: 'i-lucide-loader-circle',
      color: 'warning',
      duration: 0,
      close: false,
    }).id;
  } else if (!newValue && processingToastId.value) {
    toast.remove(processingToastId.value);
    processingToastId.value = null;

    if (oldValue) {
      toast.add({
        title: 'Processing complete',
        description: 'Your knowledge base has been updated successfully',
        icon: 'i-lucide-check-circle',
        color: 'success',
      });
    }
  }
});

async function checkProcessingStatus() {
  if (!projectId.value) {
    return;
  }

  const configuration = (dashboardData.value?.currentProject?.configuration as ProjectConfiguration) || {};

  if (!configuration?.requestProcessingJobId || configuration?.finishedProcessingAt) {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    isProcessing.value = false;
    return;
  }

  try {
    const result = (await $fetch(`/api/projects/${projectId.value}/knowledge/sync`)) as any;
    isProcessing.value = !result.isProcessed;

    if (result.isProcessed) {
      await refreshNuxtData('api/dashboard');
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
    }
  } catch (error) {
    console.error('Failed to check processing status:', error);
  }
}

function startPolling() {
  if (!projectId.value) {
    return;
  }

  const configuration = (dashboardData.value?.currentProject?.configuration as ProjectConfiguration) || {};

  if (configuration?.requestProcessingJobId && !configuration?.finishedProcessingAt) {
    isProcessing.value = true;
    checkProcessingStatus();
    pollingInterval.value = setInterval(checkProcessingStatus, 10000);
  }
}

watch(
  () => dashboardData.value?.currentProject,
  () => {
    if (import.meta.server) {
      return;
    }
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    startPolling();
  }
);

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
  if (processingToastId.value) {
    toast.remove(processingToastId.value);
    processingToastId.value = null;
  }
});

const supportsEscalation = computed(() => {
  const planName = dashboardData.value?.currentProject?.planName as keyof typeof PLANS_CONSTANTS | undefined;
  if (!planName) {
    return false;
  }
  return PLANS_CONSTANTS[planName]?.SUPPORT_ESCALATION || false;
});

const hasFiles = computed(() => {
  const config = dashboardData.value?.currentProject?.configuration as ProjectConfiguration;

  return (config?.fileCount || 0) > 0 && !!config?.requestProcessingAt;
});

async function deleteChat(id: string) {
  const instance = deleteChatModal.open();
  const result = await instance.result;
  if (!result) {
    return;
  }

  await $fetch(`/api/chat/${id}`, { method: 'DELETE' });

  toast.add({
    title: 'Chat deleted',
    description: 'Your chat has been deleted',
    icon: 'i-lucide-trash',
  });

  refreshChats();

  if (route.params.id === id) {
    navigateTo('/chat');
  }
}

async function deleteImageChat(id: string) {
  const instance = deleteImageChatModal.open();
  const result = await instance.result;
  if (!result) {
    return;
  }

  await $fetch(`/api/images/${id}`, { method: 'DELETE' });

  toast.add({
    title: 'Image chat deleted',
    description: 'Your image chat has been deleted',
    icon: 'i-lucide-trash',
  });

  refreshImageChats();

  if (route.params.id === id) {
    navigateTo('/images');
  }
}

async function deleteVideoChat(id: string) {
  const instance = deleteVideoChatModal.open();
  const result = await instance.result;
  if (!result) {
    return;
  }

  await $fetch(`/api/videos/${id}`, { method: 'DELETE' });

  toast.add({
    title: 'Video chat deleted',
    description: 'Your video chat has been deleted',
    icon: 'i-lucide-trash',
  });

  refreshVideoChats();

  if (route.params.id === id) {
    navigateTo('/videos');
  }
}

const links = computed(() => {
  const chatChildren = [
    {
      label: 'New Chat',
      to: '/chat',
      icon: 'i-lucide-plus',
    },
  ];

  if (chatGroups.value && chatGroups.value.length > 0) {
    chatGroups.value.forEach((group) => {
      chatChildren.push({
        label: group.label,
        type: 'label' as const,
      } as any);

      group.items.forEach((item: any) => {
        chatChildren.push({
          ...item,
          slot: 'chat' as const,
          icon: undefined,
          class: item.label === 'Untitled' ? 'text-muted' : '',
        } as any);
      });
    });
  }

  const imageChildren = [
    {
      label: 'New Image',
      to: '/images',
      icon: 'i-lucide-plus',
    },
  ];

  if (imageChatGroups.value && imageChatGroups.value.length > 0) {
    imageChatGroups.value.forEach((group) => {
      imageChildren.push({
        label: group.label,
        type: 'label' as const,
      } as any);

      group.items.forEach((item: any) => {
        imageChildren.push({
          ...item,
          slot: 'image-chat' as const,
          icon: undefined,
          class: item.label === 'Untitled' ? 'text-muted' : '',
        } as any);
      });
    });
  }

  const videoChildren = [
    {
      label: 'New Video',
      to: '/videos',
      icon: 'i-lucide-plus',
    },
  ];

  if (videoChatGroups.value && videoChatGroups.value.length > 0) {
    videoChatGroups.value.forEach((group) => {
      videoChildren.push({
        label: group.label,
        type: 'label' as const,
      } as any);

      group.items.forEach((item: any) => {
        videoChildren.push({
          ...item,
          slot: 'video-chat' as const,
          icon: undefined,
          class: item.label === 'Untitled' ? 'text-muted' : '',
        } as any);
      });
    });
  }

  const mainLinks = [
    {
      label: 'Home',
      icon: 'i-lucide-house',
      to: '/dashboard',
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: 'AI Chat',
      type: 'trigger',
      defaultOpen: true,
      icon: 'i-lucide-message-circle',
      children: chatChildren,
    } as NavigationMenuItem,
    {
      label: 'Image Generation',
      type: 'trigger',
      defaultOpen: true,
      icon: 'i-lucide-image',
      children: imageChildren,
    } as NavigationMenuItem,
    {
      label: 'Video Generation',
      type: 'trigger',
      defaultOpen: true,
      icon: 'i-lucide-video',
      children: videoChildren,
    } as NavigationMenuItem,
  ];

  if (supportsEscalation.value) {
    mainLinks.push({
      label: 'Questions',
      icon: 'i-lucide-inbox',
      to: '/dashboard/questions',
      onSelect: () => {
        open.value = false;
      },
    });
  }

  const configurationChildren = [];

  if (isAdmin.value) {
    configurationChildren.push({
      label: 'Basic Setup',
      to: '/configuration/basic',
      icon: 'i-lucide-settings',
    });
  }

  if (projectId.value) {
    configurationChildren.push({
      label: 'Knowledge Base',
      to: '/configuration/knowledge',
      icon: 'i-lucide-book-open',
    });

    if (hasFiles.value && isAdmin.value) {
      configurationChildren.push({
        label: 'Project Customization',
        to: '/configuration/customization',
        icon: 'i-lucide-shield-check',
      });
    }
  }

  mainLinks.push({
    label: 'Configuration',
    defaultOpen: true,
    type: 'trigger',
    icon: 'i-lucide-cog',
    children: configurationChildren,
  } as NavigationMenuItem);

  if (projectId.value) {
    if (isAdmin.value) {
      mainLinks.push({
        label: 'Billing',
        onSelect: () => {
          open.value = false;
        },
        icon: 'i-lucide-credit-card',
        to: '/dashboard/billing',
      });
    }

    mainLinks.push({
      label: 'Members',
      to: '/dashboard/members',
      onSelect: () => {
        open.value = false;
      },
      icon: 'i-lucide-users',
    });
  }

  return [
    mainLinks,
    [
      {
        label: 'Support & Feedback',
        icon: 'i-lucide-message-circle',
        onClick: () => {
          feedbackModalOpen.value = true;
          open.value = false;
        },
      },
    ],
  ] satisfies NavigationMenuItem[][];
});

onMounted(async () => {
  const cookie = useCookie('cookie-consent');
  if (cookie.value === 'accepted') {
    return;
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted';
        },
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <ProjectsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteChat((item as any).id)"
              />
            </div>
          </template>

          <template #image-chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteImageChat((item as any).id)"
              />
            </div>
          </template>

          <template #video-chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="deleteVideoChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>

        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center gap-2" :class="collapsed ? 'justify-center' : 'justify-between'">
          <UserMenu :collapsed="collapsed" />
          <UColorModeButton v-if="!collapsed" size="sm" />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />

    <FeedbackModal v-model="feedbackModalOpen" />
  </UDashboardGroup>
</template>
