-- DropForeignKey
ALTER TABLE "Bike" DROP CONSTRAINT "Bike_dockId_fkey";

-- CreateTable
CREATE TABLE "Ride" (
    "id" INT4 NOT NULL,
    "km" INT4 NOT NULL,
    "bikeId" INT4 NOT NULL,
    "originDockId" INT4 NOT NULL,
    "targetDockId" INT4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bike" ADD CONSTRAINT "Bike_dockId_fkey" FOREIGN KEY ("dockId") REFERENCES "Dock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_originDockId_fkey" FOREIGN KEY ("originDockId") REFERENCES "Dock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_targetDockId_fkey" FOREIGN KEY ("targetDockId") REFERENCES "Dock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
