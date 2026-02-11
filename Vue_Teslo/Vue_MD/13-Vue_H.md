# 13 Vue Herrera - Autenticación y autorización

- El backend ya tiene un login tradicional
- Nos traeremos del backend el usuario autenticado, los roles, el jsonwebtoken de autenticación
- Eso nos va a permitir usar los guards por la parte de Vue que permitan entrar a la persona donde quiere entrar, vamos a saber quien es, y sobretodo saber si es administrador. Solo los admin van a poder entrar a ciertos lugares
- Usaremos Pinia. En el state tendremos el user, el token y el authStatus (authenticated/unauthenticated)
- Tendremos varios getters: isChecking, isAuthenticated, isAdmin, username
    - Si no tenemos sesión de usuario, el estado va a ser checking
    - Luego vamos a tomar el token y con este verificamos el estado en el backend
    - Si el usuario tiene el rol de admin, aparecerá la posibilidad de ir a la pantalla de admin (lo veremos en el siguiente módulo)
- Una vez la persona ingresa, no puede regresar al Login (ni hacia atrás en el navegador ni poniendo la ruta de login)
- Habrá un loader global
- Descargar la carpeta auth adjunta 
- Tengo guards, layouts y pages. Son de un proyecto anterior (SPA)
- auth/guards/is-authenticated.gurad.ts

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

const isAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const userId = localStorage.getItem('userId');
  localStorage.setItem('lastPath', to.path);

  if (!userId) {
    return next({
      name: 'login',
    });
  }

  return next();
};

export default isAuthenticatedGuard;
~~~

- auth/layouts/AuthLayout.vue

~~~vue
<template>
  <!-- component -->
  <div class="bg-gray-100 flex justify-center items-center h-screen">
    <!-- Left: Image -->
    <div class="w-1/2 h-screen hidden lg:block bg-blue-500">

    </div>
    <!-- Right: Login Form -->
    <div class="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
      <RouterView />
    </div>
  </div>
</template>
~~~

- auth/views/LoginPage.vue

~~~vue
<template>
  <h1 class="text-2xl font-semibold mb-4">Login</h1>
  <form action="#" method="POST">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Username</label>
      <input
        type="text"
        id="username"
        name="username"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input type="checkbox" id="remember" name="remember" class="text-blue-500" />
      <label for="remember" class="text-gray-600 ml-2">Remember Me</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">Forgot Password?</a>
    </div>
    <!-- Login Button -->
    <button
      @click="onLogin"
      type="button"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Login
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'register' }" class="hover:underline">Sign up Here</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const onLogin = () => {
  localStorage.setItem('userId', 'ABC-123');

  const lastPath = localStorage.getItem('lastPath') ?? '/';

  // router.replace({
  //   // name: 'home',
  // });
  router.replace(lastPath);
};
</script>
~~~

- RegisterPage.vue

~~~vue
<template>
  <h1 class="text-2xl font-semibold mb-4">Register</h1>
  <form action="#" method="POST">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="name" class="block text-gray-600">Name</label>
      <input
        type="text"
        id="name"
        name="name"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>

    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Username</label>
      <input
        type="text"
        id="username"
        name="username"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input type="checkbox" id="remember" name="remember" class="text-blue-500" />
      <label for="remember" class="text-gray-600 ml-2">Remember Me</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">Forgot Password?</a>
    </div>
    <!-- Login Button -->
    <button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Login
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'login' }" class="hover:underline">Login Here</RouterLink>
  </div>
</template>
~~~

- Creo auth/routes/index.ts
- Guardará las rutas relacionadas a mi autenticación. La idea es que sea un objeto que yo pueda colocar directamente en el router

~~~js
import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw = {
    path: '/auth',
    name: 'auth',
    component: ()=> import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
        {
        path: 'login',
        name: 'login',
        component: ()=> import('@/modules/auth/views/LoginPage.vue')
        },
        {
        path: 'register',
        name: 'register',
        component: ()=> import('@/modules/auth/views/RegisterPage.vue')
        }
        
    ]
}
~~~

- Ahora solo tengo que importarlo en el router dentro de routes
- router/index.ts

~~~js
import { authRoutes } from '@/modules/auth/routes'
import ShopLayout from '@/modules/shop/layouts/ShopLayout.vue'
import HomeView from '@/modules/shop/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'shop',
      component: ShopLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: ()=>import('@/modules/shop/views/HomeView.vue')
        }
      ]
    },
    authRoutes
  ],
})

export default router
~~~

- Ahora si en el navegador apunto a localhost:3000/auth/login voy a la pantalla de login

## Login Action - Autenticación

- El endpoint para hacer login es /api/auth/login
- Si no se cumple con los parámetros del backend (verifica email, longitud de password, etc)
- Si el login es exitoso (user: test1@google.com, password:Abc123) me devuelve el id, el email, el fullName, el isActive, un arreglo de roles y el token
- Creo en modules/auth/actions/login.action.ts
- Coloco un try y un catch, hay dos tipos de errores posibles: que el email sea incorrecto o que se caiga la conexión, no tengamos acceso, etc (errores controlados y no controlados)
- Copio la respuesta del login exitoso y uso PasteJsonAsCode para tipar la respuesta de axios
- La pego en auth/interfaces/auth.response.ts

~~~js
import type { User } from "./user.interface";

export interface AuthResponse {
    user:  User;
    token: string;
}

//es el mismo User que el de user.interface.ts

{/*export interface User {
    id:       string;
    email:    string;
    fullName: string;
    isActive: boolean;
    roles:    string[];
}*/}
~~~

- En el loginAction ya puedo tipar la respuesta de axios y también la de la propia loginAction
- En el catch **uso && con la condición para no usar un if anidado**

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { AuthResponse } from "../interfaces/auth.response"
import { isAxiosError } from "axios"
import type { User } from "../interfaces/user.interface"

interface LoginError {
    ok: false,
    message: string
}

interface LoginSuccess{
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
~~~

## Pinia - Auth Store

- Creo el store en auth/stores/auth.store.ts

~~~js
import { defineStore } from "pinia";

export const useAuthStore = defineStore('auth', ()=>{


    return {}
})
~~~

- Voy a ocupar la interfaz de user y un enum para el status de la autenticación
- Creo varios getters

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "../interfaces/user.interface";
import { AuthStatus } from "../interfaces/auth-status.enum";

export const useAuthStore = defineStore('auth', ()=>{

    const authStatus = ref(AuthStatus.Checking)
    const user= ref<User | undefined>()
    const token = ref<string>('') //lo voy a tebner que grabar en el localStorage

    return {
        authStatus, 
        user, 
        token,
        
        //getters
        isChecking: computed(()=>authStatus.value === AuthStatus.Checking ),
        isAuthenticated: computed(()=>authStatus.value === AuthStatus.Authenticated),
        isUnauthenticated: computed(()=>authStatus.value === AuthStatus.Unauthenticated),
        username : computed(()=>user.value?.fullName)
        
        //Todo: getter para saber si es admin o no
    }
})
~~~

- En auth/interfaces/auth-status.enum.ts guardo el enum de los estados de la autenticación

~~~js
export enum AuthStatus{
    Authenticated ="Authenticated",
    Unauthenticated= 'Unauthenticated',
    Checking="Checking"
}
~~~

- Las acciones estan basadas en el gestor de estado, porque el gestor de estado basado en la respuesta de nuestra acción (loginAction) va a determinar los valores de user, token y authStatus
- Creo la función login para llamar a la acción, darle los valores a las propiedades reactivas y mapear la respuesta
- Creo una función logout para devolver la respuesta en caso de error (queda más limpio y es reutilizable)

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "../interfaces/user.interface";
import { AuthStatus } from "../interfaces/auth-status.enum";
import { loginAction } from "../actions/login.action";

export const useAuthStore = defineStore('auth', ()=>{

    const authStatus = ref(AuthStatus.Checking)
    const user= ref<User | undefined>()
    const token = ref<string>('') //lo voy a tebner que grabar en el localStorage

    const login = async(email: string, password: string)=>{
        try {
            const loginResp = await loginAction(email, password)
            if(!loginResp.ok){
                return false
            }

            user.value = loginResp.user
            token.value = loginResp.token
            authStatus.value = AuthStatus.Authenticated

            return true

        } catch (error) {
          return logout()
        }
    }

    const logout = ()=>{
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
        //Todo: getter para saber si es admin o no
        
        //Actions
        login
    }
})
~~~

## Realizar proceso de autenticación

- Tenemos que mandar a llamar a nuestra acción de login desde el gestor de Pinia en la pantalla de LoginPage.vue
- Borro este onLogin que tenía

~~~js
const onLogin = () => {
  localStorage.setItem('userId', 'ABC-123');

  const lastPath = localStorage.getItem('lastPath') ?? '/';

  // router.replace({
  //   // name: 'home',
  // });
  router.replace(lastPath);
};
~~~

- Hagámoslo de nuevo
- onLogin debería llamarse en el submit del formulario, no tanto en el botón
  - Por lo tanto, borro el @click del bitton, y en vez de tipo button será de tipo submit
- LoginPage.vue

~~~html
<button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
~~~

- En el form puedo usar @sumbmit con el modificador preventDefault para que no recargue el navegador

~~~html
<!--<form action="#" method="POST">-->
<form @submit.prevent="onLogin">
~~~

- Si quiero asegurarme que funciona pongo un console.log en el onLogin y al paretar el botón debería aparecer en consola
- Vamos a usar otro tipo de propiedad reactiva. Se podría hacer mediante ref de todas maneras
- Usaremos reactive
  - Yo voy a querer trabajar todo con ref hasta donde sea posible (es la recomendación)
  - Con ref es más fácil trabajar, sobretodo los arreglos (.push, etc)
  - reactive se puede usar cuando se van a almacenar objetos
  - Si llamo al objeto MyForm, accedo con Myform.loquesea, no hace falta poner el .value
- script LoginPage.vue

~~~js
const MyForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})
~~~

- Ahora, en el input del email, ya puedo usar MyForm.email con un v-model
- LoginPage.vue

~~~html
<form @submit.prevent="onLogin">
<!-- Username Input -->
<div class="mb-4">
  <label for="email" class="block text-gray-600">Correo</label>
  <input
    v-model="MyForm.email"
    type="email"
    id="email"
    name="email"
    class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
    autocomplete="off"
  />
</div>
~~~

- Lo mismo con el otro input y el checkbox de rememberMe
- Coloco un console.log del myForm en el onLogin del script setup para ver el objeto reactivo
- Me devuelve un Proxy(Object)
  - Tiene un Handler con un MutablereactiveHandler
  - Tiene un Target (con el email, password y rememberMe con los valores por defecto que le puse si no rellené el formulario)
  - Tiene un Prototype
  - Tiene un IsRevoked en false
- Hay que hacer ciertas validaciones en el onLogin
- Hagamos uso del store y la función principal primero

~~~vue
<script lang="ts" setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore()
const MyForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const onLogin = async() => {

  if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.rememberMe){
    localStorage.setItem('email', MyForm.email )
  }else{
    localStorage.removeItem('email')
  }

  const ok = await authStore.login(MyForm.email, MyForm.password)

  if(ok){
    const lastPath = localStorage.getItem('lastPath') ?? '/';

    router.replace(lastPath);
    return
  }

  //toast.error('Usuario/Contraseña no son correctos')

  watchEffect(()=>{
    const email = localStorage.getItem('email')
    if(email){
      MyForm.email = email
      MyForm.rememberMe= true
    }
  })
};
</script>
~~~

- Si le doy al botón de Login sin poner datos me da un bad request y el ok en false 
- Si hago el login con test1@google y el pass Abc123 me devuelve  el ok en true
- Si en las devTools voy a Pinia/store, seleccion auth tengo el user que es un objeto con id, email, fullName, isActive, los roles, el token, el authStatus Athenticated, y en los getters tengo el isChecking en false, el isAuthenticated en true y el username Test One
- Si recargo el navegador debería haber purgado la información del store pero no lo hizo
- Llamo al logout si el ok está en false

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "../interfaces/user.interface";
import { AuthStatus } from "../interfaces/auth-status.enum";
import { loginAction } from "../actions/login.action";

export const useAuthStore = defineStore('auth', ()=>{

    const authStatus = ref(AuthStatus.Checking)
    const user= ref<User | undefined>()
    const token = ref<string>('') 

    const login = async(email: string, password: string)=>{
        try {
            const loginResp = await loginAction(email, password)
            if(!loginResp.ok){
                logout() //AQUI!
                return false
            }

            user.value = loginResp.user
            token.value = loginResp.token
            authStatus.value = AuthStatus.Authenticated

            return true

        } catch (error) {
          logout()
          return false //lo necesito para el vue toastification
        }
    }

    const logout = ()=>{
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
        //Todo: getter para saber si es admin o no
        
        //Actions
        login
    }
})
~~~

- Ahora si toco el botón lanza la excepción (badRequest), borra la información del store, y aparece unauthenticated
- Recordemos el loginAction

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { AuthResponse } from "../interfaces/auth.response"
import { isAxiosError } from "axios"
import type { User } from "../interfaces/user.interface"

interface LoginError {
    ok: false,
    message: string
}

interface LoginSuccess{
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
~~~

- Vamos a mejorar la experiencia de usuario
- Quizá noe s tan necesario validar aqui en el frontend, pero si ocuparemos mostrar mensajes de error

## Terminar pantalla de login

- Creo dos propiedades reactivas en LoginPage.vue, emailInputRef y passwordInputRef
- A la hora de hacer un login debemos verificar que estas dos variables tienen información
  - Si no la tienen debo colocar el foco en los respectivos campos
  - Uso el ref de los input para colocar las variables reactivas. **Ref es el único que no lleva el : del bind!**
  - En el onLogin puedo hacer una evaluación rápida (luego validaremos que sea un correo electrónico, usaremos esquemas de validación)

~~~vue
<template>
  <h1 class="text-2xl font-semibold mb-4">Login</h1>
  <form @submit.prevent="onLogin">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="email" class="block text-gray-600">Correo</label>
      <input
        ref="emailInputRef"
        v-model="MyForm.email"
        type="email"
        id="email"
        name="email"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Contraseña</label>
      <input
        ref="passwordInputRef"
        v-model="MyForm.password"
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input 
      v-model="MyForm.rememberMe"
      type="checkbox" id="remember" name="remember" class="text-blue-500" />
      <label for="remember" class="text-gray-600 ml-2">Recordar Usuario</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">¿Olvidaste la contraseña?</a>
    </div>
    <!-- Login Button -->
    <button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Login
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'register' }" class="hover:underline">Regístrate aquí</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { ref } from 'vue';

const router = useRouter();
const authStore = useAuthStore()
const emailInputRef = ref<HTMLInputElement| null>(null)
const passwordInputRef = ref<HTMLInputElement| null>(null)


const MyForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const onLogin = async() => {

  if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.rememberMe){
    localStorage.setItem('email', MyForm.email )
  }else{
    localStorage.removeItem('email')
  }

  const ok = await authStore.login(MyForm.email, MyForm.password)

  if(ok){
    const lastPath = localStorage.getItem('lastPath') ?? '/';

    router.replace(lastPath);
    return
  }

  //toast.error('Usuario/Contraseña no son correctos')

  watchEffect(()=>{
    const email = localStorage.getItem('email')
    if(email){
      MyForm.email = email
      MyForm.rememberMe= true
    }
  })
};
</script>
~~~

- Para mostrar los errores usaremos el paquete (algo antiguo ya) Vue toastification

> npm i vue-toastification@next

- Configuro el main

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import router from './router'
import { VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)
app.use(Toast)

app.mount('#app')
~~~

- Ya puedo usar el toast en el login

~~~js
const onLogin = async() => {

  if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.rememberMe){
    localStorage.setItem('email', MyForm.email )
  }else{
    localStorage.removeItem('email')
  }

  const ok = await authStore.login(MyForm.email, MyForm.password)

  if(ok){
    const lastPath = localStorage.getItem('lastPath') ?? '/';

    router.replace(lastPath);
    return
  }

  toast.error('Usuario/Contraseña no son correctos') //AQUI

  watchEffect(()=>{
    const email = localStorage.getItem('email')
    if(email){
      MyForm.email = email
      MyForm.rememberMe= true
    }
  })
};
~~~

- Vamos a usar VueUse para manejar el token en el LocalStorage

> npm i @vueuse/core

- Manejamos el token con useLocalStorage en el auth.store
- useLocalStorage ya devuelve un ref, por lo que no hay que usar ref

~~~js
const token = useLocalStorage('token', '')
~~~

- Si recargo el navegador, aunque no ponga nada se graba el token (con un string vacío)
- Si hago el login correcto se guarda el token
- Si recargo el navegador, la información de pantalla se pierde pero la del localstorage se mantiene
  - Eso es algo que vamos a cambiar, vamos a hacer que la info permanezca en pantalla en los inputs
  - Podríamos crear un watch para que cargue esa información
- LoginPage.vue

~~~js
const onLogin = async() => {

  if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.rememberMe){
    localStorage.setItem('email', MyForm.email )
  }else{
    localStorage.removeItem('email')
  }

  const ok = await authStore.login(MyForm.email, MyForm.password)

  if(ok) return

  toast.error('Usuario/Contraseña no son correctos')

  watchEffect(()=>{
    const email = localStorage.getItem('email')
    if(email){
      MyForm.email = email
      MyForm.rememberMe= true
    }
  })
};
~~~

- Ahora falta el registro
- **NOTA**: cambio LoginPage y RegisterPage por LoginView RegisterView
- Lo cambio en el auth.router

~~~js
import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw = {
    path: '/auth',
    name: 'auth',
    component: ()=> import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
        {
        path: 'login',
        name: 'login',
        component: ()=> import('@/modules/auth/views/LoginView.vue')
        },
        {
        path: 'register',
        name: 'register',
        component: ()=> import('@/modules/auth/views/RegisterView.vue')
        }
        
    ]
}
~~~

## Registro de usuarios

- Creo una nueva acción en auth/actions/register.action.ts que recibe el fullName, el email y el password

~~~js
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
~~~

- La uso en el auth.store en la función register
- Es idéntico al login solo que con un campo más (el fullName)
- Cuando hay un error devuelvo un objeto con el ok y el message (debería hacerlo en el login también por consistencia)
- Con el true retorno el message vacío

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "../interfaces/user.interface";
import { AuthStatus } from "../interfaces/auth-status.enum";
import { loginAction } from "../actions/login.action";
import { useLocalStorage } from "@vueuse/core";
import { registerAction } from "../actions/register.action";

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

    const logout = ()=>{
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
        //Todo: getter para saber si es admin o no
        
        //Actions
        login,
        register
    }
})
~~~

- En el RegisterView.vue cambio lo que hay en el form y uso @submit.prevent, le paso la función onRegister
- Uso v-model para guardar los valores en MyForm
- Uso el ref para ponerle el foco a los elementos si no hay texto
- Extraigo el ok y el message de la acción. Si el ok está en true, return. Si no, imprime el mensaje en el toast

~~~vue
<template>
  <h1 class="text-2xl font-semibold mb-4">Register</h1>
  <form @submit.prevent="onRegister">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Usuario</label>
      <input
        v-model="MyForm.fullName"
        ref="fullNameInputRef"
        type="text"
        id="username"
        name="username"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!--email-->
    <div class="mb-4">
      <label for="email" class="block text-gray-600">Correo</label>
      <input
        v-model="MyForm.email"
        ref="emailInputRef"
        type="email"
        id="email"
        name="email"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Contraseña</label>
      <input
        v-model="MyForm.password"
        ref="passwordInputRef"
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">¿Olvidaste la contraseña?</a>
    </div>
    <!-- Register Button -->
    <button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Ingresar
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'login' }" class="hover:underline">Login</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const emailInputRef = ref<HTMLInputElement| null>(null)
const passwordInputRef = ref<HTMLInputElement| null>(null)
const fullNameInputRef = ref<HTMLInputElement | null>(null)
const toast = useToast()

const MyForm= reactive({
  fullName: '',
  email: '',
  password: ''
})

  const authStore = useAuthStore()

  const onRegister = async ()=>{
      if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.fullName === ''){
    return fullNameInputRef.value?.focus()
  }

  const {ok, message} = await authStore.register(MyForm.fullName, MyForm.email, MyForm.password)

  if(ok) return

  toast.error(message)

  }

</script>
~~~


- Para comprobar que se ha hecho el registro usar TablePlus con la data del .env (del backend)

~~~
STAGE=dev

DB_PASSWORD=MySecr3tPassWord@as2 ----> La contraseña
DB_NAME=TesloDB ---> El nombre de la DB
DB_HOST=localhost ---> host
DB_PORT=5432 ---> El puerto
DB_USERNAME=postgres ---> El usuario

PORT=3000
HOST_API=http://localhost:3000/api

JWT_SECRET=Est3EsMISE3Dsecreto32s
~~~

## Interceptores de Axios


- Tenemos guardado el token en el localStorage cuando hacemos el Login
- Cuando recargamos el navegador tenemos que verificar si el token sigue siendo vigente, renovarlo, etc
- En el backend tengo un endpoint que es auth/check-status
  - En POSTMAN, debo pegar en authorizations/Bearer Token/ Token el token que me devuelve el login (sin comillas)
  - La respuesta, en caso de ser exitosa, es la misma que la de LoginSuccess (intefaz) 
  - Si no regresa "Unauthorized"
- Para hacer esta tarea vamos a usar los interceptorres de Axios
  - Se puede hacer con el fecthAPI tambien
- En api/tesloApi.ts hago uso del interceptor en la request (también hay en la response)
- En config tengo la configuración de axios
- Siempre debe retornar la config, es lo mínimo que me pide para ser un interceptor
- Autenticación es poder identificar un usuario y autorización es saber si ese usuario tiene acceso a algo
- En este caso, aunque es autenticación, la palabra en headres en Authorization 

~~~js
import axios from 'axios'


const tesloApi = axios.create({
    baseURL: import.meta.env.VITE_TESLO_API_URL
})

tesloApi.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token')

  //para que no envie el token en estos llamados
    const isAuthRoute =
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register') 

    if(token && !isAuthRoute){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export {tesloApi}
~~~

- POSTMAN tiene una opción que es en el icono del tag y puedo seleccionar NodeJs- Axios y me dice cómo tengo que establecer mi configuración
- Hay que mandar en los headers un objeto con 'Authorization': 'Bearer oiua87s9ab976s897as6b_token' 

~~~
//icono
</>
~~~

- Creo la nueva acción modules/auth/actions/check-status.action.ts que llamará cada vez que se recargue el navegador

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { User } from "../interfaces/user.interface"
import type { AuthResponse } from "../interfaces/auth.response"
import { isAxiosError } from "axios"

interface CheckError{
    ok: false, //coloco explicitamente false para que TypScript pueda inferir   
}

interface CheckSuccess{
    ok: true,
    user: User,
    token: string
}

export const checkStatusAction =async (): Promise<CheckError | CheckSuccess>=>{
    try {
        const localToken = localStorage.getItem('token')

        if(!localToken){
            return {ok: false}
        }
        
        if(localToken && localToken.length < 10) return {ok: false}

        const {data} = await tesloApi.get<AuthResponse>('/auth/check-status')
        
        return {
            ok: true,
            user: data.user,
            token: data.token
        }

    } catch (error) {
        if(isAxiosError(error) && error.response?.status === 401){
            return {
                ok: false
            }
        }

        throw new Error("No se ha podido verificar la sesión")
    }
}
~~~

- Veamos como mandar a llamar esta acción para preservar la sesión del usuario

## Subscripción de estado y redirecciones

- Cuando recargamos el navegador se pierde la información del store cuando estoy autenticado (exceptuando el token que está en el LocalStorage)
- Podríamos guardarlo todo en el LocalStorage, pero yo voy a querer verificar ese token, puede ser que ya haya expirado, que el usuario esté bloqueado, etc
- Cada vez que se recargue el navegador, vamos a revissar las credenciales basado en el token
- Para ello creamos el checkAuthAction. ¿Dónde lo llamamos?
- auth.store

~~~js
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
~~~

- Coloco esta action checkAuthStatus en el return del store para poder usarla
- Un punto importante dónde llamar a este checkAuthStatus en el App.vue, ya que toda nuestra aplicación pasa por aquí
- Hay una forma de suscribirse a todo el store
- Con $subscribe podemos suscribirnos a los cambios que pueda disparar el store, no solo el state, las mutaciones (acciones) también

~~~vue
<template>
<router-view />
<vue-query-devtools />
</template>

<script lang="ts" setup>
  import { VueQueryDevtools} from '@tanstack/vue-query-devtools';
import { useAuthStore } from './modules/auth/stores/auth.store';

  const authStore = useAuthStore()

  authStore.$subscribe((mutation, state)=>{
    console.log({mutation,state})
  })


</script>
~~~

- Si hago un login puedo ver en consola lo que ha pasado
- De esta manera puedo obtener cualquier cambio en el state (cuando se realiza un cambio en este)
- Pero al recargar el navegador no se dispara
- Para ello tengo el objeto de opciones
  - Con el immediate en true, se ejecuta tan pronto el componente se monta 
  - Cuando no quiero ocupar el argumento uso un guión bajo

~~~js
 authStore.$subscribe((_, state)=>{
    console.log({state})
  }, {
    immediate: true
  })
~~~

- Puedo usar el state para verificar si estoy autenticado o no 
- Si está en checking llamo al checkAuthStatus, si sale bien, me setea los valores 
  - Si sale mal, llama al logout que tenemos el cambio a Unauthenticated
  - Cuando estamos autenticados queremos redireccionar al HomeScreen
- App.vue (script setup)

~~~js
import { VueQueryDevtools} from '@tanstack/vue-query-devtools';
import { useAuthStore } from './modules/auth/stores/auth.store';
import { AuthStatus } from './modules/auth/interfaces/auth-status.enum';
import { useRoute, useRouter } from 'vue-router';

  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  authStore.$subscribe((_, state)=>{
    if(state.authStatus === AuthStatus.Checking){
      authStore.checkAuthStatus()
      return
    }

    if(route.path.includes('/auth') && state.authStatus === AuthStatus.Authenticated){
      //uso replace para no poder navegar a la pantalla anterior si ya está autenticado
      router.replace({name: 'home'})
      return
    }
  }, {
    immediate: true
  })
~~~

- De esta manera si estoy autenticado me redirige al home
- Pero si estoy autenticado **no debería poder ir al Login**
- Para ello usaremos un **Guard** (o que los botones no aparecieran)
- Si estoy autenticado, el botón de Login debería ser de Logout

## Guard - No autenticado

- Si estamos autenticados no deberíamos poder ir a la pantalla de Login
- Creemos un Guard que impida entrar en esta pantalla si estamos autenticados
- En auth/guards pegamos este código que no está acabado
- is-authenitcated.guard.ts

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

const isAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const userId = localStorage.getItem('userId');
  localStorage.setItem('lastPath', to.path);

  if (!userId) {
    return next({
      name: 'login',
    });
  }

  return next();
};

export default isAuthenticatedGuard;
~~~

- Creo una copia que se llama is-not-authenticated.ts
- Hay que exportarlo por defecto para usarlo como lo usaremos

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

const isNotAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
 
  console.log(to) //veamos que tiene to (hacia donde va)


  return next();
};

export default isNotAuthenticatedGuard;
~~~

- Lo uso en el router
- Tengo el beforeEnter
- routes/index.ts

~~~js
import type { RouteRecordRaw } from "vue-router";
import isNotAuthenticatedGuard from "../guards/is-not-authenticated.guard";

export const authRoutes: RouteRecordRaw = {
    path: '/auth',
    name: 'auth',
    beforeEnter:[isNotAuthenticatedGuard],
    component: ()=> import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
        {
        path: 'login',
        name: 'login',
        component: ()=> import('@/modules/auth/views/LoginView.vue')
        },
        {
        path: 'register',
        name: 'register',
        component: ()=> import('@/modules/auth/views/RegisterView.vue')
        }
        
    ]
}
~~~

- Si voy al Login puedo ver en consola el to
  - Quiere ir al fullPath:'/auth/login'
- Podríamos determinar el estado tomándolo del authStore y usar un ternario

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { AuthStatus } from '../interfaces/auth-status.enum';

const isNotAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
 
  const authStore = useAuthStore();

  (authStore.authStatus === AuthStatus.Authenticated) ? next({name:'home'}) : next()

};

export default isNotAuthenticatedGuard;
~~~

- Pero si yo conozco la ruta y voy en el navegador a auth/login me deja entrar
- Debo verificar en este punto con el checkAuthStatus si estoy autenticado o no, porque si no estoy checking

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { AuthStatus } from '../interfaces/auth-status.enum';

const isNotAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
 
  const authStore = useAuthStore();

  await authStore.checkAuthStatus();

  (authStore.authStatus === AuthStatus.Authenticated) ? next({name:'home'}) : next()

};

export default isNotAuthenticatedGuard;
~~~

- Ahora si quiero ir a /auth/login no me deja entrar
- Falta el is-authenticated y verificar roles

## Cerrar sesión

- Si estoy autenticado debería ver el botón de Logout
- Si mi usuario tiene el rol de admin quiero que aparezca el botón de Admin
- Quiero determinar desde el store si el usuario es administrador con un getter
- **NOTA**: Removemos el token en el logout!
- auth.store.ts

~~~js
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
~~~

- shop/components/TopMenu.vue
- Llamo al authStore desde el script setup. Uso un template para renderizar condicionalmente con el v-if los botones

~~~vue
 <template v-if="!authStore.isAuthenticated">
    <button 
    type="button" 
    class="rounde mr-3 hidden border hover:bg-blue-300 border-blue-700 py-1.5 px-6 text-center text-sm font-medium text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:inline-block rounded-lg">
      <RouterLink :to="{ name: 'login' }" class="hover:no-underline">
        Login
      </RouterLink>
    </button>
    <button 
    type="button" 
    class="rounde mr-3 hidden bg-blue-700 py-1.5 px-6 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 md:mr-0 md:inline-block rounded-lg">
      <RouterLink :to="{ name: 'register' }" class="hover:no-underline">
        Register
      </RouterLink>
    </button>
  </template>
  <template v-else="authStore.isAuthenticated">
    <button 
    type="button" 
    class="rounde mr-3 hidden border hover:bg-blue-300 border-blue-700 py-1.5 px-6 text-center text-sm font-medium text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:inline-block rounded-lg">
      <RouterLink v-if="authStore.isAdmin" :to="{ name: 'admin' }" class="hover:no-underline">
        Admin
      </RouterLink>
    </button>
    <button 
    @click="authStore.logout()"
    type="button" 
    class="rounde mr-3 hidden bg-blue-700 py-1.5 px-6 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 md:mr-0 md:inline-block rounded-lg">
      Logout
    </button>
</template>
~~~

- Creo el componente modules/admin/layouts/AdminLayout.vue

~~~vue
<template>
    <h1>AdminLayout</h1>
    <RouterView />
</template>
~~~

- Como en auth, creo en admin/routes/index.ts

~~~js
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue')
}
~~~

- Lo coloco en el router principal

~~~js
import { adminRoutes } from '@/modules/admin/routes'
import { authRoutes } from '@/modules/auth/routes'
import ShopLayout from '@/modules/shop/layouts/ShopLayout.vue'
import HomeView from '@/modules/shop/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'shop',
      component: ShopLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: ()=>import('@/modules/shop/views/HomeView.vue')
        }
      ]
    },
    authRoutes,
    adminRoutes
  ],
})

export default router
~~~

- Ahora hay que crear un Guard para que solo pueda acceder a la ruta admin si el usuario es admin

## Guard isAdminGuard

- En auth/guards/is-admin.guard.ts

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { AuthStatus } from '../interfaces/auth-status.enum';

const isAdminGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore();
  
    await authStore.checkAuthStatus();
  
    authStore.isAdmin ? next(): next({name: 'home'})
};

export default isAdminGuard;
~~~

- Y el is-authenticated.guard

~~~js
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { AuthStatus } from '../interfaces/auth-status.enum';

const isAuthenticatedGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore();
  
    await authStore.checkAuthStatus();
  
    (authStore.authStatus === AuthStatus.Unauthenticated) ? next({name:'home'}) : next()
};

export default isAuthenticatedGuard;
~~~

- En el objeto del router del admin uso el before>Enter y le paso los dos guards

~~~js
import isAdminGuard from "@/modules/auth/guards/is-admin.guard";
import isAuthenticatedGuard from "@/modules/auth/guards/is-authenticated.guard";
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    beforeEnter: [isAuthenticatedGuard, isAdminGuard],
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue')
}
~~~

- Es importante usar el isAuthenticatedGuard también con el isAdminGuard
- En principio ahora el código que hiciomos con $subscribe en App.vue no sería necesario
- Pongamos un loader a nivel global

## Pantalla de carga

- Se entrega este loader para usar
- Hay muchos otros spinners

> https://github.com/n3r4zzurr0/svg-spinners

~~~js
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}</style><rect class="spinner_9y7u" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_DF2s" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_q27e" x="1" y="1" rx="1" width="10" height="10"/></svg>
~~~

- En modules/common/components/FullScreenLoader.vue copio el svg
- Uso shift+Alt+F para formatear el código
- La etiqueta style no puede ir dentro del template
- Uso scoped para que solo aplique el css en este componente
- Para asegurarme que el loader quede en el centro de la pantalla lo meto dentro de un div
- Uso la propiedad fill para añadirle un color 

~~~vue
<template>
    <div class="w-screen h-screen flex justify-center items-center ">
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect class="spinner_9y7u" x="1" y="1" rx="1" width="10" height="10" fill="#007bff" />
            <rect class="spinner_9y7u spinner_DF2s" x="1" y="1" rx="1" width="10" height="10" />
            <rect class="spinner_9y7u spinner_q27e" x="1" y="1" rx="1" width="10" height="10" />
        </svg>
    </div>
</template>

 <style scoped>
    .spinner_9y7u {
        animation: spinner_fUkk 2.4s linear infinite;
        animation-delay: -2.4s
    }

    .spinner_DF2s {
        animation-delay: -1.6s
    }

    .spinner_q27e {
        animation-delay: -.8s
    }

    @keyframes spinner_fUkk {
        8.33% {
            x: 13px;
            y: 1px
        }

        25% {
            x: 13px;
            y: 1px
        }

        33.3% {
            x: 13px;
            y: 13px
        }

        50% {
            x: 13px;
            y: 13px
        }

        58.33% {
            x: 1px;
            y: 13px
        }

        75% {
            x: 1px;
            y: 13px
        }

        83.33% {
            x: 1px;
            y: 1px
        }
    }
</style>
~~~

- Vamos al App.vue. Uso un víf para renderizar el loader si el estado es isChecking y un v-else para el RouterView

~~~vue
<template>
  <full-screen-loader 
    v-if="authStore.isChecking"
  />
<router-view v-else/>
<vue-query-devtools />
</template>

<script lang="ts" setup>
  import { VueQueryDevtools} from '@tanstack/vue-query-devtools';
import { useAuthStore } from './modules/auth/stores/auth.store';
import FullScreenLoader from './modules/common/components/FullScreenLoader.vue';
import { AuthStatus } from './modules/auth/interfaces/auth-status.enum';
import { onMounted } from 'vue';


  const authStore = useAuthStore()
  
  onMounted(async () => {
  await authStore.checkAuthStatus()
})
</script>
~~~