/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Fleet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Fleet_name_operatorId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Fleet_name_key" ON "Fleet"("name");
