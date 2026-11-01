-- Habit pauses: every time a habit is archived (and later restored), so the
-- journey can leave it out of exactly the days it was put away.

-- CreateTable
CREATE TABLE "HabitPause" (
    "id" UUID NOT NULL,
    "habitId" UUID NOT NULL,
    "archivedOn" DATE NOT NULL,
    "restoredOn" DATE,

    CONSTRAINT "HabitPause_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HabitPause_habitId_idx" ON "HabitPause"("habitId");

-- AddForeignKey
ALTER TABLE "HabitPause" ADD CONSTRAINT "HabitPause_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Habits that are archived right now become open pauses (not restored yet).
INSERT INTO "HabitPause" ("id", "habitId", "archivedOn")
SELECT gen_random_uuid(), "id", "archivedOn"
FROM "Habit"
WHERE "archivedOn" IS NOT NULL;

-- The pause table replaces this column.
ALTER TABLE "Habit" DROP COLUMN "archivedOn";
