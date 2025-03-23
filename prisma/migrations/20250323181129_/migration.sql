/*
  Warnings:

  - A unique constraint covering the columns `[routeId,fleetId]` on the table `FleetRoute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FleetRoute_routeId_fleetId_key" ON "FleetRoute"("routeId", "fleetId");
