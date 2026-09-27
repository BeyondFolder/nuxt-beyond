export const useProjectOperations = () => {
  const { fetch } = useUserSession();
  const { handleError, showSuccess } = useErrorHandling();

  const switchProject = async (projectId: string) => {
    try {
      await $fetch('/api/projects/switch', {
        method: 'POST',
        body: { projectId },
      });

      await fetch();
      showSuccess('Project switched successfully');
    } catch (error) {
      handleError(error, 'Failed to switch project');
    }
  };

  return {
    switchProject,
  };
};
