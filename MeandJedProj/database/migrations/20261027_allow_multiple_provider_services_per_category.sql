SET @provider_service_provider_index = (
  SELECT index_name
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'provider_services'
    AND non_unique = 1
    AND column_name = 'provider_id'
    AND seq_in_index = 1
  LIMIT 1
);

SET @add_provider_service_provider_index = IF(
  @provider_service_provider_index IS NULL,
  'ALTER TABLE `provider_services` ADD INDEX `idx_provider_services_provider` (`provider_id`)',
  'SELECT 1'
);
PREPARE add_provider_service_provider_index_stmt
  FROM @add_provider_service_provider_index;
EXECUTE add_provider_service_provider_index_stmt;
DEALLOCATE PREPARE add_provider_service_provider_index_stmt;

SET @provider_service_unique_index = (
  SELECT index_name
  FROM (
    SELECT index_name
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'provider_services'
      AND non_unique = 0
    GROUP BY index_name
    HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',')
      = 'provider_id,category_id'
  ) AS matching_indexes
  LIMIT 1
);

SET @drop_provider_service_unique_index = IF(
  @provider_service_unique_index IS NULL,
  'SELECT 1',
  CONCAT(
    'ALTER TABLE `provider_services` DROP INDEX `',
    REPLACE(@provider_service_unique_index, '`', '``'),
    '`'
  )
);
PREPARE drop_provider_service_unique_index_stmt
  FROM @drop_provider_service_unique_index;
EXECUTE drop_provider_service_unique_index_stmt;
DEALLOCATE PREPARE drop_provider_service_unique_index_stmt;
