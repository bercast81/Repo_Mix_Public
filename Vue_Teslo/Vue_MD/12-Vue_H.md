# 12 Vue Herrera - Administración de productos

- Cuando refresco el navegador, Tanstack Query carga la página 1 y la 2, para dar la impresión de ser la web más rápida
- Cuando estoy en la 2 precarga la 3
- Crearemos un dashboard administrativo y autenticación basada en JWT

## Inicio

> npm create vue@latest

- name: admins-shop
- TypeScript: si
- JSX: no
- Vue Router: si
- Pinia: si
- Vitest: si
- E2E: no
- ESLint: si
- Prettier: si

- Configuramos tailwind

> npm install tailwindcss @tailwindcss/vite

- vite.config.ts

~~~js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
~~~

- En styles.css

~~~css
@import "tailwindcss";
~~~

- Debo importar styles.css en el main

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
~~~

- Coloco el RouterView en el App.vue

~~~vue
<template>
    <h1 class="text-3xl text-red-500">Hola mundo</h1>
    <router-view />
</template>
~~~

## ShopLayout - Diseño de la tienda


- src/modules/auth  para todo lo relacionado con autenticación
- src/modules/admin para lo relacionado con el panel administrativo
- src/modules/common para módulos que no dependen de otros
- src/modules/products todo lo relacionado a productos
- src/modules/shop  lo que vamos a usar para mostrar de cara a los usuarios que entren a la aplicación
- Creo la subcarpeta modules/shop/layouts/ShopLayout.ts
- Usaremos TailwindComponents

> https://www.creative-tim.com/twcomponents

- Usaremos este componente

> https://www.creative-tim.com/twcomponents/component/sopping-cart

- Borro el body, corrijo algunos errores (hay una etiqueta de cierre del footer duplicada, y un div sin cerrar)
- Dejo solo un article dentro del ProductsList

~~~vue
<template>
    <!-- component -->
<!-- Create By Joker Banny -->
  <!-- Header Navbar -->
<nav class="fixed top-0 left-0 z-20 w-full border-b border-gray-200 bg-white py-2.5 px-6 sm:px-4">
  <div class="container mx-auto flex max-w-6xl flex-wrap items-center justify-between">
    <a href="#" class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-3 h-6 text-blue-500 sm:h-9">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>

      <span class="self-center whitespace-nowrap text-xl font-semibold">Termcode</span>
    </a>
    <div class="mt-2 sm:mt-0 sm:flex md:order-2">
      <!-- Login Button -->
      <button type="button" class="rounde mr-3 hidden border border-blue-700 py-1.5 px-6 text-center text-sm font-medium text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:inline-block rounded-lg">Login</button>
      <button type="button" class="rounde mr-3 hidden bg-blue-700 py-1.5 px-6 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 md:mr-0 md:inline-block rounded-lg">Register</button>
      <!-- Register Button -->
      <button data-collapse-toggle="navbar-sticky" type="button" class="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden" aria-controls="navbar-sticky" aria-expanded="false">
        <span class="sr-only">Open main menu</span>
        <svg class="h-6 w-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto" id="navbar-sticky">
      <ul class="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:text-sm md:font-medium">
        <li>
          <a href="#" class="block rounded bg-blue-700 py-2 pl-3 pr-4 text-white md:bg-transparent md:p-0 md:text-blue-700" aria-current="page">Home</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">About</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">Services</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">Contact</a>
        </li>
      </ul>
    </div>
  </div>
</nav>


<!-- Title -->
<div class="pt-32  bg-white">
<h1 class="text-center text-2xl font-bold text-gray-800">All Products</h1>
</div>

<!-- Tab Menu -->
<div class="flex flex-wrap items-center  overflow-x-auto overflow-y-hidden py-10 justify-center   bg-white text-gray-800">
	<a rel="noopener noreferrer" href="#" class="flex items-center flex-shrink-0 px-5 py-3 space-x-2text-gray-600">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
		</svg>
		<span>Architecto</span>
	</a>
	<a rel="noopener noreferrer" href="#" class="flex items-center flex-shrink-0 px-5 py-3 space-x-2 rounded-t-lg text-gray-900">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
			<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
			<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
		</svg>
		<span>Corrupti</span>
	</a>
	<a rel="noopener noreferrer" href="#" class="flex items-center flex-shrink-0 px-5 py-3 space-x-2  text-gray-600">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
			<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
		</svg>
		<span>Excepturi</span>
	</a>
	<a rel="noopener noreferrer" href="#" class="flex items-center flex-shrink-0 px-5 py-3 space-x-2  text-gray-600">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
			<circle cx="12" cy="12" r="10"></circle>
			<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
		</svg>
		<span>Consectetur</span>
	</a>
</div>

<!-- Product List -->
<section class="py-10 bg-gray-100">
  <div class="mx-auto grid max-w-6xl  grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    <article class="rounded-xl bg-white p-3 shadow-lg hover:shadow-xl hover:transform hover:scale-105 duration-300 ">
      <a href="#">
        <div class="relative flex items-end overflow-hidden rounded-xl">
          <img src="https://images.unsplash.com/flagged/photo-1556637640-2c80d3201be8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" alt="Hotel Photo" />
          <div class="flex items-center space-x-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-white duration-100 hover:bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>

            <button class="text-sm">Add to cart</button>
          </div>
        </div>

        <div class="mt-1 p-2">
          <h2 class="text-slate-700">The Hilton Hotel</h2>
          <p class="mt-1 text-sm text-slate-400">Lisbon, Portugal</p>

          <div class="mt-3 flex items-end justify-between">
              <p class="text-lg font-bold text-blue-500">$450</p>
            <div class="flex items-center space-x-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-white duration-100 hover:bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>

              <button class="text-sm">Add to cart</button>
            </div>
          </div>
        </div>
      </a>
    </article>
    </div>
</section>

<!-- Footer -->
<footer class="py-6  bg-gray-200 text-gray-900">
	<div class="container px-6 mx-auto space-y-6 divide-y divide-gray-400 md:space-y-12 divide-opacity-50">
		<div class="grid justify-center  lg:justify-between">
			<div class="flex flex-col self-center text-sm text-center md:block lg:col-start-1 md:space-x-6">
				<span>Copy rgight © 2023 by codemix team </span>
				<a rel="noopener noreferrer" href="#">
					<span>Privacy policy</span>
				</a>
				<a rel="noopener noreferrer" href="#">
					<span>Terms of service</span>
				</a>
			</div>
			<div class="flex justify-center pt-4 space-x-4 lg:pt-0 lg:col-end-13">
				<a rel="noopener noreferrer" href="#" title="Email" class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 duration-150 text-gray-50">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
						<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
						<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
					</svg>
				</a>
				<a rel="noopener noreferrer" href="#" title="Twitter" class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 duration-150 text-gray-50">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="currentColor" class="w-5 h-5">
						<path d="M 50.0625 10.4375 C 48.214844 11.257813 46.234375 11.808594 44.152344 12.058594 C 46.277344 10.785156 47.910156 8.769531 48.675781 6.371094 C 46.691406 7.546875 44.484375 8.402344 42.144531 8.863281 C 40.269531 6.863281 37.597656 5.617188 34.640625 5.617188 C 28.960938 5.617188 24.355469 10.21875 24.355469 15.898438 C 24.355469 16.703125 24.449219 17.488281 24.625 18.242188 C 16.078125 17.8125 8.503906 13.71875 3.429688 7.496094 C 2.542969 9.019531 2.039063 10.785156 2.039063 12.667969 C 2.039063 16.234375 3.851563 19.382813 6.613281 21.230469 C 4.925781 21.175781 3.339844 20.710938 1.953125 19.941406 C 1.953125 19.984375 1.953125 20.027344 1.953125 20.070313 C 1.953125 25.054688 5.5 29.207031 10.199219 30.15625 C 9.339844 30.390625 8.429688 30.515625 7.492188 30.515625 C 6.828125 30.515625 6.183594 30.453125 5.554688 30.328125 C 6.867188 34.410156 10.664063 37.390625 15.160156 37.472656 C 11.644531 40.230469 7.210938 41.871094 2.390625 41.871094 C 1.558594 41.871094 0.742188 41.824219 -0.0585938 41.726563 C 4.488281 44.648438 9.894531 46.347656 15.703125 46.347656 C 34.617188 46.347656 44.960938 30.679688 44.960938 17.09375 C 44.960938 16.648438 44.949219 16.199219 44.933594 15.761719 C 46.941406 14.3125 48.683594 12.5 50.0625 10.4375 Z"></path>
					</svg>
				</a>
				<a rel="noopener noreferrer" href="#" title="GitHub" class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 duration-150 text-gray-50">
					<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
						<path d="M10.9,2.1c-4.6,0.5-8.3,4.2-8.8,8.7c-0.5,4.7,2.2,8.9,6.3,10.5C8.7,21.4,9,21.2,9,20.8v-1.6c0,0-0.4,0.1-0.9,0.1 c-1.4,0-2-1.2-2.1-1.9c-0.1-0.4-0.3-0.7-0.6-1C5.1,16.3,5,16.3,5,16.2C5,16,5.3,16,5.4,16c0.6,0,1.1,0.7,1.3,1c0.5,0.8,1.1,1,1.4,1 c0.4,0,0.7-0.1,0.9-0.2c0.1-0.7,0.4-1.4,1-1.8c-2.3-0.5-4-1.8-4-4c0-1.1,0.5-2.2,1.2-3C7.1,8.8,7,8.3,7,7.6C7,7.2,7,6.6,7.3,6 c0,0,1.4,0,2.8,1.3C10.6,7.1,11.3,7,12,7s1.4,0.1,2,0.3C15.3,6,16.8,6,16.8,6C17,6.6,17,7.2,17,7.6c0,0.8-0.1,1.2-0.2,1.4 c0.7,0.8,1.2,1.8,1.2,3c0,2.2-1.7,3.5-4,4c0.6,0.5,1,1.4,1,2.3v2.6c0,0.3,0.3,0.6,0.7,0.5c3.7-1.5,6.3-5.1,6.3-9.3 C22,6.1,16.9,1.4,10.9,2.1z"></path>
					</svg>
				</a>
			</div>
		</div>
	</div>
</footer>
</template>
~~~

- Coloco el componente en el router

~~~js
import ShopLayout from '@/modules/shop/layouts/ShopLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'shop',
      component: ShopLayout
    }
  ],
})

export default router
~~~

- Vamos a querer separar el Layout en diferentes componentes (el navbar, por ejemplo)
- modules/shop/components/TopMenu.vue
- Compacto el nav y lo pego dentro de un template en el TopMenu.vue

~~~vue
<template>
  <nav class="fixed top-0 left-0 z-20 w-full border-b border-gray-200 bg-white py-2.5 px-6 sm:px-4">
  <div class="container mx-auto flex max-w-6xl flex-wrap items-center justify-between">
    <a href="#" class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-3 h-6 text-blue-500 sm:h-9">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>

      <span class="self-center whitespace-nowrap text-xl font-semibold">Termcode</span>
    </a>
    <div class="mt-2 sm:mt-0 sm:flex md:order-2">
      <!-- Login Button -->
      <button type="button" class="rounde mr-3 hidden border border-blue-700 py-1.5 px-6 text-center text-sm font-medium text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:inline-block rounded-lg">Login</button>
      <button type="button" class="rounde mr-3 hidden bg-blue-700 py-1.5 px-6 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 md:mr-0 md:inline-block rounded-lg">Register</button>
      <!-- Register Button -->
      <button data-collapse-toggle="navbar-sticky" type="button" class="inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden" aria-controls="navbar-sticky" aria-expanded="false">
        <span class="sr-only">Open main menu</span>
        <svg class="h-6 w-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
      </button>
    </div>
    <div class="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto" id="navbar-sticky">
      <ul class="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:text-sm md:font-medium">
        <li>
          <a href="#" class="block rounded bg-blue-700 py-2 pl-3 pr-4 text-white md:bg-transparent md:p-0 md:text-blue-700" aria-current="page">Home</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">About</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">Services</a>
        </li>
        <li>
          <a href="#" class="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 md:p-0 md:hover:bg-transparent md:hover:text-blue-700">Contact</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
</template>
~~~

- Lo renderizo en el layout
- Hago lo mismo con el footer
- Añado el año actual en el copyright

~~~js
<span>Copyright © {{ new Date().getFullYear() }} by Meikakuzen team </span>
~~~

- El TabMenu y el ProductList debería de ser nuestra pantalla del home (el título también)
- Los compacto, los copio y los pego en el HomeView.vue
- modules/shop/views/HomeView.vue
- Uso el RouterView en el ShopLayout.vue para mostrar el HomeView

~~~vue
<template>
<top-menu />

<router-view />

<custom-footer />
</template>


<script setup lang="ts">
import CustomFooter from '../components/CustomFooter.vue';
import TopMenu from '../components/TopMenu.vue';

</script>
~~~

- En el router uso children
- La ruta tiene el path vacío para que se apunte al shop

~~~js
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
    }
  ],
})

export default router
~~~

- Cada componente que se muestra en el home (los articulos) también deben ser independientes

## Levantar nuestro backend


- URL del backend

> https://github.com/Klerith/nest-teslo-shop/tree/complete-backend

- Descargo el código, lo pego en la carpeta backend dentro de la aplicación, hago npm i
- Falta la DB. Copio el .env.template en un .env, abro Docker y uso docker compose up -d en la terminal
- Llamo al seed para recrear la DB, apunto a localhost:3000/api/seed
- Hago una prueba con un GET a localhost:3000/api/products en POSTMAN
- Para ver la DB puedo usar Table Plus, creo una nueva DB de Postgres, con el puerto definido en el archivo de Docker (5432)
  - User es postgres, database es TesloDB
  - Los passwords de los usuarios test1 y test2 es Abc123
- El .env

~~~

STAGE=dev

DB_PASSWORD=MySecr3tPassWord@as2
DB_NAME=TesloDB
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres

PORT=3000
HOST_API=http://localhost:3000/api

JWT_SECRET=Est3EsMISE3Dsecreto32s
~~~

## Variables de entorno - Axios

- Creo src/api/tesloApi-ts
- Lo creo en src porque todos los módulos pasan por este mismo api. Si tuviera uno para store, lo crearía en el módulo store
- Instalo axios con npm
- Exporto tesloApi como un objeto porque haremos uso de interceptores
- tesloApi.ts

~~~js
import axios from 'axios'


const tesloApi = axios.create({
    baseURL: import.meta.env.VITE_TESLO_API_URL
})

//Interceptors
export {tesloApi}
~~~

- Creo el .env en el frontend
- Hay que ponerle VITE delante a la variable para poder usarla

~~~
VITE_STAGE=dev

VITE_TESLO_API_URL=http://localhost:3000/api
~~~

- Es conveniente dejar un README.md

~~~md
# Admin Shop


- Pasos para dev

1. Clonar el repositorio
2. Instalar dependencias
3. Crear un archivo .env basado en el .env.template
4. Correr el proyecto con `npm run dev`
~~~

## Obtener productis paginados

- Primero los extraemos, luego los conectamos a un gestor de estado, manejaremos caché, etc
- Creo en products/actions/get-products.action.ts
- Creo un archivo de barril para exportar las diferentes actios
- get-products.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get('/products')
        console.log(data)
        return (data)
    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- En el script de shop/views/Homeview.vue

~~~vue
<script lang="ts" setup>
import { getProductsAction } from '@/modules/products/actions/get-products.action';


  getProductsAction()
</script>
~~~

- En la consola del navegador me devuelve un array con 10 objetos, cada objeto luce así

~~~
description: 
"Introducing the Tesla Chill Collection. The Women's Chill Half Zip Cropped Hoodie has a premium, soft fleece exterior and cropped silhouette for comfort in everyday lifestyle. The hoodie features an elastic hem that gathers at the waist, subtle thermoplastic polyurethane Tesla logos along the hood and on the sleeve, a double layer single seam hood and a custom ring zipper pull. Made from 60% cotton and 40% recycled polyester."
gender: "women"
id: "0b2d7456-2f7f-4d63-adcf-d0a7be0bda46"
images: (2) ['1740226-00-A_0_2000.jpg', '1740226-00-A_1.jpg']
price: 130
sizes: (4) ['XS', 'S', 'M', 'XXL']
slug: "women_chill_half_zip_cropped_hoodie"
stock: 10
tags: ['hoodie']
title: "Women's Chill Half Zip Cropped Hoodie"
user:{id: '119e2450-1428-4b16-bec8-a2d28ba199fe', email: 'test1@google.com', fullName: 'Test One', isActive: true, roles: Array(1)}
~~~

- Con esta estructura, si trabajaramos con un backend de terceros, podríamos pensar en crear un mapper (traducir este objeto a nuestra estructura de datos en la aplicación) para evitar errores con cambios inesperados en el backend

- Quiero tipar la respuesta, por lo que la copio de POSTMAN y uso PasteJSONasCode
- En products/interfaces/product.interface.ts
- Hago algunas correcciones

~~~js
export interface Product{
    id:          string;
    title:       string;
    price:       number;
    description: string;
    slug:        string;
    stock:       number;
    sizes:       Size[];
    gender:      Gender;
    tags:        string[]; //arreglo de strings
    images:      string[];
    user:        User;
}

export enum Gender {
    Kid = "kid",
    Men = "men",
    Women = "women",
}

export enum Size {
    L = "L",
    M = "M",
    S = "S",
    Xl = "XL",
    Xs = "XS",
    Xxl = "XXL",
}

export enum Tag {
    Hoodie = "hoodie",
    Shirt = "shirt",
    Sweatshirt = "sweatshirt",
}

//este User debe de estar en el módulo de auth
export interface User {
    id:       string;
    email:    string;
    fullName: string;
    isActive: boolean;
    roles:   string[];
}

{/*export enum Email {
    Test1GoogleCOM = "test1@google.com",
}

export enum FullName {
    TestOne = "Test One",
}

export enum Role {
    Admin = "admin",
}*/}
~~~

- auth/interfaces/user.interface.ts

~~~js
export interface User {
    id:       string;
    email:    string;
    fullName: string;
    isActive: boolean;
    roles:   string[];
}
~~~

- Ahora ya puedo tipar la respuesta de getProductsAction

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product} from "../interfaces/products-response.interface"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get<Product[]>('/products')
        console.log(data[0]?.gender) //ya tengo el tipado
        return (data)
    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- Puedo mandarle params a la url de products, por ejemplo que me de dos registros y empiece despues de los siguientes 10 registros

> localhost:3000/api/products?limit=2&offset=10

- Uso template literal para incluir el limit y el offset

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product} from "../interfaces/products-response.interface"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get<Product[]>(`/products?limit=${limit}&offset=${page * limit}`)
        console.log(data[0]?.gender)
        return (data)
    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- Tener la petición directamente en el script del HomeView no luce bien
- Además quiero manejarlo en caché

## TanStack Query - useQuery

- Llamando a la action desde el script de HomeView hacemos la petición http tan pronto entramos al componente
- Instalo TanStack Query (también es un gestor de estado para peticiones http)

> npm i @tanstack/vue-query

- Hay que hacer uso del VueQueryPlugin
- main.ts

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)

app.mount('#app')
~~~

- Ya se pueden empezar a hacer peticiones http y usar useQuery
- Hay otra instalación interesante para tanstack que son las devtools

> npm i @tanstack/vue-query-devtools

- Se necesita colocar este componente en el nivel más alto de la aplicación (App.vue)

~~~vue
<template>
<router-view />
<vue-query-devtools />
</template>

<script lang="ts" setup>
  import { VueQueryDevtools} from '@tanstack/vue-query-devtools';
</script>
~~~

- Esto es todo. Abajo, en el bottom right de la pantalla del navegador aparece como un icono de una playa tropical
- Son las devtools
- En modules/shop/views/HomeView.vue no ocupo hacer la petición http de esta forma (llamando simplemente a la action)
- Usemos useQery, en la propiedad queryKey (es un arreglo) le paso como primer argumento 'products' y le indico la página 1
- Lo que pongo entre las llaves del queryKey crea una llave, un identificador único
- Este queryKey puedo usarlo como caché, puedo ponerle un tiempo de duración
- El queryFn es la función que voy a llamar cuando se llame a este composable
- Pudo desestructurar varias cosas del useQuery, la data que renombro a products y el isLoading, entre otros
- En el script del HomeView.vue

~~~vue
<script lang="ts" setup>
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import { useQuery } from '@tanstack/vue-query';

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page:1}],
  queryFn: ()=> getProductsAction()
})

</script>
~~~

- Puedo colocar estos products en un div dentro del template

~~~html
<div>
  loading: {{ isLoading }}
</div>
<div>
  {{ products }}
</div>
~~~

- Aparece el loading en false y un arreglo con los objetos de los productos
- Si miro las devtools de TansTack podemos acceder a la data que se encuentra en el caché de la llave
- La llave es

~~~js
[
  "products",
  {
    "page":1
  }
]
~~~

- La data es el arreglo con los products
- Si alguien vuelve a hacer una petición a este queryKey y este queryKey ya existía en el cliente (el VueQueryPlugin del main) va a brindar esta info primero en caché y luego la actualiza
- Puedo usar staleTime para indicar cuanto tiempo quiero que dure n caché

~~~js
const {data:products, isLoading} = useQuery({
  queryKey:['products', {page:1}],
  queryFn: ()=> getProductsAction(),
  staleTime: 1000 *60 //60 segundos
})
~~~

## Obtener el url de las imágenes

- Ya casi tenemos todo listo para empezar a graficar los productos en pantalla
- En el objeto Product las imágenes están en un array llamado images
- Lo que se ve es "175165-81667_1.jpg", pero necesitamos todo el url completo
- Podemos usar una función que reconstruya el url cada vez que muestra un producto o reconstruimos el url en la petición y lo mantenemos
- Para ver una imagen están en localhost:3000/api/files/product/082732873_1.jpg
- Este es el URL que necesito, pero en producción el dominio va a variar, no será localhost, por lo que usaremos una variable de entorno
- Creo una nueva acción
- En products/action/get-product-image.action.ts

~~~js
export const getProductImageAction =(imageName: string): string=> {

    return imageName.includes('http')
    ? imageName
    : `${import.meta.env.VITE_TESLO_API_URL}/files/product/${imageName}`
}
~~~

- Creo un archivo de barril para exportar las actions
- index.ts

~~~js
export * from './get-products.action'
export * from './get-product-image.action'
~~~

- En el get-products.action uso esta función
- Esparzo el product con el spread y en el map le paso la función pro referencia

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product} from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get<Product[]>(`/products?limit=${limit}&offset=${page * limit}`)
        
        return data.map(product=>{
            return{
                ...product,
                images: product.images.map(getProductImageAction)
            }
        })
    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- Se puede formatear sin el return usando el return implicito con los paréntesis

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product} from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get<Product[]>(`/products?limit=${limit}&offset=${page * limit}`)
        
        return data.map(product=>({
            ...product,
            images: product.images.map(getProductImageAction)}))

    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- Puedo usar las devtools de Tanstack para ver que la url está formateada correctamente

## Mostrar productos en pantalla

- En modules/shop/views/HomeView.vue tengo el article que será el ProductCard
- Vamos a dividir la vista de productos en 2 componentes, ProductList y ProductCard
  - En el ProductList vamos a recibir un arreglo de productos y en el ProductCard el producto 
- No importa mucho como lo hagamos porque luego lo vamos a administrar a través de un panel administrativo
- En modules/products/components/ProductList.vue pego todo el section que tengo en HomeView.vue
- Borrando todos los article de dentro me queda esto

~~~vue
<template>
  <section class="py-10 bg-gray-100">
    <div class="mx-auto grid max-w-6xl  grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">  
      <!--Aqui va el ProductCard (el article con la data)-->
    </div>
  </section>
</template>
~~~

- En el ProductCard tengo el article sin tunear que había dentro del ProductList.vue

~~~vue
<template>
    <article class="rounded-xl bg-white p-3 shadow-lg hover:shadow-xl hover:transform hover:scale-105 duration-300 ">
      <a href="#">
        <div class="relative flex items-end overflow-hidden rounded-xl">
          <img src="https://images.unsplash.com/photo-1520256862855-398228c41684?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80" alt="Hotel Photo" />
          <div class="flex items-center space-x-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-white duration-100 hover:bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>

            <button class="text-sm">Add to cart</button>
          </div>
        </div>

        <div class="mt-1 p-2">
          <h2 class="text-slate-700">The Hilton Hotel</h2>
          <p class="mt-1 text-sm text-slate-400">Lisbon, Portugal</p>

          <div class="mt-3 flex items-end justify-between">
              <p class="text-lg font-bold text-blue-500">$450</p>
            <div class="flex items-center space-x-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-white duration-100 hover:bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>

              <button class="text-sm">Add to cart</button>
            </div>
          </div>
        </div>
      </a>
    </article>
</template>
~~~

- En el ProductList.vue renderizo el ProductCard, y en el HomeView.vue renderizo el ProductList
- Para manejar la data por las props, se recomienda empezar por el componente que realmente necesita la info
  - Por el nieto, luego el padre y luego el abuelo
- Creo las interfaces y uso defineProps 
- ProductList.vue

~~~vue
<template>
    <section class="py-10 bg-gray-100">
  <div class="mx-auto grid max-w-6xl  grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">  
        <ProductCard 
        v-for="product in products" :key="product.id"
        :product="product"
        />
    </div>
</section>
</template>


<script setup lang="ts">
import type { Product } from '../interfaces/products-response.interface';
import ProductCard from './ProductCard.vue';

interface Props{
    products: Product[]
}

defineProps<Props>()

</script>
~~~

- En el HomeView.vue donde muestro el ProductList, si le paso el arreglo de products me da error, **porque en algún punto del tiempo es undefined**
- Podemos crear un loading usando v-if y v-else para los products, negando products en el v-if

~~~vue
<template>
{...code}

<div v-if="!products" class="text-center h-[500px]">
  <h1 class="text-xl">Cargando productos...</h1>
  <p>Espere por favor</p>
</div>
<!-- Product List -->
  <ProductList v-else :products="products"/>
</template>


<script lang="ts" setup>
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery } from '@tanstack/vue-query';

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page:1}],
  queryFn: ()=> getProductsAction(),
})

</script>
~~~

- Ahora si carga los 10 resultados en duro en pantalla
- Falta la carpinteria del ProductCard, ya tengo el product listo para consumir
- ProductCard.vue

~~~vue
<template>
    <article class="rounded-xl bg-white p-3 shadow-lg hover:shadow-xl hover:transform hover:scale-105 duration-300 ">
      <a href="#">
        <div class="relative flex items-end overflow-hidden rounded-xl">
          <img :src="product.images[0]" :alt="product.title" />
        </div>

        <div class="mt-1 p-2">
          <h2 class="text-slate-700 capitalize">{{ product.title }}</h2>
          <p class="mt-1 text-sm text-slate-400">{{ product.gender }}</p>

          <div class="mt-3 flex items-end justify-between">
              <p class="text-lg font-bold text-blue-500">{{ product.price }}</p>
            <div class="flex items-center space-x-1.5 rounded-lg bg-blue-500 px-4 py-1.5 text-white duration-100 hover:bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>

              <button class="text-sm">Add to cart</button>
            </div>
          </div>
        </div>
      </a>
    </article>
</template>


<script lang="ts" setup>
import type { Product } from '../interfaces/products-response.interface';

    interface Props{
        product: Product
    }

    defineProps<Props>()

</script>
~~~

## Componente para la paginación

- modules/common/components/ButtonPagination.vue

~~~vue
<template>
    <div class="flex justify-center py-10 bg-gray-100 space-x-3">
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 bg-blue-500 disabled:bg-gray-300">
            <span class="text-white text-xl">Anteriores</span>
        </button>
        
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 bg-blue-500 disabled:bg-gray-300">
            <span class="text-white text-xl">Siguientes</span>
        </button>

    </div>
</template>
~~~

- Coloco el componente debajo del ProductList en HomeView.vue
- Para los iconos puedo crear src/icons en el filesystem
- Busco los iconos en Vector Collections

> https://www.svgrepo.com/collections/all/

- Uso chevron right y chevron left. Si le doy a Edit Vector puedo copiar el SVG
- Les añado un width y un height de unos 25 pixeles
- ChevronRight.vue
  
~~~vue
<template>
    <svg width="25px" height="25px"
    width="25px" heigth="25px" 
    viewBox="-5.5 0 26 26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000"><g id="SVGRepo_bgCarrier" 
    stroke-width="0"></g><g id="SVGRepo_tracerCarrier" 
    stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier"> <title>chevron-right</title> 
        <desc>Created with Sketch Beta.</desc> 
        <defs> </defs> 
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> 
            <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-474.000000, -1196.000000)" fill="#000000"> 
        <path d="M488.404,1207.36 L477.637,1197.6 C476.806,1196.76 475.459,1196.76 474.629,1197.6 C473.798,1198.43 473.798,1199.77 474.629,1200.6 L483.885,1209 L474.629,1217.4 C473.798,1218.23 473.798,1219.57 474.629,1220.4 C475.459,1221.24 476.806,1221.24 477.637,1220.4 L488.404,1210.64 C488.854,1210.19 489.052,1209.59 489.015,1209 C489.052,1208.41 488.854,1207.81 488.404,1207.36" 
        id="chevron-right" 
        sketch:type="MSShapeGroup"> 

    </path> 
    </g> 
    </g> </g>
    </svg>
</template>
~~~

- ChevronLeft.vue

~~~vue
<template>
    <svg width="25px" height="25px" 
    viewBox="-5.5 0 26 26" version="1.1" xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" 
    fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" 
    stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
        <title>chevron-left</title> 
        <desc>Created with Sketch Beta.</desc> 
        <defs> </defs> 
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> 
        <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-423.000000, -1196.000000)" fill="#ffffff"> 
        <path d="M428.115,1209 L437.371,1200.6 C438.202,1199.77 438.202,1198.43 437.371,1197.6 C436.541,1196.76 435.194,1196.76 434.363,1197.6 L423.596,1207.36 C423.146,1207.81 422.948,1208.41 422.985,1209 C422.948,1209.59 423.146,1210.19 423.596,1210.64 L434.363,1220.4 C435.194,1221.24 436.541,1221.24 437.371,1220.4 C438.202,1219.57 438.202,1218.23 437.371,1217.4 L428.115,1209" id="chevron-left" sketch:type="MSShapeGroup"> 
        </path> 
        </g> </g> 
        </g></svg>
</template>
~~~

- Para usarlos, los coloco en los botones

~~~vue
<template>
    <div class="flex justify-center py-10 bg-gray-100 space-x-3">
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600">
            <ChevronLeft />
            <span class="text-white text-lg">Anteriores</span>
        </button>
        
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600">
            <span class="text-white text-lg">Siguientes</span>
            <ChevronRight />
        </button>

    </div>
</template>

<script setup lang="ts">
import ChevronLeft from '@/icons/ChevronLeft.vue';
import ChevronRight from '@/icons/ChevronRight.vue';

</script>
~~~

- Para editar el color es más fácil hacerlo desde la web

## Funcionalidad de la paginación

- Hay varias maneras de manejar la paginación
- Una de ellas es manejar una variable en JS para saber en qué página estamos, cual es la siguiente, etc, un simple contador
  - Lo malo de esta manera es que el usuario no va a poder moverse usando la barra de navegación (adelante y atrás)
- Se recomienda que la paginación venga como argumento en el URL
- ButtonPagination.vue

~~~vue
<script setup lang="ts">
import ChevronLeft from '@/icons/ChevronLeft.vue';
import ChevronRight from '@/icons/ChevronRight.vue';

interface Props{
    page: number
    firstPage: boolean
    hasMoreData: boolean
}

defineProps<Props>()

</script>
~~~

- En el HomeView.vue que es donde está el componente, tengo que pasarle las props

~~~vue
<ButtonPagination  :has-more-data="true" :first-page="true" :page="1"/>
~~~

- Cuando los argumentos son opcionales con el interrogante "localhost:3000/api/products?page=1" no necesitamos definirlos en el router
- Usamos useRoute en el HomeView.vue para extraer la página de la ruta

~~~vue

<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue';
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';

const route = useRoute()

const page = route.query.page

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page:1}],
  queryFn: ()=> getProductsAction(),
})

</script>
~~~

- Si hago un console.log me devuelve page 1, pero porque en la URL está ?page=1
- Si no hay page me devuelve undefined, además estoy esperando que la página sea un número
  - Si no tenemos la página va a ser un 1, lo parseo a número
  - Dependiendo de qué página tengo necesito mandárselo al getProductsAction
  - Podría hacerse así
  - El problema es que cuando el URL cambie, page no es una variable reactiva
  - Envolvemos page en un ref
- HomeView.vue

~~~vue
<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue';
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery } from '@tanstack/vue-query';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const page = ref(Number(route.query.page || 1))

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page: page.value}],
  queryFn: ()=> getProductsAction(page.value),
})

</script>
~~~

- Pasemosle las props al componente (seguimos en HomeView.vue, ahora en el template)
- La doble negación es un valor booleano de si hay productos

~~~js
<ButtonPagination  
          :has-more-data="!!products && products.length < 10" 
  				:first-page="page === 1" 
					:page="page"/>
~~~


- En el ButtonPagination.vue, cuando hago click quiero navegar a la siguiente pantalla
- Si estamos en la primera página, el botón de anterior está deshabilitado
- Con $router tengo acceso al router, uso .push para añadir una nueva ruta al historial

~~~vue
<template>
    <div class="flex justify-center py-10 bg-gray-100 space-x-3">
        <button 
        class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="firstPage"
        @click="$router.push({query: {page: page-1}})"
        >
            <ChevronLeft />
            <span class="text-white text-lg">Anteriores</span>
        </button>
        
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="hasMoreData"
        @click="$router.push({query: {page: page +1}})"
        >
            <span class="text-white text-lg">Siguientes</span>
            <ChevronRight />
        </button>

    </div>
</template>

<script setup lang="ts">
import ChevronLeft from '@/icons/ChevronLeft.vue';
import ChevronRight from '@/icons/ChevronRight.vue';

interface Props{
    page: number
    firstPage: boolean
    hasMoreData: boolean
}

defineProps<Props>()

</script>
~~~

- De esta manera no funciona de la manera que espero, se cambia el query parameter pero lo que pasa es que el HomeView no se vuelve a reconstruir, por lo que no me muestra la nueva data
- La página que es una variable reactiva, no se está volviendo a recalcular con el cambio
- Necesito estar pendiente de los cambios
- Para ello puedo usar watch o watcheffect, pero el watch me va a servir para especificar de lo que quiero estar pendiente
- HomeView.vue

~~~vue
<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue';
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const page = ref(Number(route.query.page || 1))

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page: page}], //le paso la variable reactiva page
  queryFn: ()=> getProductsAction(page.value),
})

watch(
	()=>route.query.page,
	(newPage)=>{
		page.value = Number(newPage || 1) //será uno si devuelve undefined
	}
)

</script>
~~~

- Ya no ocupamos el firstPage, porque ya tenemos el page reactivo, lo podemos borrar

~~~vue
<template>
    <div class="flex justify-center py-10 bg-gray-100 space-x-3">
        <button 
        class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="page == 1"
        @click="$router.push({query: {page: page-1}})"
        >
            <ChevronLeft />
            <span class="text-white text-lg">Anteriores</span>
        </button>
        
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="hasMoreData"
        @click="$router.push({query: {page: page +1}})"
        >
            <span class="text-white text-lg">Siguientes</span>
            <ChevronRight />
        </button>

    </div>
</template>

<script setup lang="ts">
import ChevronLeft from '@/icons/ChevronLeft.vue';
import ChevronRight from '@/icons/ChevronRight.vue';

interface Props{
    page: number
    hasMoreData: boolean
}

defineProps<Props>()

</script>
~~~

- Faltaría hacer que la pantalla cuando recarga se vea desde arriba

##  Carga adelantada y scroll

- Además de que la pantalla del navegador vaya arriba cuando cambio de página, quiero precargar la data de la página siguiente, para una mejor experiencia de usuario
- Hago el scroll en el watch
- HomeView.vue

~~~vue
<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue';
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const page = ref(Number(route.query.page || 1))

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page: page}],
  queryFn: ()=> getProductsAction(page.value),
})

watch(
	()=>route.query.page,
	(newPage)=>{
		page.value = Number(newPage || 1)

		window.scrollTo({top:0, behavior: 'smooth'})
	}
)

</script>
~~~

- Hagamos una carga automática basada en cuando la página cambia
- Se recomienda que cada watch tenga una tarea específica
- Uso watchEffect para que se dispare cuando alguna variable reactiva cambie
- Tomo el cliente de TanstackQuery, que hace referencia a el query que tenemos (el queryPlugin, que es el acceso al store)
  - Por lo tanto, apuntamos al store
  - Le paso el queryKey y le añado al page.value +1
  - La queryFn es la misma, también le añado +1

~~~vue
<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue';
import { getProductsAction } from '@/modules/products/actions/get-products.action';
import ProductList from '@/modules/products/components/ProductList.vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const page = ref(Number(route.query.page || 1))
const queryClient = useQueryClient()

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page: page}],
  queryFn: ()=> getProductsAction(page.value),
})

watch(
	()=>route.query.page,
	(newPage)=>{
		page.value = Number(newPage || 1)

		window.scrollTo({top:0, behavior: 'smooth'})
	}
)

watchEffect(()=>{
	queryClient.prefetchQuery({
		queryKey: ['products', {page: page.value +1}],
		queryFn: ()=> getProductsAction(page.value), 
	})
})

</script>
~~~

- En las devtools de tanstack puedo ver las dos peticiones
- Hay un brinco porque las imágenes no tienen un tamaño fijo
- Les pongo un height de 250 y le añado object-cover
- ProductCard.vue

~~~js
<div class="relative flex items-end overflow-hidden rounded-xl">
    <img 
    class="h-[250px] object-cover"
    :src="product.images[0]" :alt="product.title" />
</div>
~~~

