import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { User } from "src/user/entities/user.entity";
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../interfaces/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy){

    constructor(
        private readonly authService: AuthService,
        configService: ConfigService,
        
    ){
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) throw new Error('JWT_SECRET is not defined in environment variables');

        super({
            secretOrKey: jwtSecret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }

    async validate(payload: JwtPayload): Promise<User>{
        const {id} = payload

        const user = await this.authService.validateUser(id)
        return user

    }
}