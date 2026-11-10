SET @booking_status_column_type = (
  SELECT column_type
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'bookings'
    AND column_name = 'status'
  LIMIT 1
);

SET @add_awaiting_confirmation_status = IF(
  @booking_status_column_type IS NOT NULL
    AND @booking_status_column_type NOT LIKE '%Awaiting Confirmation%',
  "ALTER TABLE `bookings` MODIFY COLUMN `status` enum('Pending','Matched','Accepted','On the Way','In Progress','Awaiting Confirmation','Completed','Cancelled','Rejected') NOT NULL DEFAULT 'Pending'",
  'SELECT 1'
);
PREPARE add_awaiting_confirmation_status_stmt FROM @add_awaiting_confirmation_status;
EXECUTE add_awaiting_confirmation_status_stmt;
DEALLOCATE PREPARE add_awaiting_confirmation_status_stmt;
