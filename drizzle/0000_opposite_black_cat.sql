CREATE TABLE `scheduled_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`social_account_id` text NOT NULL,
	`media_type` text NOT NULL,
	`media_url` text NOT NULL,
	`caption` text,
	`scheduled_at` integer NOT NULL,
	`status` text NOT NULL,
	`publish_attempts` integer DEFAULT 0 NOT NULL,
	`platform_post_id` text,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`platform_account_id` text NOT NULL,
	`username` text NOT NULL,
	`connection_status` text NOT NULL,
	`token_reference` text,
	`token_expires_at` integer,
	`connected_at` integer NOT NULL,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`platform_post_id` text NOT NULL,
	`social_account_id` text NOT NULL,
	`media_type` text NOT NULL,
	`media_url` text,
	`caption` text,
	`permalink` text,
	`published_at` integer NOT NULL
);
