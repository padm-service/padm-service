CREATE TABLE `assistance` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT '🌐' NOT NULL,
	`description` text NOT NULL,
	`knowledge` text,
	`level` integer DEFAULT 1 NOT NULL,
	`userId` text,
	`services` text
);
--> statement-breakpoint
CREATE TABLE `chat` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`summary` text NOT NULL,
	`userId` text NOT NULL,
	`assistantId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text,
	`userId` text NOT NULL,
	`partitionID` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`userId` text,
	`type` text,
	`object_key` text,
	`state` text,
	`pre_signed_url` text,
	`size` integer,
	`method` text NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE TABLE `k2t` (
	`id` text PRIMARY KEY NOT NULL,
	`keyId` text NOT NULL,
	`token` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `key` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`purpose` text NOT NULL,
	`prefix` text NOT NULL,
	`secret` text NOT NULL,
	`secret_truncated` text NOT NULL,
	`services` text NOT NULL,
	`userId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `msg` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`content` text NOT NULL,
	`role` text NOT NULL,
	`assistantId` text NOT NULL,
	`chatId` text NOT NULL,
	`userId` text NOT NULL,
	`model` text NOT NULL,
	`temperature` text NOT NULL,
	`top_p` text NOT NULL,
	`knowledge` text NOT NULL,
	`retrieval` integer NOT NULL,
	`systemPrompt` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `node` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`serviceId` text NOT NULL,
	`userId` text NOT NULL,
	`state` text NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `partition` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`userId` text NOT NULL,
	`collectionId` text NOT NULL,
	`url` text NOT NULL,
	`fileSize` text NOT NULL,
	`state` text NOT NULL,
	`segment` integer NOT NULL,
	`fileName` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`readme` text NOT NULL,
	`level` text NOT NULL,
	`schema` text,
	`tools` text DEFAULT '[]',
	`unit_price` integer NOT NULL,
	`userId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT '😊' NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`email` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'normal' NOT NULL,
	`permission` text,
	`scope` text DEFAULT 'user' NOT NULL,
	`secret` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `tasks`;