import { tesloApi } from "@/api/tesloApi"
import type { AuthResponse } from "../interfaces/auth.response"
import { isAxiosError } from "axios"
import type { LoginError, LoginSuccess } from "./login.action"

export const registerAction = 
async (fullName: string, email: string, password: string)
:Promise<LoginError | LoginSuccess> =>{

  try {
    const {data} = await tesloApi.post<AuthResponse>('/auth/register',{
        fullName,
        email,
        password
    })

    return {
        ok: true,
        user: data.user,
        token: data.token
    }
        
    } catch (error) {
        if(isAxiosError(error)){
            return {
                ok: false,
                message: error.message
            }
        }    

        throw new Error('No se ha podido realizar la petición')
    }
    

}