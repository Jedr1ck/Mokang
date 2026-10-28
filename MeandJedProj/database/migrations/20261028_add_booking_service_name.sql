SET @booking_service_name_column = (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'bookings'
    AND column_name = 'service_name'
  LIMIT 1
);

SET @add_booking_service_name_column = IF(
  @booking_service_name_column IS NULL,
  'ALTER TABLE `bookings` ADD COLUMN `service_name` varchar(150) DEFAULT NULL',
  'SELECT 1'
);
PREPARE add_booking_service_name_column_stmt FROM @add_booking_service_name_column;
EXECUTE add_booking_service_name_column_stmt;
DEALLOCATE PREPARE add_booking_service_name_column_stmt;
