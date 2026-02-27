/*
  Warnings:

  - You are about to drop the column `status` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `column_id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `status`,
    ADD COLUMN `column_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `board_columns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `board_columns_project_id_fk`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `tasks_column_id_fk` ON `tasks`(`column_id`);

-- AddForeignKey
ALTER TABLE `board_columns` ADD CONSTRAINT `board_columns_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_column_id_fk` FOREIGN KEY (`column_id`) REFERENCES `board_columns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
