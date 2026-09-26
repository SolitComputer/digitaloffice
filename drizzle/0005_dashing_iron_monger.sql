CREATE TABLE `two_factors` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`verified` boolean NOT NULL DEFAULT true,
	`failed_verification_count` int NOT NULL DEFAULT 0,
	`locked_until` timestamp,
	CONSTRAINT `two_factors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_enabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `two_factors` ADD CONSTRAINT `two_factors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `two_factors_user_id_idx` ON `two_factors` (`user_id`);