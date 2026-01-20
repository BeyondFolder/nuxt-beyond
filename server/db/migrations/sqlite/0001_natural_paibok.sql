CREATE TABLE `videoChatMessages` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`prompt` text,
	`videoUrl` text,
	`jobId` text,
	`status` text,
	`previousVideoId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `videoChats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `videoChatMessageChatIdx` ON `videoChatMessages` (`chatId`);--> statement-breakpoint
CREATE TABLE `videoChats` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `videoChatUserIdx` ON `videoChats` (`userId`);