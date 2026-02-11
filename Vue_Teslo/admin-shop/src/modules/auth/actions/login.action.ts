import { tesloApi } from "@/api/tesloApi"
import type { AuthResponse } from "../interfaces/auth.response"
import { isAxiosError } from "axios"
import type { User } from "../interfaces/user.interface"

export interface LoginError {
    ok: false,
    message: string
}

export interface LoginSuccess{
    ok: true,
    user: User,
    token: string
}


export const loginAction = async(
    email: string, 
    password: string
): Promise<LoginError|LoginSuccess>=>{
    try {

        const {data} = await tesloApi.post<AuthResponse>('/auth/login', {
            email,
            password
        })

        return {
            ok: true,
            user: data.user,
            token: data.token
        }
        
    } catch (error) {
        if(isAxiosError(error) && error.response?.status == 401){
                return{
                    ok: false,
                    message: "Usuario o contraseña incorrectos"
                }
        }

        //cualquiewr otro error
        throw new Error("No se pudo realizar la petición")
    }
}