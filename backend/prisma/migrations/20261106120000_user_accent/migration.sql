-- The app colour the user picked. Everyone starts with RESET purple (as before).
ALTER TABLE "User" ADD COLUMN "accent" VARCHAR(10) NOT NULL DEFAULT 'purple';
