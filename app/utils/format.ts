import type { PlanName } from '#shared/constants';

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getPlanColor = (plan: PlanName): 'secondary' | 'primary' | 'success' | 'info' | 'warning' => {
  const colors: Record<PlanName, 'secondary' | 'primary' | 'success' | 'info' | 'warning'> = {
    free: 'secondary',
    boilerplate: 'success',
    bundle: 'info',
  };
  return colors[plan] || 'warning';
};

export const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
  const colors: Record<string, 'success' | 'warning' | 'error'> = {
    active: 'success',
    pending: 'warning',
    inactive: 'error',
  };
  return colors[status] || 'warning';
};

export const getRoleColor = (role: string): 'warning' | 'primary' => {
  return role === 'admin' ? 'warning' : 'primary';
};
