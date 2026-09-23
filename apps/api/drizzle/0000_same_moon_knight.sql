CREATE TABLE `work_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'RECEIVED' NOT NULL,
	`category` text,
	`priority` text,
	`summary` text,
	`recommended_action` text,
	`ai_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_items_external_id_unique` ON `work_items` (`external_id`);