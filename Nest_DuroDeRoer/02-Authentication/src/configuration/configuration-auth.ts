import { registerAs } from "@nestjs/config";

export default registerAs('auth', ()=>({
    secretKey: process.env.SECRETKEY_AUTH || 'secret_key'
}))