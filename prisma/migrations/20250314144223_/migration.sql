/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Passenger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `order` on the `Stage` table. All the data in the column will be lost.
  - You are about to drop the column `routeId` on the `Stage` table. All the data in the column will be lost.
  - You are about to drop the column `passengersOnboard` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `toStageId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Made the column `currentStageId` on table `Trip` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Passenger_contact_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Passenger";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Pricing";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ticket";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "RouteStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RouteStage_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RouteStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutePricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RoutePricing_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoutePricing_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoutePricing_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "radius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Stage" ("createdAt", "id", "latitude", "longitude", "name", "radius", "updatedAt", "voided") SELECT "createdAt", "id", "latitude", "longitude", "name", "radius", "updatedAt", "voided" FROM "Stage";
DROP TABLE "Stage";
ALTER TABLE "new_Stage" RENAME TO "Stage";
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fleetId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "currentStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Trip_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "currentStageId", "endedAt", "fleetId", "id", "routeId", "startedAt", "status", "updatedAt", "voided") SELECT "createdAt", "currentStageId", "endedAt", "fleetId", "id", "routeId", "startedAt", "status", "updatedAt", "voided" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RouteStage_routeId_stageId_key" ON "RouteStage"("routeId", "stageId");
