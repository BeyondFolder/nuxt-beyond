export const useErrorHandling = () => {
  const toast = useToast();

  const handleError = (error: any, defaultMessage = 'An error occurred', message: string | null = null) => {
    console.error(error);
    const finalMessage = message ?? (error?.data?.message || error?.message || defaultMessage);
    toast.add({
      title: defaultMessage,
      description: finalMessage,
      color: 'error',
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast.add({
      title: message,
      description,
      color: 'success',
    });
  };

  return {
    handleError,
    showSuccess,
  };
};
