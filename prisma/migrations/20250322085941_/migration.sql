/*
  Warnings:

  - You are about to drop the column `voided` on the `RouteStage` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RouteStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RouteStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RouteStage_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RouteStage" ("createdAt", "id", "order", "routeId", "stageId", "updatedAt") SELECT "createdAt", "id", "order", "routeId", "stageId", "updatedAt" FROM "RouteStage";
DROP TABLE "RouteStage";
ALTER TABLE "new_RouteStage" RENAME TO "RouteStage";
CREATE UNIQUE INDEX "RouteStage_routeId_stageId_key" ON "RouteStage"("routeId", "stageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
