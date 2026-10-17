CREATE TABLE `mood_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`text` text NOT NULL,
	`primary_color` text NOT NULL,
	`secondary_color` text NOT NULL,
	`speed` real NOT NULL,
	`turbulence` real NOT NULL,
	`tags` text NOT NULL,
	`echo` text NOT NULL
);
