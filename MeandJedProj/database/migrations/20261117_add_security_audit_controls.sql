-- MariaDB 10.2+ / MySQL 8+. Run once against the application database.
CREATE TABLE IF NOT EXISTS `login_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `attempted_identifier` varchar(255) NOT NULL,
  `success` boolean NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_history_user_created` (`user_id`, `created_at`),
  KEY `idx_login_history_created` (`created_at`),
  CONSTRAINT `login_history_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` varchar(80) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `actor_user_id` bigint DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`, `created_at`),
  KEY `idx_audit_actor_created` (`actor_user_id`, `created_at`),
  CONSTRAINT `audit_logs_actor_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS `trg_bookings_status_audit`;
DELIMITER //
CREATE TRIGGER `trg_bookings_status_audit` AFTER UPDATE ON `bookings`
FOR EACH ROW
BEGIN
  IF NOT (OLD.`status` <=> NEW.`status`) THEN
    INSERT INTO `audit_logs` (`entity_type`, `entity_id`, `action`, `details`)
    VALUES ('booking', CAST(NEW.`id` AS CHAR), 'status_changed',
      JSON_OBJECT('old_status', OLD.`status`, 'new_status', NEW.`status`));
  END IF;
END//
DELIMITER ;

-- Domain constraints are also enforced by the existing role/status ENUMs,
-- NOT NULL, UNIQUE and foreign key constraints in schema.sql.
