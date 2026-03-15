/*
  Warnings:

  - You are about to drop the column `analyzed_commit_hash` on the `analysis_reports` table. All the data in the column will be lost.
  - You are about to drop the column `github_commit_hash` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `analyzed_ref` to the `analysis_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `analysis_reports` DROP COLUMN `analyzed_commit_hash`,
    ADD COLUMN `analyzed_ref` VARCHAR(255) NOT NULL,
    ADD COLUMN `github_item_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `github_commit_hash`,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `task_github_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `type` ENUM('pull_request', 'commit') NOT NULL,
    `github_id` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `title` VARCHAR(500) NULL,
    `author` VARCHAR(255) NULL,
    `code_score` DOUBLE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `task_github_items_task_id_fk`(`task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `analysis_reports_github_item_id_fk` ON `analysis_reports`(`github_item_id`);

-- AddForeignKey
ALTER TABLE `task_github_items` ADD CONSTRAINT `task_github_items_task_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analysis_reports` ADD CONSTRAINT `analysis_reports_github_item_id_fk` FOREIGN KEY (`github_item_id`) REFERENCES `task_github_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
