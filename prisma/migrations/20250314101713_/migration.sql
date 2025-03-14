-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "dynamicPriceFactor" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Pricing_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pricing_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pricing_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pricing" ("basePrice", "createdAt", "dynamicPriceFactor", "fromStageId", "id", "routeId", "toStageId", "updatedAt") SELECT "basePrice", "createdAt", "dynamicPriceFactor", "fromStageId", "id", "routeId", "toStageId", "updatedAt" FROM "Pricing";
DROP TABLE "Pricing";
ALTER TABLE "new_Pricing" RENAME TO "Pricing";
CREATE TABLE "new_Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "radius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Stage_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stage" ("createdAt", "id", "latitude", "longitude", "name", "order", "radius", "routeId", "updatedAt") SELECT "createdAt", "id", "latitude", "longitude", "name", "order", "radius", "routeId", "updatedAt" FROM "Stage";
DROP TABLE "Stage";
ALTER TABLE "new_Stage" RENAME TO "Stage";
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passengerId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "pricePaid" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Ticket_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("fromStageId", "id", "issuedAt", "passengerId", "paymentStatus", "pricePaid", "toStageId", "tripId") SELECT "fromStageId", "id", "issuedAt", "passengerId", "paymentStatus", "pricePaid", "toStageId", "tripId" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
