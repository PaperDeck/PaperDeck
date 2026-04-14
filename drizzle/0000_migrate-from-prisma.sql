CREATE TABLE `Article` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`summary` text,
	`content` text,
	`pubDate` text NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`feedUrl` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`feedUrl`) REFERENCES `Feed`(`url`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Article_pubDate_id_idx` ON `Article` (`pubDate`,`id`);--> statement-breakpoint
CREATE INDEX `Article_isRead_idx` ON `Article` (`isRead`);--> statement-breakpoint
CREATE TABLE `Feed` (
	`url` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
