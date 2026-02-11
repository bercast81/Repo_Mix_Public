import 'dotenv/config'
import * as joi from 'joi'


interface EnvVars{
    PORT: number
    STRIPE_SECRET_KEY: string
    STRIPE_ENDPOINT_SECRET: string,
    NATS_SERVERS: string[]
}

const envsSchema = joi.object({
    PORT: joi.number().default(3003),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
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
    port: envVars.PORT,
    stripeSecret: envVars.STRIPE_SECRET_KEY,
    endpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
    natsServers: envVars.NATS_SERVERS
}