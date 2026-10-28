SET @user_last_seen_column = (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'last_seen_at'
  LIMIT 1
);

SET @add_user_last_seen_column = IF(
  @user_last_seen_column IS NULL,
  'ALTER TABLE `users` ADD COLUMN `last_seen_at` datetime DEFAULT NULL',
  'SELECT 1'
);
PREPARE add_user_last_seen_column_stmt FROM @add_user_last_seen_column;
EXECUTE add_user_last_seen_column_stmt;
DEALLOCATE PREPARE add_user_last_seen_column_stmt;
