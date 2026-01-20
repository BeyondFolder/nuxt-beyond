declare module '#auth-utils' {
  interface User {
    id: string;
    email: string;
    provider: 'credentials' | 'google';
    providerId?: string;
  }

  interface UserSession {
    projectId?: string;
    projectRole?: string;
  }
}

export {};
