import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "../interfaces/user.interface";
import { AuthStatus } from "../interfaces/auth-status.enum";
import { loginAction } from "../actions/login.action";
import { useLocalStorage } from "@vueuse/core";
import { registerAction } from "../actions/register.action";
import { checkStatusAction } from "../actions/check-status.action";

export const useAuthStore = defineStore('auth', ()=>{

    const authStatus = ref(AuthStatus.Checking)
    const user= ref<User | undefined>()
    const token = useLocalStorage('token', '')

    const login = async(email: string, password: string)=>{
        try {
            const loginResp = await loginAction(email, password)
            if(!loginResp.ok){
                logout()
                return false

            }

            user.value = loginResp.user
            token.value = loginResp.token
            authStatus.value = AuthStatus.Authenticated

            return true

        } catch (error) {
          logout()
          return false
        }
    }

    const register =async (fullName: string, email: string, password: string)=>{
        try {
            const registerResp = await registerAction(fullName, email, password) 
            if(!registerResp.ok){
                logout()
                return {ok:false, message: registerResp.message}
            }

            user.value = registerResp.user
            token.value = registerResp.token
            authStatus.value = AuthStatus.Authenticated

            return {ok: true, message: ''}
            
        } catch (error) {
            logout()
            return {ok:false, message: 'Error al registrar el usuario'}
        }


    }

    const checkAuthStatus =async (): Promise<boolean>=>{
        try {
            const statusResponse = await checkStatusAction()

            if(!statusResponse.ok){
                authStatus.value = AuthStatus.Unauthenticated
                return false
            }

            authStatus.value = AuthStatus.Authenticated
            user.value = statusResponse.user
            token.value = statusResponse.token

            return true
        } catch (error) {
            logout() //deslogging
            return false
        }
    }

    

    const logout = ()=>{
          localStorage.removeItem('token')
          authStatus.value = AuthStatus.Unauthenticated
          user.value = undefined
          token.value = ''
          return false
    }

    return {
        authStatus, 
        user, 
        token,
        
        //getters
        isChecking: computed(()=>authStatus.value === AuthStatus.Checking ),
        isAuthenticated: computed(()=>authStatus.value === AuthStatus.Authenticated),
        isUnauthenticated: computed(()=>authStatus.value === AuthStatus.Unauthenticated),
        username : computed(()=>user.value?.fullName),
        //si es admin regresa un true, también puede regresar undefined, por lo que regresamos un false en ese caso
        isAdmin: computed(()=> user.value?.roles.includes('admin') ?? false), // ?? sirve para "es una cosa u es otra" 
        
        //Actions
        login,
        logout,
        register,
        checkAuthStatus
    }
})