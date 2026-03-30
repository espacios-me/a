CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
	`encryptedToken` text,
	`encryptedRefreshToken` text,
	`encryptedCredentials` text,
	`expiresAt` timestamp,
	`lastSyncedAt` timestamp,
	`errorMessage` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oauthStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`state` varchar(256) NOT NULL,
	`codeVerifier` varchar(256),
	`provider` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oauthStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauthStates_state_unique` UNIQUE(`state`)
);
