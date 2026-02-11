import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { RegisterUserDto } from './dto/register-user.dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/payload.interface';
import { envs } from 'src/config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {

    private readonly logger = new Logger('AuthService')

    constructor(
        private readonly jwtService: JwtService
    ){
        super()
    }

    onModuleInit() {
        this.$connect()
        this.logger.log('MongoDb connected!')
    }

    async signJWT(payload: JwtPayload){
        return this.jwtService.sign(payload)
    }

    async registerUser(registerUserDto: RegisterUserDto){
        try {
            const {name, email, password} = registerUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(user){
                throw new RpcException({
                    status: 400,
                    message: "User already exists"
                })
            }

            const newUser = await this.user.create({
                data:{
                    email,
                    password: bcrypt.hashSync(password, 10),
                    name
                }
            })

            const {password: __, ...rest}= newUser

            return {
                user: rest,
                token: await this.signJWT(rest)
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }
    async loginUser(loginUserDto: LoginUserDto){
        try {
            const {email, password} = loginUserDto

            const user = await this.user.findUnique({
                where: {email}
            })

            if(!user){
                throw new RpcException({
                    status: 400,
                    message: "User does not exists"
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password) 

            if(!isPasswordValid){
                throw new RpcException({
                    status: 400,
                    message: "User/Password not valid"
                })
            }
           
            const {password:__, ...rest} = user

            return {
                user: rest, 
                token: await this.signJWT(rest)
            }
            
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message
            })
        }
    }

    async verifyToken(token: string){
        try {
            const {sub, iat, exp, ...user} = this.jwtService.verify(token,{
                secret: envs.secretJwt
            })

            return {
                user,
                token: await this.signJWT(user)
            }

        } catch (error) {
            throw new RpcException({
                status: 401,
                message: error.message
            })
        }
    }
}
