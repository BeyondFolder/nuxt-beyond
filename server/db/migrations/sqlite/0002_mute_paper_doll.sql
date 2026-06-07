ALTER TABLE `projects` ADD `polarCustomerId` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `polarSubscriptionId` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `polarCurrentPeriodEnd` integer;--> statement-breakpoint
CREATE INDEX `projectPlanIdx` ON `projects` (`planName`);--> statement-breakpoint
CREATE INDEX `projectSubscriptionIdx` ON `projects` (`subscriptionStatus`);--> statement-breakpoint
CREATE INDEX `projectStripeSubscriptionIdx` ON `projects` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `projectPolarSubscriptionIdx` ON `projects` (`polarSubscriptionId`);