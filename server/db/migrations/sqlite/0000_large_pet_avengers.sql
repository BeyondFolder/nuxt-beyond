CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`projectId` text NOT NULL,
	`origin` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projectIdIdx` ON `chats` (`projectId`);--> statement-breakpoint
CREATE INDEX `originIdx` ON `chats` (`origin`);--> statement-breakpoint
CREATE TABLE `imageChatMessages` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`prompt` text,
	`imageUrl` text,
	`sourceImageUrl` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `imageChats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `imageChatMessageChatIdx` ON `imageChatMessages` (`chatId`);--> statement-breakpoint
CREATE TABLE `imageChats` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `imageChatUserIdx` ON `imageChats` (`userId`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`invitedByUserId` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitationProjectIdx` ON `invitations` (`projectId`);--> statement-breakpoint
CREATE INDEX `invitationEmailIdx` ON `invitations` (`email`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chatIdIdx` ON `messages` (`chatId`);--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`joinedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projectMemberProjectIdx` ON `projectMembers` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectMemberUserIdx` ON `projectMembers` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `projectMembers_projectId_userId_unique` ON `projectMembers` (`projectId`,`userId`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`configuration` text,
	`planName` text NOT NULL,
	`subscriptionStatus` text DEFAULT 'active' NOT NULL,
	`stripeCustomerId` text,
	`stripeSubscriptionId` text,
	`stripeCurrentPeriodEnd` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questionReplies` (
	`id` text PRIMARY KEY NOT NULL,
	`questionId` text NOT NULL,
	`userId` text,
	`replyText` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `questionReplyQuestionIdx` ON `questionReplies` (`questionId`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`chatId` text NOT NULL,
	`userEmail` text NOT NULL,
	`userName` text,
	`initialQuestion` text NOT NULL,
	`answer` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`assignedToUserId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`answeredAt` integer,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `questionProjectIdx` ON `questions` (`projectId`);--> statement-breakpoint
CREATE INDEX `questionChatIdx` ON `questions` (`chatId`);--> statement-breakpoint
CREATE INDEX `questionStatusIdx` ON `questions` (`status`);--> statement-breakpoint
CREATE TABLE `userChatMessages` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `userChats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `userChatMessageChatIdx` ON `userChatMessages` (`chatId`);--> statement-breakpoint
CREATE TABLE `userChats` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `userChatUserIdx` ON `userChats` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`provider` text NOT NULL,
	`providerId` text,
	`resetToken` text,
	`resetTokenExpiry` integer,
	`verificationToken` text,
	`verificationTokenExpiry` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_provider_providerId_unique` ON `users` (`provider`,`providerId`);