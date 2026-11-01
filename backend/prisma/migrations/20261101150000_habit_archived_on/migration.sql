-- Remember the day a habit was archived, so its days still count up to then.

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "archivedOn" DATE;

-- Habits archived before this change: their last update was the archiving,
-- so use that day.
UPDATE "Habit"
SET "archivedOn" = ("updatedAt" AT TIME ZONE 'UTC')::date
WHERE "isArchived" = true;
