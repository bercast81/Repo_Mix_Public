import { prisma } from "./../utils/prisma";
import { Prisma } from "@prisma/client";
import { Dock } from "../proto/DriveYourCity/Dock";

export interface IDockPersistence {
    createDock(dock: Dock): Promise<Dock>;
    getAllDocks(): Promise<Dock[]>;
    getDockById(id:number): Promise<Dock | undefined>;
    isDockAvailable(id: number): Promise<boolean>;
}

export class CockroachDBDockPersistence implements IDockPersistence {

    private _prisma;

    constructor() {
        this._prisma = prisma;
    }    

    async createDock(dock: Dock): Promise<Dock> {
        const input = dock as Prisma.DockCreateInput;
        const newDock = await this._prisma.dock.create({ data: input });
        return newDock;        
    }
    async getAllDocks(): Promise<Dock[]> {
        return this._prisma.dock.findMany();        
    }
    async getDockById(id: number): Promise<Dock | undefined> {
        const dock = await this._prisma.dock.findFirst({
            where: {
              id,
            },
            include: {
                bikes: true,
            }
          });
        return dock as Dock;
    }
    async isDockAvailable(id: number): Promise<boolean> {                
        const result = await prisma.$queryRaw<{is_available: false}[]>`
            SELECT (SELECT COUNT(*) as numBikes
                    FROM "Bike",
                        "Dock"
                    WHERE "Dock".id = "Bike"."dockId"
                    AND "Dock".id = ${id}) < "maxBikes" as is_available
            FROM "Dock"
            WHERE "Dock".id = ${id};
        `;        
        if(result.length) {
            return result[0].is_available;
        }
        return false;
    }
}