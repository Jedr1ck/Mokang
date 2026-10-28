-- Consolidated STRUCTURE-ONLY schema for the smarthomes database
-- Generated from the uploaded phpMyAdmin export.
-- Contains CREATE TABLE definitions, indexes, AUTO_INCREMENT settings, and foreign keys.
-- INSERT/data statements and personal records have been excluded.

CREATE DATABASE IF NOT EXISTS `smarthomes` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smarthomes`;

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- Source: smarthomes_table_bookings.sql
CREATE TABLE `bookings` (
  `id` bigint(20) NOT NULL,
  `booking_code` varchar(30) NOT NULL,
  `homeowner_id` bigint(20) NOT NULL,
  `provider_id` bigint(20) DEFAULT NULL,
  `category_id` bigint(20) DEFAULT NULL,
  `service_name` varchar(150) DEFAULT NULL,
  `preferred_date` date NOT NULL,
  `preferred_time` time NOT NULL,
  `address` text NOT NULL,
  `description` text NOT NULL,
  `status` enum('Pending','Matched','Accepted','On the Way','In Progress','Completed','Cancelled','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_booking_status_history.sql
CREATE TABLE `booking_status_history` (
  `id` bigint(20) NOT NULL,
  `booking_id` bigint(20) NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `changed_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_messages.sql
CREATE TABLE `messages` (
  `id` bigint(20) NOT NULL,
  `sender_id` bigint(20) NOT NULL,
  `recipient_id` bigint(20) NOT NULL,
  `booking_id` bigint(20) DEFAULT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_notifications.sql
CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(150) NOT NULL,
  `body` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_provider_profiles.sql
CREATE TABLE `provider_profiles` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `business_name` varchar(150) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `availability_status` varchar(50) DEFAULT 'Available',
  `verification_status` varchar(30) NOT NULL DEFAULT 'incomplete',
  `verification_submitted_at` datetime DEFAULT NULL,
  `verification_reviewed_at` datetime DEFAULT NULL,
  `verification_reviewed_by` bigint(20) DEFAULT NULL,
  `verification_review_notes` text DEFAULT NULL,
  `region_name` varchar(120) DEFAULT NULL,
  `province_name` varchar(120) DEFAULT NULL,
  `city_municipality_name` varchar(120) DEFAULT NULL,
  `barangay_name` varchar(120) DEFAULT NULL,
  `street_address` varchar(255) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `id_type` varchar(80) DEFAULT NULL,
  `id_front_path` varchar(500) DEFAULT NULL,
  `id_back_path` varchar(500) DEFAULT NULL,
  `qualifications` text DEFAULT NULL,
  `portfolio_paths` text DEFAULT NULL,
  `service_area` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_provider_services.sql
CREATE TABLE `provider_services` (
  `id` bigint(20) NOT NULL,
  `provider_id` bigint(20) NOT NULL,
  `category_id` bigint(20) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_reviews.sql
CREATE TABLE `reviews` (
  `id` bigint(20) NOT NULL,
  `booking_id` bigint(20) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complaint reports are separate from reviews so admins can track resolution.
CREATE TABLE `complaints` (
  `id` bigint(20) NOT NULL,
  `booking_id` bigint(20) NOT NULL,
  `homeowner_id` bigint(20) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_service_categories.sql
CREATE TABLE `service_categories` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_users.sql
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('homeowner','provider','admin') NOT NULL DEFAULT 'homeowner',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_seen_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source: smarthomes_table_user_profiles.sql
CREATE TABLE `user_profiles` (
  `user_id` bigint(20) NOT NULL,
  `mobile_number` varchar(30) DEFAULT NULL,
  `gender` varchar(30) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `profile_picture` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes, AUTO_INCREMENT values, and foreign-key constraints
--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_code` (`booking_code`),
  ADD KEY `homeowner_id` (`homeowner_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `recipient_id` (`recipient_id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `provider_profiles`
--
ALTER TABLE `provider_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_provider_verification_status` (`verification_status`);

--
-- Indexes for table `provider_services`
--
ALTER TABLE `provider_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_provider_services_provider` (`provider_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `homeowner_id` (`homeowner_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provider_profiles`
--
ALTER TABLE `provider_profiles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `provider_services`
--
ALTER TABLE `provider_services`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`homeowner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`);

--
-- Constraints for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD CONSTRAINT `booking_status_history_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`homeowner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `provider_profiles`
--
ALTER TABLE `provider_profiles`
  ADD CONSTRAINT `provider_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `provider_services`
--
ALTER TABLE `provider_services`
  ADD CONSTRAINT `provider_services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `provider_profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `provider_services_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
