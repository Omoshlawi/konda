-- CreateTable
CREATE TABLE "Fleet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Fleet_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "distanceKm" REAL NOT NULL,
    "estimatedTimeMin" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "radius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stage_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "dynamicPriceFactor" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pricing_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pricing_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pricing_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fleetId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "currentStageId" TEXT,
    "passengersOnboard" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Trip_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "Fleet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "preferredPaymentMethod" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passengerId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "pricePaid" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "Stage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Fleet_plateNumber_key" ON "Fleet"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_contact_key" ON "Passenger"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_contact_key" ON "Operator"("contact");
