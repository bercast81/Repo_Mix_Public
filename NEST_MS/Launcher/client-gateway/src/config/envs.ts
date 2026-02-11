import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PRODUCTS_MICROSERVICE_HOST: string
    PRODUCTS_MICROSERVICE_PORT: number,
    ORDERS_MICROSERVICE_HOST: string,
    ORDERS_MICROSERVICE_PORT: number,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
    ORDERS_MICROSERVICE_HOST: joi.string().required(),
    ORDERS_MICROSERVICE_PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string().required())    
})
.unknown(true) //hay muchas variables más del entorno como el path de node, etc


const {error, value}= envsSchema.validate({
    ...process.env, 
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',') 
})

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value


export const envs={
    productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
    productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT,
    ordersMicroserviceHost: envVars.ORDERS_MICROSERVICE_HOST,
    ordersMicroServicePort: envVars.ORDERS_MICROSERVICE_PORT,
    natsServers: envVars.NATS_SERVERS
}