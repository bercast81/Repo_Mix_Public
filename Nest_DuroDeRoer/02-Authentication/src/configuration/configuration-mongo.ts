import { registerAs } from "@nestjs/config";

export default registerAs('mongo', ()=>({
    host: process.env.HOST_MONGODB || 'localhost',
    port: parseInt(process.env.PORT_MONGODB || '27017', 10),
    database: process.env.DATABASE_MONGODB || 'users'
}))