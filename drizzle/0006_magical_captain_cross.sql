CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`sku` varchar(60),
	`name` varchar(200) NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'pcs',
	`cost_price` bigint NOT NULL DEFAULT 0,
	`sell_price` bigint NOT NULL DEFAULT 0,
	`stock` int NOT NULL DEFAULT 0,
	`min_stock` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_tenant_id_id_uq` UNIQUE(`tenant_id`,`id`),
	CONSTRAINT `products_tenant_sku_uq` UNIQUE(`tenant_id`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`type` enum('IN','OUT','ADJUST') NOT NULL,
	`quantity_change` int NOT NULL,
	`stock_after` int NOT NULL,
	`note` varchar(255),
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_fk` FOREIGN KEY (`tenant_id`,`product_id`) REFERENCES `products`(`tenant_id`,`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `products_tenant_name_idx` ON `products` (`tenant_id`,`name`);--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`tenant_id`,`product_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `stock_movements_tenant_date_idx` ON `stock_movements` (`tenant_id`,`created_at`);