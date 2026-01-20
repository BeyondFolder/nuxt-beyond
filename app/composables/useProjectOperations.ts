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

  const deleteProject = async (projectId: string) => {
    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      await fetch();
      showSuccess('Project deleted successfully');
      await navigateTo('/dashboard');
    } catch (error) {
      handleError(error, 'Failed to delete project');
    }
  };

  const createProject = async (data: { name: string; description?: string }) => {
    try {
      await $fetch('/api/projects', {
        method: 'POST',
        body: data,
      });

      await fetch();
      showSuccess('Project created successfully!');
    } catch (error) {
      handleError(error, 'Error creating project');
      throw error;
    }
  };

  const updateProject = async (projectId: string, data: { name: string; description?: string }) => {
    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: data,
      });

      await fetch();
      showSuccess('Project updated successfully!');
    } catch (error) {
      handleError(error, 'Error updating project');
      throw error;
    }
  };

  return {
    switchProject,
    deleteProject,
    createProject,
    updateProject,
  };
};
