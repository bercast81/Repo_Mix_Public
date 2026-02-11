-- CreateTable
CREATE TABLE "Bike" (
    "id" INT4 NOT NULL,
    "dockId" INT4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bike_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bike" ADD CONSTRAINT "Bike_dockId_fkey" FOREIGN KEY ("dockId") REFERENCES "Dock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
