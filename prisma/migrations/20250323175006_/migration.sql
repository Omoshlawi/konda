-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FleetRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FleetRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FleetRoute_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FleetRoute" ("createdAt", "fleetId", "id", "routeId", "updatedAt", "voided") SELECT "createdAt", "fleetId", "id", "routeId", "updatedAt", "voided" FROM "FleetRoute";
DROP TABLE "FleetRoute";
ALTER TABLE "new_FleetRoute" RENAME TO "FleetRoute";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
