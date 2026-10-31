-- Habits no longer have a colour or a preset icon; instead the user picks their own emoji.
ALTER TABLE "Habit" DROP COLUMN "color",
DROP COLUMN "icon",
ADD COLUMN     "emoji" VARCHAR(32);
