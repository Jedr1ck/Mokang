CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    mobile_number VARCHAR(30),
    gender VARCHAR(30),
    address VARCHAR(500),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

INSERT INTO user_profiles (
    user_id,
    mobile_number,
    gender,
    address
)
SELECT
    id,
    mobile_number,
    gender,
    address
FROM users
WHERE mobile_number IS NOT NULL
   OR gender IS NOT NULL
   OR address IS NOT NULL;

ALTER TABLE users
    DROP COLUMN mobile_number,
    DROP COLUMN gender,
    DROP COLUMN address;

SET @reviewer_fk = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reviews'
      AND COLUMN_NAME = 'reviewer_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
);

SET @drop_reviewer_fk = IF(
    @reviewer_fk IS NULL,
    'SELECT 1',
    CONCAT(
        'ALTER TABLE reviews DROP FOREIGN KEY `',
        REPLACE(@reviewer_fk, '`', '``'),
        '`'
    )
);
PREPARE drop_reviewer_fk_stmt FROM @drop_reviewer_fk;
EXECUTE drop_reviewer_fk_stmt;
DEALLOCATE PREPARE drop_reviewer_fk_stmt;

SET @provider_fk = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reviews'
      AND COLUMN_NAME = 'provider_id'
      AND REFERENCED_TABLE_NAME = 'provider_profiles'
    LIMIT 1
);

SET @drop_provider_fk = IF(
    @provider_fk IS NULL,
    'SELECT 1',
    CONCAT(
        'ALTER TABLE reviews DROP FOREIGN KEY `',
        REPLACE(@provider_fk, '`', '``'),
        '`'
    )
);
PREPARE drop_provider_fk_stmt FROM @drop_provider_fk;
EXECUTE drop_provider_fk_stmt;
DEALLOCATE PREPARE drop_provider_fk_stmt;

ALTER TABLE reviews
    DROP COLUMN reviewer_id,
    DROP COLUMN provider_id;
