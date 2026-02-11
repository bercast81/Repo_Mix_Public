import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Bike } from "../proto/DriveYourCity/Bike";

export interface IBikePersistence {
    createBike(bike: Bike): Promise<Bike>;
    getAllBikes(): Promise<Bike[]>
    getBikeById(id:number): Promise<Bike | undefined>
    updateBike(id: number, bike: Partial<Bike>): Promise<Bike | undefined>
}

export class CockroachDBBikePersistence implements IBikePersistence {

    private _prisma;

    constructor() {
        this._prisma = prisma;
    }

    async createBike(bike: Bike): Promise<Bike> {
        const input: Prisma.BikeCreateInput = {
            id: bike.id!,
        }
        const newBike = await this._prisma.bike.create({ data: input });
        return newBike;
    }
    async getAllBikes(): Promise<Bike[]> {
        return this._prisma.bike.findMany();        
    }
    async getBikeById(id: number): Promise<Bike | undefined> {
        const bike = await this._prisma.bike.findFirst({
            where: {
              id,
            },
            include: {
                dock: true,
            },
          });        
        return bike as Bike;
    }
    async updateBike(id: number, bike: Partial<Bike>): Promise<Bike | undefined> {
        const data: Prisma.BikeUpdateInput = bike as Prisma.BikeUpdateInput;
        if(bike.dock) {
            data.dock = { connect: { id: bike.dock?.id }};
        } else {
            data.dock = { disconnect: true};
        }                
        const updatedBike = await prisma.bike.update({
            where: { id },
            data
        });
        return updatedBike;
    }
}