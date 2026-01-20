import type { users, projects, chats, messages } from 'hub:db:schema';

export interface ProjectConfiguration {
  fileCount?: number;
  filesUpdatedAt?: Date;
  requestProcessingAt?: Date;
  requestProcessingJobId?: string;
  finishedProcessingAt?: Date;
  appearance?: {
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
    logo?: string;
  };
  chat?: {
    initialQuestions?: string[];
    customPrompt?: string;
  };
  security?: {
    allowedDomains?: string[];
  };
}

export interface EmbedSession {
  chatId: string;
  projectId: string;
  origin: string;
}

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ChatWithMessages = Chat & { messages: Message[] };
