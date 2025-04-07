-- AlterTable
ALTER TABLE "User" ADD COLUMN "expoPushToken" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "expoPushToken" TEXT NOT NULL,
    "routeStageId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduleTime" DATETIME NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_routeStageId_fkey" FOREIGN KEY ("routeStageId") REFERENCES "RouteStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Notification_userId_expoPushToken_idx" ON "Notification"("userId", "expoPushToken");
