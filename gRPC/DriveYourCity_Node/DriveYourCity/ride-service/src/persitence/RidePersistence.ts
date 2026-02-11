import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Ride } from "../proto/DriveYourCity/Ride";

export interface IRidePersistence {
    createRide(ride: Ride): Promise<Ride>;
    getAllRides(): Promise<Ride[]>
    getRideById(id:number): Promise<Ride | undefined>
    updateRide(id: number, ride: Ride): Promise<Ride | undefined>
}

export class CockroachDBRidePersistence implements IRidePersistence {

    private _prisma;

    constructor() {
        this._prisma = prisma;
    }

    async createRide(ride: Ride): Promise<Ride> {
        
        const input: Prisma.RideCreateInput = {            
            km: 0,
            bike: {
                connect: { id: ride.bike?.id! }
            },             
            originDock: {
                connect: { id: ride.originDock!.id! }
            }
        };       
        return this._prisma.ride.create({ data: input });
        
    }
    getAllRides(): Promise<Ride[]> {
        throw new Error('Method not implemented.');
    }
    async getRideById(id: number): Promise<Ride | undefined> {
        const ride = await this._prisma.ride.findFirst({
            where: {
                id,
            },
            include: {
                bike: true,
                originDock: true,
                targetDock: true,
            }
        });
        return ride as Ride;
    }
    async updateRide(id: number, ride: Ride): Promise<Ride | undefined> {
        const data: Prisma.RideUpdateInput = ride as Prisma.RideUpdateInput;
        data.targetDock = ride.targetDock ? { connect: { id: ride.targetDock.id }} : { disconnect: true };
        
        let updatedRide = await this._prisma.ride.update({
            where: { id },
            data,
            include: {
                bike: true,
                originDock: true,
                targetDock: true,
            }
        });
    
        
        return updatedRide;
    }

}