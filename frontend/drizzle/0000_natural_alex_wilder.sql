CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`room_id` integer NOT NULL,
	`date` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`attendees` integer NOT NULL,
	`user_name` text NOT NULL,
	`purpose` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`cancelled_at` integer,
	`cancel_month` text,
	`cancellation_outcome` text,
	`rating_delta` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_room" CHECK("bookings"."room_id" BETWEEN 1 AND 23),
	CONSTRAINT "valid_status" CHECK("bookings"."status" IN ('active','completed','cancelled')),
	CONSTRAINT "valid_interval" CHECK("bookings"."start_time" >= 480 AND "bookings"."end_time" <= 1320 AND "bookings"."end_time" - "bookings"."start_time" BETWEEN 30 AND 240 AND "bookings"."starts_at" < "bookings"."ends_at"),
	CONSTRAINT "valid_attendees" CHECK("bookings"."attendees" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_user_time` ON `bookings` (`user_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `idx_bookings_room_date` ON `bookings` (`room_id`,`date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_bookings_created` ON `bookings` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_bookings_completion` ON `bookings` (`status`,`ends_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expiry` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`university_id` text,
	`role` text DEFAULT 'student' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "valid_role" CHECK("users"."role" IN ('student','teacher'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_university_id_unique` ON `users` (`university_id`);