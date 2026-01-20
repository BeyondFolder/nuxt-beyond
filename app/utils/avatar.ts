import type { ProjectConfiguration } from '#shared/types';

export const generateAvatarUrl = (
  name: string,
  options?: {
    background?: string;
    color?: string;
    size?: number;
  }
) => {
  const { background = '0ea5e9', color = 'fff', size = 40 } = options || {};
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=${color}&size=${size}`;
};

export const createProjectAvatar = (project: Project | undefined, siteUrl: string) => {
  return {
    src: (project?.configuration as ProjectConfiguration)?.appearance?.logo && project?.id
      ? `${siteUrl}/projects/${project.id}/logo`
      : generateAvatarUrl(project?.name || 'Chat', { background: '0ea5e9', color: 'fff' }),
    alt: project?.name || 'Chat',
  };
};
