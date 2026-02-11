import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';

@Injectable()
export class MongoConnectionService {
    
    private dbConnection: Connection

    constructor(private configService: ConfigService){
        this.createConnectionDB()
    }

    async createConnectionDB(){
        const host = this.configService.get('mongo.host')
        const port = this.configService.get('mongo.port')
        const database = this.configService.get('mongo.database')

        const DB_URI = `mongodb://${host}:${port}/${database}`

        this.dbConnection = createConnection(DB_URI)

        this.dbConnection.once('open', ()=>{
            console.log('Connected to database')
        })
        this.dbConnection.once('error', ()=>{
            console.log(`Error connecting to ${database}`)
        })
    }

    getConnection(){
        return this.dbConnection
    }

}
