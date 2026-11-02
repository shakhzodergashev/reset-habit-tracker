-- Who climbs the hill: "boy" or "girl". Everyone starts as the boy (as before).
ALTER TABLE "User" ADD COLUMN "climber" VARCHAR(8) NOT NULL DEFAULT 'boy';
