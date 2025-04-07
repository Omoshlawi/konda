/*
  Warnings:

  - You are about to drop the column `currentStageId` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `toStageId` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `activeDays` to the `RoutePricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activeDays` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direction` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Passenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passengerId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "seatNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Ticket_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoutePricing" (
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
    "activeDays" TEXT NOT NULL,
    CONSTRAINT "RoutePricing_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoutePricing_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoutePricing_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RoutePricing" ("createdAt", "fromStageId", "id", "price", "routeId", "timeEnd", "timeStart", "toStageId", "updatedAt", "voided") SELECT "createdAt", "fromStageId", "id", "price", "routeId", "timeEnd", "timeStart", "toStageId", "updatedAt", "voided" FROM "RoutePricing";
DROP TABLE "RoutePricing";
ALTER TABLE "new_RoutePricing" RENAME TO "RoutePricing";
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fleetId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "activeDays" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    CONSTRAINT "Trip_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "fleetId", "id", "routeId", "updatedAt", "voided") SELECT "createdAt", "fleetId", "id", "routeId", "updatedAt", "voided" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_userId_key" ON "Passenger"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_contact_key" ON "Passenger"("contact");
