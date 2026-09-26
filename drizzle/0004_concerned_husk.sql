CREATE TABLE `login_attempts` (
	`attempt_key` varchar(255) NOT NULL,
	`failures` int NOT NULL DEFAULT 0,
	`window_started_at` timestamp NOT NULL,
	`locked_until` timestamp,
	CONSTRAINT `login_attempts_attempt_key` PRIMARY KEY(`attempt_key`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `must_change_password` boolean DEFAULT false NOT NULL;