/*
  Warnings:

  - You are about to drop the column `scheduleTime` on the `Notification` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "expoPushToken" TEXT NOT NULL,
    "routeStageId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_routeStageId_fkey" FOREIGN KEY ("routeStageId") REFERENCES "RouteStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "expoPushToken", "id", "isSent", "message", "routeStageId", "tripId", "updatedAt", "userId") SELECT "createdAt", "expoPushToken", "id", "isSent", "message", "routeStageId", "tripId", "updatedAt", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_expoPushToken_idx" ON "Notification"("userId", "expoPushToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
