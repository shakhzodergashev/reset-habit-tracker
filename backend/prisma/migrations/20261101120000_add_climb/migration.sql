-- Climbs: the user picks how long their journey hill is (30, 66, 100 or 365 days).

-- CreateTable
CREATE TABLE "Climb" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "goalDays" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "finishedOn" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Climb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Climb_userId_idx" ON "Climb"("userId");

-- AddForeignKey
ALTER TABLE "Climb" ADD CONSTRAINT "Climb_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
