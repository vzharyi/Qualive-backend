/*
Warnings:

- You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
- Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
- Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add nullable columns first
ALTER TABLE `users`
ADD COLUMN `first_name` VARCHAR(100) NULL,
ADD COLUMN `last_name` VARCHAR(100) NULL;

-- Step 2: Migrate data from full_name to first_name and last_name
-- If full_name exists, split it; otherwise use default values
UPDATE `users`
SET
    `first_name` = COALESCE(
        SUBSTRING_INDEX(`full_name`, ' ', 1),
        'User'
    ),
    `last_name` = COALESCE(
        IF(
            LOCATE(' ', `full_name`) > 0,
            SUBSTRING(
                `full_name`,
                LOCATE(' ', `full_name`) + 1
            ),
            SUBSTRING_INDEX(`full_name`, ' ', -1)
        ),
        CONCAT('', `id`)
    )
WHERE
    `first_name` IS NULL
    OR `last_name` IS NULL;

-- Step 3: Set default values for any remaining NULL values
UPDATE `users`
SET
    `first_name` = 'User',
    `last_name` = CONCAT('', `id`)
WHERE
    `first_name` IS NULL
    OR `last_name` IS NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE `users`
MODIFY COLUMN `first_name` VARCHAR(100) NOT NULL,
MODIFY COLUMN `last_name` VARCHAR(100) NOT NULL;

-- Step 5: Drop the old full_name column
ALTER TABLE `users` DROP COLUMN `full_name`;