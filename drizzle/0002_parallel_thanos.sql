CREATE TABLE `tenant_members` (
	`tenant_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('OWNER','MANAGER','KASIR','STAFF') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenant_members_tenant_id_user_id_pk` PRIMARY KEY(`tenant_id`,`user_id`)
);
--> statement-breakpoint
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tenant_members_user_id_idx` ON `tenant_members` (`user_id`);