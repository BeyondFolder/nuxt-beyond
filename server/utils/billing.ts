import { PLANS_CONSTANTS } from '#shared/constants';
import type { ProjectConfiguration } from '#shared/types';

export function validateFileUploadLimit(project: Project): { currentCount: number; maxFiles: number } {
  const maxFiles = PLANS_CONSTANTS[project.planName].MAX_NB_OF_FILES;

  const config = project?.configuration as ProjectConfiguration;
  const currentCount = config?.fileCount || 0;

  if (currentCount >= maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `File limit reached. You can upload a maximum of ${maxFiles} file(s). Please remove some files or upgrade your plan.`,
    });
  }

  return {
    currentCount,
    maxFiles,
  };
}
