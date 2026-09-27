import { sql, relations } from 'drizzle-orm';
import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import type { ProjectConfiguration } from '../../shared/types';
import { planNames } from '../../shared/constants';

export const users = sqliteTable(
  'users',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text().notNull().unique(),
    password: text(),
    provider: text({ enum: ['credentials', 'google'] }).notNull(),
    providerId: text(),
    resetToken: text(),
    resetTokenExpiry: integer({ mode: 'timestamp' }),
    verificationToken: text(),
    verificationTokenExpiry: integer({ mode: 'timestamp' }),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [unique().on(t.provider, t.providerId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  projectMembers: many(projectMembers),
  invitationsSent: many(invitations),
  assignedQuestions: many(questions),
  questionReplies: many(questionReplies),
  userChats: many(userChats),
  imageChats: many(imageChats),
  videoChats: many(videoChats),
}));

export const chats = sqliteTable(
  'chats',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text(),
    projectId: text().notNull(),
    origin: text().notNull(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('projectIdIdx').on(t.projectId), index('originIdx').on(t.origin)]
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  project: one(projects, {
    fields: [chats.projectId],
    references: [projects.id],
  }),
  messages: many(messages),
  questions: many(questions),
}));

export const messages = sqliteTable(
  'messages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chatId: text()
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    role: text({ enum: ['user', 'assistant'] }).notNull(),
    parts: text({ mode: 'json' }).notNull(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('chatIdIdx').on(t.chatId)]
);

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const projects = sqliteTable(
  'projects',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text().notNull(),
    description: text(),
    configuration: text({ mode: 'json' }).$type<ProjectConfiguration>(),
    planName: text({ enum: planNames }).notNull(),
    subscriptionStatus: text().notNull().default('active'),
    stripeCustomerId: text(),
    stripeSubscriptionId: text(),
    stripeCurrentPeriodEnd: integer({ mode: 'timestamp' }),
    polarCustomerId: text(),
    polarSubscriptionId: text(),
    polarCurrentPeriodEnd: integer({ mode: 'timestamp' }),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('projectPlanIdx').on(t.planName),
    index('projectSubscriptionIdx').on(t.subscriptionStatus),
    index('projectStripeSubscriptionIdx').on(t.stripeSubscriptionId),
    index('projectPolarSubscriptionIdx').on(t.polarSubscriptionId),
  ]
);

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  invitations: many(invitations),
  chats: many(chats),
  questions: many(questions),
}));

export const projectMembers = sqliteTable(
  'projectMembers',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text({ enum: ['admin', 'member'] }).notNull(),
    joinedAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    unique().on(t.projectId, t.userId),
    index('projectMemberProjectIdx').on(t.projectId),
    index('projectMemberUserIdx').on(t.userId),
  ]
);

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const invitations = sqliteTable(
  'invitations',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    invitedByUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: text({ enum: ['admin', 'member'] }).notNull(),
    status: text({ enum: ['pending', 'accepted', 'declined'] })
      .notNull()
      .default('pending'),
    expiresAt: integer({ mode: 'timestamp' }).notNull(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('invitationProjectIdx').on(t.projectId), index('invitationEmailIdx').on(t.email)]
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedByUserId],
    references: [users.id],
  }),
}));

export const questions = sqliteTable(
  'questions',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    chatId: text()
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userEmail: text().notNull(),
    userName: text(),
    initialQuestion: text().notNull(),
    answer: text(),
    status: text({ enum: ['pending', 'answered', 'added_to_rag', 'closed'] })
      .notNull()
      .default('pending'),
    assignedToUserId: text().references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    answeredAt: integer({ mode: 'timestamp' }),
  },
  (t) => [
    index('questionProjectIdx').on(t.projectId),
    index('questionChatIdx').on(t.chatId),
    index('questionStatusIdx').on(t.status),
  ]
);

export const questionsRelations = relations(questions, ({ one, many }) => ({
  project: one(projects, {
    fields: [questions.projectId],
    references: [projects.id],
  }),
  chat: one(chats, {
    fields: [questions.chatId],
    references: [chats.id],
  }),
  assignedTo: one(users, {
    fields: [questions.assignedToUserId],
    references: [users.id],
  }),
  replies: many(questionReplies),
}));

export const questionReplies = sqliteTable(
  'questionReplies',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: text()
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: text().references(() => users.id, { onDelete: 'set null' }),
    replyText: text().notNull(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('questionReplyQuestionIdx').on(t.questionId)]
);

export const questionRepliesRelations = relations(questionReplies, ({ one }) => ({
  question: one(questions, {
    fields: [questionReplies.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [questionReplies.userId],
    references: [users.id],
  }),
}));

export type QuestionWithReply = typeof questions.$inferSelect & { replies: (typeof questionReplies.$inferSelect)[] };

export const userChats = sqliteTable(
  'userChats',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('userChatUserIdx').on(t.userId)]
);

export const userChatsRelations = relations(userChats, ({ one, many }) => ({
  user: one(users, {
    fields: [userChats.userId],
    references: [users.id],
  }),
  messages: many(userChatMessages),
}));

export const userChatMessages = sqliteTable(
  'userChatMessages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chatId: text()
      .notNull()
      .references(() => userChats.id, { onDelete: 'cascade' }),
    role: text({ enum: ['user', 'assistant'] }).notNull(),
    parts: text({ mode: 'json' }).notNull(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('userChatMessageChatIdx').on(t.chatId)]
);

export const userChatMessagesRelations = relations(userChatMessages, ({ one }) => ({
  chat: one(userChats, {
    fields: [userChatMessages.chatId],
    references: [userChats.id],
  }),
}));

export const imageChats = sqliteTable(
  'imageChats',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('imageChatUserIdx').on(t.userId)]
);

export const imageChatsRelations = relations(imageChats, ({ one, many }) => ({
  user: one(users, {
    fields: [imageChats.userId],
    references: [users.id],
  }),
  messages: many(imageChatMessages),
}));

export const imageChatMessages = sqliteTable(
  'imageChatMessages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chatId: text()
      .notNull()
      .references(() => imageChats.id, { onDelete: 'cascade' }),
    role: text({ enum: ['user', 'assistant'] }).notNull(),
    prompt: text(),
    imageUrl: text(),
    sourceImageUrl: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('imageChatMessageChatIdx').on(t.chatId)]
);

export const imageChatMessagesRelations = relations(imageChatMessages, ({ one }) => ({
  chat: one(imageChats, {
    fields: [imageChatMessages.chatId],
    references: [imageChats.id],
  }),
}));

export const videoChats = sqliteTable(
  'videoChats',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('videoChatUserIdx').on(t.userId)]
);

export const videoChatsRelations = relations(videoChats, ({ one, many }) => ({
  user: one(users, {
    fields: [videoChats.userId],
    references: [users.id],
  }),
  messages: many(videoChatMessages),
}));

export const videoChatMessages = sqliteTable(
  'videoChatMessages',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    chatId: text()
      .notNull()
      .references(() => videoChats.id, { onDelete: 'cascade' }),
    role: text({ enum: ['user', 'assistant'] }).notNull(),
    prompt: text(),
    videoUrl: text(),
    jobId: text(),
    status: text({ enum: ['processing', 'completed', 'failed'] }),
    previousVideoId: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('videoChatMessageChatIdx').on(t.chatId)]
);

export const videoChatMessagesRelations = relations(videoChatMessages, ({ one }) => ({
  chat: one(videoChats, {
    fields: [videoChatMessages.chatId],
    references: [videoChats.id],
  }),
}));
