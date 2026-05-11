-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `due_date` TIMESTAMP(0) NULL,
    MODIFY `priority` ENUM('low', 'medium', 'high', 'critical') NULL;
