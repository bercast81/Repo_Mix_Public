# 07 Vue Herrera - Router

- Tendremos un Home, Features, Pricing, Contact, Pokemons, Login
- Pondremos un contador en el Home, al que si yo le cambio el valor y me muevo entre pantallas, seguirá manteniendo el número que había dejado en el contador. Lo haremos sin un gestor de estado, sino con algo del Vue Router llamado keep alive
- En el login noharemos autenticación todavía
- Si hago Login (simplemente clicando el botón de Login) guardo en el localstorage userId: ABC-123
  - En pantalla vemos un pokémon con un id, que se rige por la url. Hay un botón de siguiente que incrementa el id del pokemon en 1 en la url, mostrando el pokemon correspondiente a ese id
  - La url va a lucir tipo localhost:5173/pokemon/1
- Es una Single Page Aplication

## Inicio del proyecto


> npm create vue@latest

- name vue-spa
- Router: si //mostraremos como configurarlo
- Vitest: si
- ESLint: si
- Prettier: si
- En la carpeta del proyecto

> npm i 

- Configuramos Tailwind

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
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')
~~~

## Preparación de la estructura de archivos

- src/assets/styles.css
- src/modules
- src/modules/landing/pages/ContactPage.vue
- En pages creo también FeaturesPages.vue, HomePage.vue, PricingPage.vue
- Aprendamos a instalar el Vue Router

## Instalación de Vue Router

> npm i vue-router@4

- src/router/index.ts

~~~js
import HomePage from '@/landing/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    }
  ],
})

export default router
~~~

- En el main.ts

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')
~~~

- En lugar de llamar al componente en el router, podemos usar una función de flecha y usar import con la dirección del componente
- Cuando se haga el build se crean unos chunks
- Usando la función se carga la página solo cuando se entra en ella (lazy loading)

~~~js
import HomePage from '@/modules/landing/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    },
    {
      path: '/features',
      name: 'features', //opcional
      component: ()=>import('@/modules/landing/pages/FeaturesPage.vue')
    },
    {
      path: '/pricing',
      name: 'pricing', //opcional
      component: ()=>import('@/modules/landing/pages/PricingPage.vue')
    },
    {
      path: '/contact',
      name: 'contact', //opcional
      component: ()=>import('@/modules/landing/pages/ContactPage.vue')
    },
  ],
})

export default router
~~~

- En App.vue tengo que usar el RouterView
- Creo un nav con links para la navegación (provisional)

~~~vue
<template>
  <nav>
    <a href="/">Home</a>
    <a href="/features">Features</a>
    <a href="/pricing">Pricing</a>
    <a href="/contact">Contact</a>
  </nav>

  <main>
    <RouterView />
  </main>
</template>

<style scoped></style>

<script setup lang="ts">
</script>
~~~

- De esta manera el nav se ve en todas las páginas (Features, Pricing,etc)

## Re-utilización de estructura HTML


- En el router usamos createWebHistory pero también hay un createWebHashHistory (con la que aparece # en la url)
- ¿Cuál es la diferencia?
- Usaremos el createWebHashHistory cuando no se puede cambiar l amanera en que la aplicación es serivda del lado del backend
- Por ejemplo, cuando la subes a githubPages, Netlify en versión gratuita, donde el servidor solo sirve archivos html, css y js, y no puedes indicarle al backend que todas las rutas de mi app (los requests, solicitudes, que están llegando a mi backend) los redireccione a mi aplicación
- La parte después del # es manejada completamente por el navegador, lo que significa que no se hace una solicitud al servidor cuando cambian las rutas. Solo cambia lo que se muestra en el navegador, pero el servidor no recibe ninguna solicitud diferente.
- Es útil cuando no tienes control sobre el servidor o no puedes configurarlo para que redirija todas las solicitudes a tu index.html. En este caso, el navegador solo necesita saber qué ruta está activa en la aplicación, pero el servidor no tiene que preocuparse por las rutas de la SPA.
- Si subes tu aplicación a plataformas como GitHub Pages o Netlify en su versión gratuita, estas plataformas solo sirven archivos estáticos (HTML, CSS, JS). No puedes decirle al servidor que todas las rutas deben redirigir a tu aplicación. Por eso, el uso de # en las URLs es más sencillo y funciona en estos entornos.
- Si quieres usar createWebHistory (sin el # en el url) se necesita porder servir la app de tal manera que se le diga que en todas las requests que vengan que sirvan esta aplicación. Es más SEO friendly
Esto significa que el navegador sigue el flujo normal de URLs y el servidor tiene que estar configurado para manejar estas rutas.
- ¿Por qué es mejor?
- El uso de URLs limpias sin # tiene ventajas en términos de SEO (optimización para motores de búsqueda) y la estética de la URL, ya que se ve más profesional y "nativa" en la web. Además, las herramientas modernas para la web tienden a favorecer el uso de URLs normales.
- Entonces, **si vamos a subir la app a la nube y no tenemos acceso al backend: createWebHashHistory**
- Aunque trabaje con el createWebhashHistory no usaré el # en el href de los anchor tags
- Se usa el elemento **RouterLink**
- No se usa href, se usa **to**

~~~vue
<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/features">Features</RouterLink>
    <RouterLink to="/pricing">Pricing</RouterLink>
    <RouterLink to="/contact">Contact</RouterLink>
  </nav>

  <main>
    <RouterView />
  </main>
</template>

<style scoped></style>

<script setup lang="ts">
</script>
~~~

- Tenemos un gist en klerith/VueRouterTemplate.vue
- Lo pego en App.vue
- Uso RouterLink, le coloco las rutas, copio el favicon.ico y lo pego en assets, lo renombro a logo.ico

~~~vue
<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <header class="flex items-center h-14 px-4 border-b border-gray-300 sm:h-16 md:px-6 lg:px-8">
      <div>
        <a class="flex items-center gap-2 font-semibold" href="#">
          <img alt="Vue logo" class="logo" src="@/assets/logo.ico" width="40" height="40" />
        </a>
      </div>
      <nav class="ml-auto space-x-4 flex items-center h-10 sm:space-x-6">
        <RouterLink to="/"> Home </RouterLink>
        <RouterLink to="/features"> Features </RouterLink>
        <RouterLink to="/pricing"> Pricing </RouterLink>
        <RouterLink to="/contact"> Contact </RouterLink>
      </nav>
    </header>
    <!-- Fin Header -->

    <!-- Main -->
    <main class="flex-1 flex items-center justify-center py-6">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
          Bienvenido a nuestro sitio web
        </h1>
        <p class="mx-auto max-w-[600px] text-gray-500 md:text-xl">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </main>
    <!-- Fin Main -->

    <!-- Footer -->
    <footer class="flex items-center h-14 px-4 border-t border-gray-300 sm:h-16 md:px-6 lg:px-8">
      <p class="flex-1 text-sm text-gray-500 text-center">
        © 20xx Acme Corporation. Derechos reservados
      </p>
    </footer>
    <!-- Fin Footer -->
  </div>
</template>
~~~

- Quiero que todas mis páginas tengan este header con el nav 
- Todas van a tener este footer
- El único contenido que va a cambiar es lo que hay debajo del comentario de Main (en App.vue)
- Entonces, lo borro y coloco dentro del div el RouterView

~~~vue

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <header class="flex items-center h-14 px-4 border-b border-gray-300 sm:h-16 md:px-6 lg:px-8">
      <div>
        <a class="flex items-center gap-2 font-semibold" href="#">
          <img alt="Vue logo" class="logo" src="@/assets/logo.ico" width="40" height="40" />
        </a>
      </div>
      <nav class="ml-auto space-x-4 flex items-center h-10 sm:space-x-6">
        <RouterLink to="/"> Home </RouterLink>
        <RouterLink to="/features"> Features </RouterLink>
        <RouterLink to="/pricing"> Pricing </RouterLink>
        <RouterLink to="/contact"> Contact </RouterLink>
      </nav>
    </header>
    <!-- Fin Header -->

    <!-- Main -->
    <main class="flex-1 flex items-center justify-center">
        <RouterView />
    </main>
    <!-- Fin Main -->

    <!-- Footer -->
    <footer class="flex items-center h-14 px-4 border-t border-gray-300 sm:h-16 md:px-6 lg:px-8">
      <p class="flex-1 text-sm text-gray-500 text-center">
        © 20xx Acme Corporation. Derechos reservados
      </p>
    </footer>
    <!-- Fin Footer -->
  </div>
</template>
~~~

- Para tener siempre actualizado el año del footer podemos usar new Date

~~~js
<footer class="flex items-center h-14 px-4 border-t border-gray-300 sm:h-16 md:px-6 lg:px-8">
      <p class="flex-1 text-sm text-gray-500 text-center">
        © {{ new Date().getFullYear() }} Acme Corporation. Derechos reservados
      </p>
</footer>
~~~

## Tailwind Components

- Puedo usar el v-bind en el to del RouterLink y mandarle un objeto
- Con Ctrl+Space veo todas las opciones disponibles: force, hash, name, params, path, query, replace y state
- Con name puedo usar el name que indiqué en el router

~~~js
<nav class="ml-auto space-x-4 flex items-center h-10 sm:space-x-6">
  <RouterLink :to="{name: 'home'}"> Home </RouterLink>
  <RouterLink :to="{name: 'features' }"> Features </RouterLink>
  <RouterLink :to="{name: 'pricing'}"> Pricing </RouterLink>
  <RouterLink :to="{name: 'contact'}"> Contact </RouterLink>
</nav>
~~~

- En el home page coloco esto

~~~js
<div class="text-center">
  <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
    Bienvenido a nuestro sitio web
  </h1>
  <p class="mx-auto max-w-[600px] text-gray-500 md:text-xl">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  </p>
</div>
~~~

- En TailwindComponents hay componentes gratuitos (algunos son responsive otros no)
- Para componentes de features visitar https://www.creative-tim.com/twcomponents/component/statics-viewer
- Se le da al botón ShowCode o al clipboard para copiar el código
- Lo pego en el template de FeaturesPage.vue

~~~js
<!-- component -->
<section class="text-gray-600 body-font">
  <div class="container px-5 py-24 mx-auto">
    <div class="flex flex-col text-center w-full mb-20">
      <h1 class="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Master Cleanse Reliac Heirloom</h1>
      <p class="lg:w-2/3 mx-auto leading-relaxed text-base">Whatever cardigan tote bag tumblr hexagon brooklyn asymmetrical gentrify, subway tile poke farm-to-table. Franzen you probably haven't heard of them man bun deep jianbing selfies heirloom prism food truck ugh squid celiac humblebrag.</p>
    </div>
    <div class="flex flex-wrap -m-4 text-center">
      <div class="p-4 md:w-1/4 sm:w-1/2 w-full">
        <div class="border-2 border-gray-200 px-4 py-6 rounded-lg">
          <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="text-indigo-500 w-12 h-12 mb-3 inline-block" viewBox="0 0 24 24">
            <path d="M8 17l4 4 4-4m-4-5v9"></path>
            <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"></path>
          </svg>
          <h2 class="title-font font-medium text-3xl text-gray-900">2.7K</h2>
          <p class="leading-relaxed">Downloads</p>
        </div>
      </div>
      <div class="p-4 md:w-1/4 sm:w-1/2 w-full">
        <div class="border-2 border-gray-200 px-4 py-6 rounded-lg">
          <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="text-indigo-500 w-12 h-12 mb-3 inline-block" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"></path>
          </svg>
          <h2 class="title-font font-medium text-3xl text-gray-900">1.3K</h2>
          <p class="leading-relaxed">Users</p>
        </div>
      </div>
      <div class="p-4 md:w-1/4 sm:w-1/2 w-full">
        <div class="border-2 border-gray-200 px-4 py-6 rounded-lg">
          <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="text-indigo-500 w-12 h-12 mb-3 inline-block" viewBox="0 0 24 24">
            <path d="M3 18v-6a9 9 0 0118 0v6"></path>
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"></path>
          </svg>
          <h2 class="title-font font-medium text-3xl text-gray-900">74</h2>
          <p class="leading-relaxed">Files</p>
        </div>
      </div>
      <div class="p-4 md:w-1/4 sm:w-1/2 w-full">
        <div class="border-2 border-gray-200 px-4 py-6 rounded-lg">
          <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="text-indigo-500 w-12 h-12 mb-3 inline-block" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <h2 class="title-font font-medium text-3xl text-gray-900">46</h2>
          <p class="leading-relaxed">Places</p>
        </div>
      </div>
    </div>
  </div>
</section>
~~~

- Con el pricing hay que hacer un poco de carpintería que luego mejoraremos
- Copio los links de los íconos y los coloco primero dentro del template
- Luego copio todo lo que hay en el body (sin la etiqueta body) y lo pego después de los links (dentro del template)
- https://www.creative-tim.com/twcomponents/component/pricing-sections

~~~vue
<template>
    <link rel="preconnect" href="https://fonts.gstatic.com"> 
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <div class="min-h-screen flex justify-center items-center">
        <div class="">
            <div class="text-center font-semibold">
                <h1 class="text-5xl">
                    <span class="text-blue-700 tracking-wide">Flexible </span>
                    <span>Plans</span>
                </h1>
                <p class="pt-6 text-xl text-gray-400 font-normal w-full px-8 md:w-full">
                    Choose a plan that works best for you and<br/> your team.
                </p>
            </div>
            <div class="pt-24 flex flex-row">
                <!-- Basic Card -->
                <div class="w-96 p-8 bg-white text-center rounded-3xl pr-16 shadow-xl">
                    <h1 class="text-black font-semibold text-2xl">Basic</h1>
                    <p class="pt-2 tracking-wide">
                        <span class="text-gray-400 align-top">$ </span>
                        <span class="text-3xl font-semibold">10</span>
                        <span class="text-gray-400 font-medium">/ user</span>
                    </p>
                    <hr class="mt-4 border-1">
                    <div class="pt-8">
                        <p class="font-semibold text-gray-400 text-left">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                Get started with <span class="text-black">messaging</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                Flexible <span class="text-black">team meetings</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                <span class="text-black">5 TB</span> cloud storage
                            </span>
                        </p>

                        <a href="#" class="">
                            <p class="w-full py-4 bg-blue-600 mt-8 rounded-xl text-white">
                                <span class="font-medium">
                                    Choose Plan
                                </span>
                                <span class="pl-2 material-icons align-middle text-sm">
                                    east
                                </span>
                            </p>
                        </a>
                    </div>
                </div>
                <!-- StartUp Card -->
                <div class="w-80 p-8 bg-gray-900 text-center rounded-3xl text-white border-4 shadow-xl border-white transform scale-125">
                    <h1 class="text-white font-semibold text-2xl">Startup</h1>
                    <p class="pt-2 tracking-wide">
                        <span class="text-gray-400 align-top">$ </span>
                        <span class="text-3xl font-semibold">24</span>
                        <span class="text-gray-400 font-medium">/ user</span>
                    </p>
                    <hr class="mt-4 border-1 border-gray-600">
                    <div class="pt-8">
                        <p class="font-semibold text-gray-400 text-left">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                All features in <span class="text-white">Basic</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                Flexible <span class="text-white">call scheduling</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                <span class="text-white">15 TB</span> cloud storage
                            </span>
                        </p>

                        <a href="#" class="">
                            <p class="w-full py-4 bg-blue-600 mt-8 rounded-xl text-white">
                                <span class="font-medium">
                                    Choose Plan
                                </span>
                                <span class="pl-2 material-icons align-middle text-sm">
                                    east
                                </span>
                            </p>
                        </a>
                    </div>
                    <div class="absolute top-4 right-4">
                        <p class="bg-blue-700 font-semibold px-4 py-1 rounded-full uppercase text-xs">Popular</p>
                    </div>
                </div>
                <!-- Enterprise Card -->
                <div class="w-96 p-8 bg-white text-center rounded-3xl pl-16 shadow-xl">
                    <h1 class="text-black font-semibold text-2xl">Enterprise</h1>
                    <p class="pt-2 tracking-wide">
                        <span class="text-gray-400 align-top">$ </span>
                        <span class="text-3xl font-semibold">35</span>
                        <span class="text-gray-400 font-medium">/ user</span>
                    </p>
                    <hr class="mt-4 border-1">
                    <div class="pt-8">
                        <p class="font-semibold text-gray-400 text-left">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                All features in <span class="text-black">Startup</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                Growth <span class="text-black">oriented</span>
                            </span>
                        </p>
                        <p class="font-semibold text-gray-400 text-left pt-5">
                            <span class="material-icons align-middle">
                                done
                            </span>
                            <span class="pl-2">
                                <span class="text-black">Unlimited</span> cloud storage
                            </span>
                        </p>

                        <a href="#" class="">
                            <p class="w-full py-4 bg-blue-600 mt-8 rounded-xl text-white">
                                <span class="font-medium">
                                    Choose Plan
                                </span>
                                <span class="pl-2 material-icons align-middle text-sm">
                                    east
                                </span>
                            </p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>
~~~

- Vamos con el de contacto (que tiene un mapa de fondo y un pequeño formulario). Lo pego dentro del template de ContactPage.vue
- Le añado al section el flex flex-1 h-full para que tome todo el ancho
- https://www.creative-tim.com/twcomponents/component/contact-map

~~~html
<!-- component -->
<section class="text-gray-600 body-font relative flex flex-1 h-full">
  <div class="absolute inset-0 bg-gray-300">
    <iframe width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" title="map" scrolling="no" src="https://maps.google.com/maps?width=100%&height=600&hl=en&q=%C4%B0zmir+(My%20Business%20Name)&ie=UTF8&t=&z=14&iwloc=B&output=embed" style=""></iframe>
  </div>
  <div class="container px-5 py-24 mx-auto flex">
    <div class="lg:w-1/3 md:w-1/2 bg-white rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0 relative z-10 shadow-md">
      <h2 class="text-gray-900 text-lg mb-1 font-medium title-font">Feedback</h2>
      <p class="leading-relaxed mb-5 text-gray-600">Post-ironic portland shabby chic echo park, banjo fashion axe</p>
      <div class="relative mb-4">
        <label for="email" class="leading-7 text-sm text-gray-600">Email</label>
        <input type="email" id="email" name="email" class="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out">
      </div>
      <div class="relative mb-4">
        <label for="message" class="leading-7 text-sm text-gray-600">Message</label>
        <textarea id="message" name="message" class="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"></textarea>
      </div>
      <button class="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">Button</button>
      <p class="text-xs text-gray-500 mt-3">Chicharrones blog helvetica normcore iceland tousled brook viral artisan.</p>
    </div>
  </div>
</section>
~~~

- Después tendremos una sección de mapas
- Podemos copiar un iframe de una ubicación específica desde googlemaps, dándole a compartir
- Lo pego en el src del iframe
- Uso el #f1f1f1 para el color del background de la app en styles.css

~~~css
@import "tailwindcss";

html, body{
    background-color: #f1f1f1;
}
~~~

- Es una manera de cargar un mapa sin código, y se carga de manera perezosa
- Si necesito una página de Login, ¿cómo hago eso? (para que no se vea la aplicación entera, con el navbar, etc)
- O argumentos de url, validadores de ruta...
- 
## Rutas hijas y padres

- Tenemos otro componente de Tailwind para hacer un login. Lo copio en modules/auth/pages/LoginPage.vue dentro de un template
- https://www.creative-tim.com/twcomponents/component/login-page-with-tailwind-css

~~~html
<!-- component -->
<div class="bg-gray-100 flex justify-center items-center h-screen">
    <!-- Left: Image -->
<div class="w-1/2 h-screen hidden lg:block">
  <img src="https://placehold.co/800x/667fff/ffffff.png?text=Your+Image&font=Montserrat" alt="Placeholder Image" class="object-cover w-full h-full">
</div>
<!-- Right: Login Form -->
<div class="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
  <h1 class="text-2xl font-semibold mb-4">Login</h1>
  <form action="#" method="POST">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Username</label>
      <input type="text" id="username" name="username" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Password</label>
      <input type="password" id="password" name="password" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input type="checkbox" id="remember" name="remember" class="text-blue-500">
      <label for="remember" class="text-gray-600 ml-2">Remember Me</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">Forgot Password?</a>
    </div>
    <!-- Login Button -->
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full">Login</button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <a href="#" class="hover:underline">Sign up Here</a>
  </div>
</div>
</div>
~~~

- Con el router tal y como lo tenemos configurado solo tenemos rutas padres
- Se montan directamente en el root de la aplicación
- Tendrían hijas si tuvieran con la propiedad children (en el router)
  - En el home sería útil si tuviera varias tabs
- Un uso muy común es para resolver el problema del Login
- Digamos que la barra de navegación, el header, el footer, lo quiero en todas mis páginas (pero en el login no)
- Creemos en modules/landing/layouts/LandingLayout.vue
- Copio todo lo que tengo en App.vue y lo pego en LandingLayout.vue
- En App.vue solo renderizo el RouterView

~~~vue
<template>
  <RouterView />
</template>

<script setup lang="ts">
</script>
~~~

- Todo lo que quiera que tenga el LandingLayout (todas las páginas menos el Login) deben ser rutas hijas del LandingLayout
- En la propiedad children, dentro del arreglo, pego todas las rutas que tenía
- Fuera del arreglo de children, en otro objeto, coloco la página de login
- router/index.ts

~~~js
import HomePage from '@/modules/landing/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
   {
    path: '/',
    name: 'landing',
    component: ()=>import("@/modules/landing/layouts/LandingLayout.vue"),
    children:[
       {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    },
    {
      path: '/features',
      name: 'features', //opcional
      component: ()=>import('@/modules/landing/pages/FeaturesPage.vue')
    },
    {
      path: '/pricing',
      name: 'pricing', //opcional
      component: ()=>import('@/modules/landing/pages/PricingPage.vue')
    },
    {
      path: '/contact',
      name: 'contact', //opcional
      component: ()=>import('@/modules/landing/pages/ContactPage.vue')
    },
    ]
   },
   {
    path:'/login',
    name: 'login',
    component: ()=> import('@/modules/auth/pages/LoginPage.vue')
   }
  ],
})

export default router
~~~

- De esta manera las páginas Pricing, Features, Contact y Home tienen el header y el footer, y la página Login no 
- **NOTA:** Tenemos que manejar el 404 de una ruta mal especificada!
- Vamos a crear también un RegisterPage dónde el formulario que hay en el Login será el layout y al registerPage le vamos a agregar más cosas

## Auth Layout


- Creo auth/pages/RegisterPage.vue
- Creo un auth/layouts/AuthLayout.vue donde colocaré el html que van a compartir estos dos componentes
- Copio todo lo que hay en el LoginPage (pues es la estructura) y lo pego en el AuthLayout
- Todo lo que hay dentro del div que corresponde al formulario, eso va en el LoginPage.vue
- Lo corto y lo pego en el LoginPage, y no me olvido de colocar el RouterView allí donde va todo el código de LoginPage y RegisterPage
- **No hace falta importar RouterView ni RouterLink porque está de forma global en mi app**

~~~vue
<template>
    <!-- component -->
<div class="bg-gray-100 flex justify-center items-center h-screen">
    <!-- Left: Image -->
<div class="w-1/2 h-screen hidden lg:block">
  <img src="https://placehold.co/800x/667fff/ffffff.png?text=Your+Image&font=Montserrat" alt="Placeholder Image" class="object-cover w-full h-full">
</div>
    <RouterView />
</div>
</template>

<script setup lang="ts">¡
</script>
~~~

- En el Login, dentro de la etiqueta template, pego lo que había en el div donde ahora está el RouterView
- Uso un RouterLink en lugar del anchor tag
- **NOTA:** es mejor usar el v-bind en el to de RouterLink y especificar el nombre, por si los paths cambian tener el nombre para redireccionar

~~~vue
<template>
  <div class="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
  <h1 class="text-2xl font-semibold mb-4">Login</h1>
  <form action="#" method="POST">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Username</label>
      <input type="text" id="username" name="username" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Password</label>
      <input type="password" id="password" name="password" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input type="checkbox" id="remember" name="remember" class="text-blue-500">
      <label for="remember" class="text-gray-600 ml-2">Remember Me</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">Forgot Password?</a>
    </div>
    <!-- Login Button -->
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full">Login</button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
   <RouterLink :to="{name: 'register'}" class="hover:underline">Sign up Here</RouterLink>
  </div>
</div>
</template>
~~~

- Al RegisterPage le agregamos el campo name y cambiamos el botón de Login por el de Register
- También usamos un RouterLink para direccionar a LoginPage

~~~vue
<template>
  <div class="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
  <h1 class="text-2xl font-semibold mb-4">Register</h1>
  <form action="#" method="POST">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Username</label>
      <input type="text" id="username" name="username" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Password</label>
      <input type="password" id="password" name="password" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!--Name Input-->
    <div class="mb-4">
      <label for="name" class="block text-gray-600">Name</label>
      <input type="text" id="name" name="name" class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500" autocomplete="off">
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input type="checkbox" id="remember" name="remember" class="text-blue-500">
      <label for="remember" class="text-gray-600 ml-2">Remember Me</label>
    </div>

    <!-- Register Button -->
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full">Register</button>
  </form>
  <!-- Sign in  Link -->
  <div class="mt-6 text-blue-500 text-center">
   <RouterLink :to="{name: 'login'}" class="hover:underline">Sign in Here</RouterLink>
  </div>
</div>
</template>
~~~

- El router queda así
- Puedo redirigir a login si alguien cae a /auth
- router/index.ts

~~~js
import HomePage from '@/modules/landing/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
   {
    path: '/',
    name: 'landing',
    component: ()=>import("@/modules/landing/layouts/LandingLayout.vue"),
    children:[
       {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    },
    {
      path: '/features',
      name: 'features', //opcional
      component: ()=>import('@/modules/landing/pages/FeaturesPage.vue')
    },
    {
      path: '/pricing',
      name: 'pricing', //opcional
      component: ()=>import('@/modules/landing/pages/PricingPage.vue')
    },
    {
      path: '/contact',
      name: 'contact', //opcional
      component: ()=>import('@/modules/landing/pages/ContactPage.vue')
    },
    ]
   },
  {
    path: '/auth',
    redirect:{name: 'login'}, //que /auth lleve al login
    name: 'authlayout',
    component: ()=>import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
       {
    path:'/login',
    name: 'login',
    component: ()=> import('@/modules/auth/pages/LoginPage.vue')
   },
   {
    path: '/register',
    name: 'register',
    component: ()=>import('@/modules/auth/pages/RegisterPage.vue')
   }
    ]
  }
  ],
})

export default router
~~~

- Si quieres que auth sea parte de la ruta **hay que uqitarle el / a login y register en el router**

~~~js
  {
    path: '/auth',
    redirect:{name: 'login'}, //que /auth lleve al login
    name: 'authlayout',
    component: ()=>import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
       {
    path:'login',
    name: 'login',
    component: ()=> import('@/modules/auth/pages/LoginPage.vue')
   },
   {
    path: 'register',
    name: 'register',
    component: ()=>import('@/modules/auth/pages/RegisterPage.vue')
   }
    ]
  }
~~~

- Ahora apunta a auth/login y auth/register. Lo bueno de tener los links a través del v-bind con el nombre es que aunque haya cambios, los links permanecen funcionales
- Si alguien pone una ruta que no existe en mi app, la app no está devolviendo un 404. Vamos a cambiar eso

## Página 404 

- Cuando se introduce en la url una ruta que no existe podemos redireccionar a una ruta que ya existe o crear una página de 404
- Se usa pathMatch para indicar cualquier path que no exista
- Puedo usar redirect, pero usaremos una 404
- router/index.ts

~~~js
import HomePage from '@/modules/landing/pages/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
   {
    path: '/',
    name: 'landing',
    component: ()=>import("@/modules/landing/layouts/LandingLayout.vue"),
    children:[
       {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    },
    {
      path: '/features',
      name: 'features', //opcional
      component: ()=>import('@/modules/landing/pages/FeaturesPage.vue')
    },
    {
      path: '/pricing',
      name: 'pricing', //opcional
      component: ()=>import('@/modules/landing/pages/PricingPage.vue')
    },
    {
      path: '/contact',
      name: 'contact', //opcional
      component: ()=>import('@/modules/landing/pages/ContactPage.vue')
    },
    ]
   },
  {
    path: '/auth',
    redirect:{name: 'login'}, //que /auth lleve al login
    name: 'authlayout',
    component: ()=>import('@/modules/auth/layouts/AuthLayout.vue'),
    children:[
       {
    path:'/login',
    name: 'login',
    component: ()=> import('@/modules/auth/pages/LoginPage.vue')
   },
   {
    path: '/register',
    name: 'register',
    component: ()=>import('@/modules/auth/pages/RegisterPage.vue')
   }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    //redirect: '/',
    name: 'notFound',
    component: ()=>import('@/modules/common/pages/404Page.vue')
  }
  ],
})

export default router
~~~

- El componente para modules/common/pages/404Page.vue lo he sacado de https://www.creative-tim.com/twcomponents/component/404-error-page

~~~vue
<template>
    <!-- component -->
<!-- This is an example component -->
<div class="h-screen w-screen bg-gray-50 flex items-center">
    <div class="container flex flex-col md:flex-row items-center justify-between px-5 text-gray-700">
            <div class="w-full lg:w-1/2 mx-8">
                <div class="text-7xl text-green-500 font-dark font-extrabold mb-8"> 404</div>
            <p class="text-2xl md:text-3xl font-light leading-normal mb-8">
                Sorry we couldn't find the page you're looking for
            </p>
            
            <RouterLink :to="{name: 'home'}" class="px-5 inline py-3 text-sm font-medium leading-5 shadow-2xl text-white transition-all duration-400 border border-transparent rounded-lg focus:outline-none bg-green-600 active:bg-red-600 hover:bg-red-700">back to homepage</RouterLink>
    </div>
        <div class="w-full lg:flex lg:justify-end lg:w-1/2 mx-5 my-12">
        <img src="https://user-images.githubusercontent.com/43953425/166269493-acd08ccb-4df3-4474-95c7-ad1034d3c070.svg" class="" alt="Page not found">
        </div>
    
    </div>
</div>
</template>
~~~

- Si quiero manetener el footer y el menú de navegación, puedo hacer que este 404Page sea una ruta hija del landing
- **NOTA**: Si el componente a copiar está dentro de un body, copiar lo que hay dentro (sin la etiqueta body). Si es un div, meter dentro de un template y ya está
- Tenemos que ver como proteger rutas
- Añado el Login como submenú en el LandingLayout.vue
- Para ello meto los RouterLink que tenía en un div y en otro div el login
- El menú quedará en el extremo izquierd y el Login en el extremo derecho

~~~js
<nav class="flex items-center space-x-4 w-full justify-between">
<!-- Contenedor de los enlaces principales a la izquierda -->
    <div class="flex space-x-4">
  <RouterLink :to="{name: 'home'}"> Home </RouterLink>
  <RouterLink :to="{name: 'features'}"> Features </RouterLink>
  <RouterLink :to="{name: 'pricing'}"> Pricing </RouterLink>
  <RouterLink :to="{name: 'contact'}"> Contact </RouterLink>
  </div>
<!-- Contenedor para Login, a la derecha -->
  <div class="flex flex-col items-center mt-2">
  <RouterLink :to="{name: 'login'}"> Login </RouterLink>
  </div>
</nav>
~~~


## Argumentos por URL

- Creamos modules/pokemons/pages/PokemonPage.vue
- Para la imagen uso POSTMAN y hago un llamado a la PokeAPi en sprites/other/dream_world/front_default

~~~vue
<template>
    <section class="flex flex-col items-center justify-center">
        <h1>Pokemón <small class="text-blue-500">100</small></h1>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/1.svg" 
        alt=""
        class="w-[200px] h-[200px] mt-5"
        >
    </section>
</template>
~~~

- Será una hija del Landing
- router/index.ts

~~~js
//routes
{
    path: '/',
    name: 'landing',
    component: ()=>import("@/modules/landing/layouts/LandingLayout.vue"),
    children:[
       {
      path: '/',
      name: 'home', //opcional
      component: HomePage
    },
    {
      path: '/features',
      name: 'features', //opcional
      component: ()=>import('@/modules/landing/pages/FeaturesPage.vue')
    },
    {
      path: '/pricing',
      name: 'pricing', //opcional
      component: ()=>import('@/modules/landing/pages/PricingPage.vue')
    },
    {
      path: '/contact',
      name: 'contact', //opcional
      component: ()=>import('@/modules/landing/pages/ContactPage.vue')
    },
    {
      path: '/pokemon/:id',
      name: 'pokemons',
      component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
    }
    ]
   },

{...code}
~~~

- Agrego Pokemons al lado de Login en el nav LandingLayout
- Le pongo un 1 de id en duro
- Pongo un elemento al lado del otro con flex (sin flex-col), les pongo una separación con space-x-4
- LandingLayout.vue

~~~js
<nav class="flex items-center space-x-4 w-full justify-between">
  <div class="flex space-x-4">
  <RouterLink :to="{name: 'home'}"> Home </RouterLink>
  <RouterLink :to="{name: 'features'}"> Features </RouterLink>
  <RouterLink :to="{name: 'pricing'}"> Pricing </RouterLink>
  <RouterLink :to="{name: 'contact'}"> Contact </RouterLink>
  </div>

  <div class="flex space-x-4 items-center mt-2">
  <RouterLink to="pokemon/1"> Pokemon </RouterLink>
  <RouterLink :to="{name: 'login'}"> Login </RouterLink>
  </div>
</nav>
~~~

- Hay varios lugares dónde voy a necesitar el id del pokemon 
- ¿Cómo recibo esa property en PokemonPage que va a venir por el URL?
- Uso defineProps y el v-bind en el src de image, encierro entre back tics (dentro de las comilals) el string de la imagen y le coloco la prop
- Renderizo también el id en el small del h1

~~~vue
<template>
    <section class="flex flex-col items-center justify-center">
        <h1>Pokemón <small class="text-blue-500 text-lg">#{{ id }}</small></h1>
        <img 
        :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`" 
        alt=""
        class="w-[200px] h-[200px] mt-5"
        >
    </section>
</template>

<script setup lang="ts">
   interface Props{
    id: string //por el URL siempre recibimos strings
   }
   
   defineProps<Props>() 
</script>
~~~

- Nos da error de "missing required prop"
- En el vue-router necesitamos poner una property que diga que necesitamos que lo convierta
- Se pueden hacer varias cosas, empecemos por poner props en true

~~~js
{
  path: '/pokemon/:id',
  name: 'pokemon',
  props: true,
  component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
}
~~~

- Pongamos que quiero que el id sea un número para hacer cálculos con él
- Si quisiera crear un botón/link para el siguiente pokemon, bien podría usar en el to la ruta entre backticks (dentro de las comillas) tipo pokemon/{id}, pero **también pudo usar el nombre y pasarle el ide en el objeto params** así
- Recuerda que siempre que no sea pasarle solo un string usamos v-bind

~~~js
<RouterLink 
    :to="{name: 'pokemon', params: {id: id+1}}"
    class="bg-blue-500 text-white p-2 rounded mt-5 text-center"
>
    Siguiente
</RouterLink>
~~~

- Debo cambiar la interface de las props en PokemonPage.vue

~~~vue
<script setup lang="ts">
   interface Props{
    id: number
   }
   
   defineProps<Props>() 
</script>
~~~

- Falta cambiar el string sacado de la url a número!

## Procesar argumentos por URL

- En la ruta tenemos varios ciclos de vida, por ejemplo el **beforeEnter**
- Si a la propiedad props le añado una función de flecha donde voy a tener la route, si miro el tipo con el cursro encima me dice que es de tipo RouteLocationNormalizedGeneric
- Hago un console.log de ese route

~~~js
{
  path: '/pokemon/:id',
  name: 'pokemon',
  props: (route)=>{
    console.log(route)
  },
  component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
}
~~~

- En consola veo un objeto como este

~~~
fullPath: "/pokemon/1"
hash: ""
href: "/pokemon/1"
matched: (2) [{…}, {…}] //rutas en las que hace match
meta: {}
name: "pokemon"
params: {id: '1'}
path: "/pokemon/1"
query: {}
redirectedFrom: undefined
[[Prototype]]: Object
~~~

- Lo que yo retorne en esta función es la prop que retorna

~~~js
{
  path: '/pokemon/:id',
  name: 'pokemon',
  props: (route)=>{
    return {
      id:100 //retorna id 100
    }
  },
  component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
}
~~~

- Aquí es donde puedo extraer el id, hacer una validación de que lo que venga sea un número y retornar el id como número
- Si no es un número devuelvo 1, si no devuelvo el id (que he parseado con un + en route.params.id)

~~~js
{
  path: '/pokemon/:id',
  name: 'pokemon',
  props: (route)=>{
    const id = +route.params.id!
    
    return isNaN(id) ? {id: 1}: {id}
  },
  component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
}
~~~

## useRouterComposable

- Hay ocasiones en las que voya a querer navegar pero no con un botón/anchor tag/RouterLink, sino basado en alguna acción de JS
- modules/auth/pages/LoginPage.vue
- Aquí tenemos un botón que hace el submit de Login de type submit
- Lo cambio a type button porque no quiero trabajar con la propagación del formulario, quiero que sea un botón normal y corriente
- Le paso la función onLogin (que creo en el script setup del componente) en el @click

~~~vue
<button 
  type="button" 
  class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
  @click="onLogin"
>
  Login
</button>
~~~

- En el script setup del componente añado la navegación
- Tenemos el **useRoute** para poder obtener info sobre la ruta
- Y tenemos **useRouter** que nos permite obtener el objeto del router
- Con router. tengo varios métodos, el push es para cuando quiero que se cree un historial
- A replace le paso a que ruta quiero navegar
- LoginPage.vue

~~~vue
<script setup lang="ts">
import { useRouter } from 'vue-router';

  const router = useRouter()

  const onLogin=()=>{
    router.replace({name:'home'})
  }
</script>
~~~

- Vamos a almacenar un valor booleano ficticio en el localStorage
- Cuando le dé al botón de Login almacenará eel userId fake en el localStorage

~~~vue
<script setup lang="ts">
import { useRouter } from 'vue-router';

  const router = useRouter()

  const onLogin=()=>{
    localStorage.setItem('userId', 'ABC-123')
    router.replace({name:'home'})
  }
</script>
~~~

- Para verlo ir a la pestaña de Aplicación de la consola en el navegador, Almacenamiento local
- Se puede almacenar cualquier info siempre y cuando sean strings
- Si se quieren guardar onjetos hay que serializarlos con JSON.stringify
- Vamos a ver cómo solo puedo ver esta pantalla de pokemons si estoy autenticado
- Si no estoy autenticado no debería poder ni entrar en la pantalla de pokemons
- Para borrar la data en el LocalStorage seleccionar y pulsar delete
- En el LocalStorage la data es persistente, en la SessionStorage solo se mantendrá mientras la sesión del navegador esté abierta

## Proteger rutas

- Los protectores de rutas, o **Guards**, se pueden colocar en varios lugares
- Se pueden tener tantos como se necesiten
- Todos se vana air ejecutando uno después del otro. Hasta que todos se cumplen, entonces llegamos a la ruta en particular
- Como va a ser un Guard estrechamente relacionado con auth, lo coloco en auth//guards/is-authenticated.guard.ts
- El guard recibe el to(a dónde voy), el from(de dónde vengo), y el next(la función que voy a llamar para navegar a la persona)
- Para tipar estos argumentos, si voy al router, la propiedad beforEnter tiene un array que va a esperar los guards
- Aquí puedo crear una función de flecha con el to, el from y el next, y de aquí puedo sacar el tipado ya que ya viene implícito, solo tengo que colocar el cursor encima de cada argumento

~~~js
{
      path: '/pokemon/:id',
      name: 'pokemon',
      beforeEnter:[
        (to, from, next)=>{ //tipado implícito
          
          console.log(to,from,next)
          return next()
        }
      ],
      props: (route)=>{
        const id = +route.params.id!
        
        return isNaN(id) ? {id: 1}: {id}
      },
      component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
    }
~~~

- Ahora puedo tipar los argumentos

~~~js
import type { NavigationGuardNext, RouteLocationNormalizedGeneric, RouteLocationNormalizedLoadedGeneric } from "vue-router"


const isAuthenticatedGuard = (
    to:RouteLocationNormalizedGeneric,
    from:RouteLocationNormalizedLoadedGeneric,
    next:  NavigationGuardNext)=>{

    
    return next()
}

export default isAuthenticatedGuard
~~~

- Ahora puedo obtener el userId del LocalStorage
- Si no hay userId lo voy a mandar al login

~~~js
import type { NavigationGuardNext, RouteLocationNormalizedGeneric, RouteLocationNormalizedLoadedGeneric } from "vue-router"


const isAuthenticatedGuard = (
    to:RouteLocationNormalizedGeneric,
    from:RouteLocationNormalizedLoadedGeneric,
    next:  NavigationGuardNext)=>{

    const userId = localStorage.getItem('userId')

    if(!userId){
        return next({
            name: 'login'
        })
    }
    
    return next()
}

export default isAuthenticatedGuard
~~~

- Si intento navegar a la pantalla de pokemons y no tengo el userId en el localStorage me manda directamente a la pantalla de Login
- Si no está autenticado podemos determinar la ruta en la que nos encontramos (pongamos que estoy en la página pokemon)
- En el to, tenemos el path (to.path)
- Esta es la ruta a la que quería navegar. Puedo grabarlo en el LocalStorage
- Siempre se va a guardar la última ruta en la que estuvo (pokemon/1, luego pokemon/2 si le da al botón de siguiente,etc)

~~~js
import type { NavigationGuardNext, RouteLocationNormalizedGeneric, RouteLocationNormalizedLoadedGeneric } from "vue-router"


const isAuthenticatedGuard = (
    to:RouteLocationNormalizedGeneric,
    from:RouteLocationNormalizedLoadedGeneric,
    next:  NavigationGuardNext)=>{

    const userId = localStorage.getItem('userId')
    localStorage.setItem('lastPath', to.path)
    
    if(!userId){
        return next({
            name: 'login'
        })
    }
    return next()
}

export default isAuthenticatedGuard
~~~

- Si la persona no está autenticada, saco a la persona de ahí (la mando al login), pero sé a qué página iba la persona, la tengo en el localStorage, para que cuando se autentique, la lleve ahí
- En el LoginPage, en lugar de mandarlo al home con el onLogin (la función del botón de Login), vamos a usar la página del localStorage
- Si el valor es nulo lo mandamos al home

~~~vue
<script setup lang="ts">
import { useRouter } from 'vue-router';

  const router = useRouter()

  const onLogin=()=>{
    localStorage.setItem('userId', 'ABC-123')
    const lastPath= localStorage.getItem('lastPath') ?? '/'
    router.replace(lastPath)
  }
</script>
~~~

- Para que se guarde en el localStorage el lastPath (la página donde stoy de pokemon) debo recargar el navegador estando en la página
- Recuerda que tenemos el guard en el beforeEnter del router
- router/index.ts

~~~js
{
  path: '/pokemon/:id',
  name: 'pokemon',
  beforeEnter:[isAuthenticatedGuard],
  props: (route)=>{
    const id = +route.params.id!
    
    return isNaN(id) ? {id: 1}: {id}
  },
  component: ()=> import('@/modules/pokemons/pages/PokemonPage.vue')
}
~~~

- Ahora si borro el userId del localStorage y vuelvo a hacer login, me lleva a la página dónde estaba (pokemon/10, pokemon/11, la que sea)
- Si no hay una página guardada en lastPath en el localStorage me lleva al home cuando hago Login
- En la vida real vamos a usar el is-authenticated.guard para verificar un jsonwebtoken, o el estado de autenticación, puede ser async (para cuando tengamos un backend con el que autenticarme)
- Lo importante de esta lección es que hemos visto **cómo proteger la ruta** (el backend tendría otra capa)

## Ciclo de vida de los componentes

- Vamos a HomePage.vue
- El ciclo de vida no son más que una serie de funciones que se disparan automáticamente en un cierto punto del tiempo
- En la documentación de Vue veremos los Lifecycle Hooks del Composition API
- Es similar a React: onMounted, onUpdated, onUnmounted, onBeforeMount, onBeforeUpdate,onBeforeUnmount, onErrorCaptured, onRenderTracked, onRenderTriggered, onActivated, onDeactivated, onServerPrefetch (este último es para Server-Side) 
- Se pueden usar directamente en el script setup

~~~vue
<template>
    <div class="text-center">
    <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
        Bienvenido a nuestro sitio web
    </h1>
    <p class="mx-auto max-w-[600px] text-gray-500 md:text-xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </p>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(()=>{
    console.log('onMounted')
})
</script>
~~~

- Vamos a usarlos todos
- Cuando tenemos más de diez líneas en el script setup es recomendable usar un archivo independiente
- En modules/landing/pages/HomePage.ts
- La función setup también es una parte del ciclo de vida de lso componentes, ya que se ejecuta antes de que se monte

~~~js
import { defineComponent, onMounted } from "vue";

export default defineComponent({
    setup: ()=>{
      
        onMounted(()=>{
            console.log("onMounted")
        })

        console.log('setup') //el setup aparece primero porque setup se ejecuta antes que todo

    }
})
~~~ 

- Debo hacer referencia en el script del HomePage al archivo HomePage.ts y quitar el setup

~~~vue
<template>
    <div class="text-center">
    <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
        Bienvenido a nuestro sitio web
    </h1>
    <p class="mx-auto max-w-[600px] text-gray-500 md:text-xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </p>
    </div>
</template>

<script lang="ts" src="./HomePage">
</script>
~~~

- Llamemos a todos los métodos

~~~js
import { 
    defineComponent, 
    onActivated, 
    onBeforeMount, 
    onBeforeUnmount, 
    onBeforeUpdate, 
    onDeactivated, 
    onErrorCaptured, 
    onMounted, 
    onRenderTracked, 
    onRenderTriggered, 
    onUnmounted, 
    onUpdated,
    ref } from "vue";

export default defineComponent({
    setup: ()=>{
      //defino propiedad reactiva para el siguiente ejercicio
      const count = ref(0)

        onMounted(()=>{ console.log("onMounted")})
        onUpdated(()=>{console.log("onUpdated")}) 
        onUnmounted(()=>{console.log("onUnmounted")}) 
        onBeforeMount(()=>{console.log("onBeforeMount")}) 
        onBeforeUpdate(()=>{console.log("onBeforeUpdate")})
        onBeforeUnmount(()=>{console.log("onBeforeUnmount")}) 
        onErrorCaptured(()=>{console.log("onErrorCaptured")}) 
        onRenderTracked(()=>{console.log("onrenderTracked")}) 
        onRenderTriggered(()=>{console.log("onRenderTriggered")}) 
        onActivated(()=>{console.log("onActivated")}) 
        onDeactivated(()=>{console.log("onDeactivated")})
        console.log('setup')
      
      return{
        count
      }
    }
})
~~~

- En consola aparece el setup, el onBeforeMount y el onMounted
- Si me voy a otra pantalla dispara el onBeforeUnmount y el onUnmounted
  - Esto es útil para limpiar subscripciones, websockets, etc

## keep Alive - Activar y desactivar

- Renderizo el count en el template del Home
- Añado un botón de incremento

~~~vue
<template>
    <div class="text-center">
    <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
        Bienvenido a nuestro sitio web
    </h1>
    <p>Counter: {{ count }} </p>
    <button @click="count++">Increment</button>
    </div>
</template>

<script lang="ts" src="./HomePage">
</script>
~~~

- Ahora aparece en consola (en este orden) el setup, onBeforeMount, onRenderTracked, onMounted
  - onrenderTracked es cuando hay alguna dependencia que se acaba de colocar y nos permite poderlo seguir (solo en modo desarrollo)
- Cuando le doy al botón de Increment se dispara onRenderTriggered, onBeforeUpdate, onRenderTracked, onUpdate
  - onRenderTrigged nos indica cuando empieza a realizar el proceso, cuando hay que empezar a hacer la renderización de un nuevo cambio (solo en dev)
  - Luego se detcta el cambio antes de que se haga (onBeforeUpdate) 
  - Se dispara otro onRenderTracked y luego en onUpdated que se dispara después de que se actualiza
- Si salgo del Home tengo el onBeforeUnmount y el onUnmounted
- Si regreso al Home el counter vuelve a cero y se disparan los que se dispararon inicialmente (setup, onBeforeMount, onrenderTracked, onMounted)
- Si quiero manetener el valor de 3 **puedo usar un gestor de estado**
- Pongamos que no quiero usar uno usar un gestor de estado (o no puedo porque es de un acordeón, o unas tabs) 
- Hay un componente en el vue-router que es el **KeepAlive** (que se puede mezclar con el Transition para hacer transiciones)
- Se usa para mantener con vida al componente, usando el componente keep-alive
- Lo uso en el router-view del LandingLayout

~~~js
<main class="flex-1 flex items-center justify-center">
  <RouterView v-slot="{Component}">
    <keep-alive>
    <component :is="Component" />
    </keep-alive>
  </RouterView>
</main>
~~~

- Ahora en consola pareció también el onActivated 
- Si incremento el contador, me voy a otra página y vuelvo al Home, el valor del contador se mantuvo
- Si estoy en el Home, el active está en el Home, si estoy en Features, el active está en Features
- Si recargo el navegador pierdo el valor del counter
- Cuando me muevo a otra ruta (dentro del keep-alive) no voy a llamar al onMounted, porque lo que estamos haciendo es desactivarlo, por lo que se llama al onDeactivated

## Router Link Active

- Estaría bien remarcar dónde está el usuario en el menú de navegación
- Es sencillo. Puedo inspeccionar el elemento en consola dando click al primer icono de la esquina superior izquierda (que es de una flechita en una pantalla de linea discontinua) y después sobre el elemento en cuestión
- Cuando estoy en una ruta, vue-router va a poner en la clase del RouterLink donde estoy el router-link-active y el router-link-exact-active
  - El router-link-active menciona que estamos en esa ruta, el router-link-exact-active dice que estamos exactamente en el path que coincide con lo que en el elemento inspeccionado es el href del anchor tag ('/features', por ejemplo)
  - Empieza con el /. La ruta del Home también empieza con el /, por lo que también tiene la clase router-link-active, ya que esas dos rutas podrían coincidir con el path en el cual nos encontramos ('/features')
- Podemos usar estas clases para colorear el elemento
- Uso active-class, pero en el Home no lo coloco por lo que hemos comentado, si no siempre se marcaría el Home (al tener /) y donde sea que esté (Features, Pricing)
- Landinglayout.vue

~~~js
<div class="flex space-x-4">
  <RouterLink :to="{name: 'home'}"> Home </RouterLink>
  <RouterLink 
  active-class="underline font-semibold"
  :to="{name: 'features'}"> Features </RouterLink>
  <RouterLink :to="{name: 'pricing'}"
  active-class="underline font-semibold"
  > Pricing </RouterLink>
  <RouterLink :to="{name: 'contact'}"
  active-class="underline font-semibold"
  > Contact </RouterLink>
</div>
~~~

- Para evitar este error usaremos exact-active-class
- Puedo dejar el nav como estaba
- Pero en lugar de hacerlo a nivel de componente (que no está mal) puedo definirme una clase en styles.css que apunte a .router-link-exact-active
- styles.css

~~~css
@import "tailwindcss";

html, body{
    background-color: #f1f1f1;
}

.router-link-exact-active{
    @apply font-semibold transition-all text-green-500
}
~~~ 

- Ha habido una cosa que ha quedado pendiente, que si yo clico dos veces en el menú a pokemon, como tengo en duro el pokemon/1, me añade al url otro pokemon/1 por lo que me lleva a la página de 404
- Una manera de solucionarlo sería con un v-if

~~~vue
<RouterLink :to="{ name: 'pokemon', params: { id: 1 } }"
> Pokemon 
</RouterLink>
~~~


## La variable global $route en Vue


¡Claro! Aquí tienes una lista completa de las propiedades de **`$route`** en Vue.js, con una breve descripción de cada una:

### Propiedades de `$route`

1. **`$route.path`**:

   * **Descripción**: La **ruta actual** (el valor completo del `path` en la URL, por ejemplo, `/pokemon/1`).

2. **`$route.name`**:

   * **Descripción**: El **nombre de la ruta** definido en Vue Router. Es útil para referirse a rutas por su nombre en lugar de la ruta completa.

3. **`$route.params`**:

   * **Descripción**: Un objeto que contiene los **parámetros dinámicos** de la ruta. Estos son los valores definidos en la URL con `:param` (por ejemplo, `/pokemon/:id`).

4. **`$route.query`**:

   * **Descripción**: Un objeto que contiene los **parámetros de consulta** de la URL (lo que sigue al `?` en la URL, como `/search?query=vue`).

5. **`$route.hash`**:

   * **Descripción**: El **fragmento de la URL** después del `#` (por ejemplo, en `/about#section`, la propiedad `hash` será `#section`).

6. **`$route.fullPath`**:

   * **Descripción**: La **ruta completa** incluyendo la **cadena de consulta** y el **hash**. Esto es, por ejemplo, `/pokemon/1?search=true#info`.

7. **`$route.matched`**:

   * **Descripción**: Un **array de rutas coincidentes** con la ruta actual. Es útil para obtener información sobre las rutas anidadas y los componentes coincidentes.

8. **`$route.redirectedFrom`**:

   * **Descripción**: La **ruta de la cual** la navegación fue **redirigida** (si la ruta actual fue el resultado de una redirección). Si no hubo redirección, será `null`.

9. **`$route.meta`**:

   * **Descripción**: Un objeto que contiene los **metadatos** definidos para la ruta en la configuración del enrutador. Este valor lo puedes personalizar para agregar información adicional a la ruta (como permisos, roles, etc.).

10. **`$route.hash`**:

    * **Descripción**: Parte de la URL después del `#` que puede ser utilizada para manejar fragmentos dentro de la página.

### Resumen:

* **`$route.path`**: La ruta completa sin parámetros dinámicos.
* **`$route.name`**: El nombre de la ruta.
* **`$route.params`**: Parámetros dinámicos en la ruta.
* **`$route.query`**: Parámetros de consulta de la URL.
* **`$route.hash`**: Fragmento de la URL después del `#`.
* **`$route.fullPath`**: La ruta completa con parámetros de consulta y hash.
* **`$route.matched`**: Rutas coincidentes en la navegación.
* **`$route.redirectedFrom`**: La ruta original si fue redirigida.
* **`$route.meta`**: Metadatos asociados con la ruta (personalizable).

- Estas propiedades proporcionan acceso a diferentes partes de la URL y la ruta actual, lo que te permite hacer una navegación dinámica y gestionar parámetros en tu aplicación Vue.


## Otras variables globales en Vue

Claro, aquí tienes un listado de las variables globales disponibles en **Vue.js** y **Vue Router**, con una breve explicación de cada una:

### Variables globales en Vue

1. **`$el`**:

   * **Descripción**: Hace referencia al **elemento DOM** en el que está montado el componente.
   * **Ejemplo**: `this.$el` te da acceso al elemento DOM que contiene tu componente.

   ```javascript
   mounted() {
     console.log(this.$el); // <div>...</div>
   }
   ```

2. **`$data`**:

   * **Descripción**: Es un objeto que contiene los datos reactivos del componente. Es equivalente a la propiedad `data` del componente.
   * **Ejemplo**: `this.$data` devuelve todos los datos del componente.

   ```javascript
   mounted() {
     console.log(this.$data); // { count: 0 }
   }
   ```

3. **`$props`**:

   * **Descripción**: Es un objeto que contiene todas las propiedades (`props`) pasadas al componente.
   * **Ejemplo**: `this.$props` contiene los props que el componente ha recibido desde su componente padre.

   ```javascript
   mounted() {
     console.log(this.$props); // { title: 'Hello' }
   }
   ```

4. **`$route`** (disponible solo con Vue Router):

   * **Descripción**: Proporciona información sobre la ruta actual, como el `path`, los `params`, el `query`, etc. Es útil para obtener información sobre la URL y los parámetros de la ruta.
   * **Ejemplo**:

   ```javascript
   mounted() {
     console.log(this.$route.path);  // '/home'
     console.log(this.$route.params);  // { id: 1 }
   }
   ```

5. **`$router`** (disponible solo con Vue Router):

   * **Descripción**: Es el objeto del enrutador de Vue Router. Permite realizar operaciones de navegación, como redirigir a otras rutas.
   * **Ejemplo**:

   ```javascript
   methods: {
     navigateToHome() {
       this.$router.push({ name: 'home' });
     }
   }
   ```

6. **`$store`** (disponible solo si usas Vuex):

   * **Descripción**: Es el objeto que representa el estado global de la aplicación cuando estás usando Vuex. Permite acceder y modificar el estado global.
   * **Ejemplo**:

   ```javascript
   mounted() {
     console.log(this.$store.state); // Accede al estado global
   }
   ```

7. **`$refs`**:

   * **Descripción**: Es un objeto que contiene todas las referencias a los elementos DOM o componentes hijos que han sido asignados con `ref` en la plantilla.
   * **Ejemplo**:

   ```html
   <template>
     <div>
       <button ref="myButton">Click me</button>
     </div>
   </template>

   <script>
   export default {
     mounted() {
       this.$refs.myButton.click();  // Hace clic en el botón
     }
   }
   </script>
   ```

8. **`$nextTick`**:

   * **Descripción**: Permite ejecutar una función después de que Vue haya actualizado el DOM. Es útil cuando necesitas hacer algo justo después de un cambio en el DOM.
   * **Ejemplo**:

   ```javascript
   this.$nextTick(() => {
     console.log('DOM actualizado');
   });
   ```

9. **`$root`**:

   * **Descripción**: Hace referencia al **componente raíz** de la aplicación. Puede usarse para acceder a propiedades o métodos del componente principal desde cualquier lugar de la aplicación.
   * **Ejemplo**:

   ```javascript
   mounted() {
     console.log(this.$root); // Accede al componente raíz
   }
   ```

10. **`$parent`**:

    * **Descripción**: Hace referencia al **componente padre** de un componente hijo. Es útil si necesitas acceder a datos o métodos del componente que te contiene.
    * **Ejemplo**:

    ```javascript
    mounted() {
      console.log(this.$parent); // Accede al componente padre
    }
    ```

11. **`$children`**:

    * **Descripción**: Es un array de los componentes hijos directos de un componente. Te permite acceder a los componentes hijos de manera programática.
    * **Ejemplo**:

    ```javascript
    mounted() {
      console.log(this.$children); // Accede a los componentes hijos
    }
    ```

12. **`$emit`**:

    * **Descripción**: Permite **enviar eventos** desde un componente hijo hacia su componente padre. Este método es utilizado para comunicar eventos personalizados hacia el componente padre.
    * **Ejemplo**:

    ```javascript
    this.$emit('customEvent', data);
    ```

13. **`$destroy`**:

    * **Descripción**: Elimina el componente actual, es decir, destruye el ciclo de vida de un componente. Es más comúnmente utilizado cuando se maneja la destrucción manual de un componente.
    * **Ejemplo**:

    ```javascript
    this.$destroy();
    ```

14. **`$isServer`**:

    * **Descripción**: Es una propiedad que indica si el código se está ejecutando en el **lado del servidor** (cuando se usa **SSR** o **Server-Side Rendering**) o no.
    * **Ejemplo**:

    ```javascript
    if (this.$isServer) {
      console.log('Estamos en el servidor');
    } else {
      console.log('Estamos en el cliente');
    }
    ```

15. **`$set`** (disponible en Vue 2.x, en Vue 3 se usa `reactive`):

    * **Descripción**: Permite establecer una propiedad reactiva en un objeto que previamente no existía. En Vue 2, esto era necesario para hacer que las propiedades reactivas se "agregaran" dinámicamente a los objetos.
    * **Ejemplo**:

    ```javascript
    this.$set(this.someObject, 'newProp', value);
    ```

16. **`$delete`** (disponible en Vue 2.x, en Vue 3 se usa `reactive`):

    * **Descripción**: Permite eliminar propiedades reactivas de un objeto.
    * **Ejemplo**:

    ```javascript
    this.$delete(this.someObject, 'propertyToRemove');
    ```

---

### Variables adicionales cuando usas **Vue Router**:

1. **`$route.params`**:

   * **Descripción**: Proporciona los parámetros de la ruta actual. Se utiliza principalmente con rutas dinámicas, como `/pokemon/:id`.

   ```javascript
   console.log(this.$route.params.id); // Ejemplo: 1
   ```

2. **`$route.query`**:

   * **Descripción**: Proporciona los parámetros de consulta de la URL (todo lo que viene después del `?`, por ejemplo, `/search?query=vue`).

   ```javascript
   console.log(this.$route.query.query); // Ejemplo: 'vue'
   ```

3. **`$route.hash`**:

   * **Descripción**: Contiene la parte del **fragmento** de la URL, es decir, todo lo que sigue al `#` en una URL.

   ```javascript
   console.log(this.$route.hash); // Ejemplo: '#about'
   ```

---

### Resumen

Aquí tienes una lista de las variables globales más comunes en Vue:

* **`$route`**: Información sobre la ruta actual.
* **`$router`**: Permite interactuar con el enrutador, como redirigir a otras rutas.
* **`$store`**: El estado global de la aplicación usando Vuex.
* **`$refs`**: Acceso a los elementos DOM o componentes hijos referenciados con `ref`.
* **`$nextTick`**: Permite ejecutar una función después de que Vue actualice el DOM.
* **`$el`**, **`$data`**, **`$props`**: Proporcionan acceso al elemento DOM, datos reactivos y propiedades del componente, respectivamente.
* **`$root`**, **`$parent`**, **`$children`**: Para navegar entre componentes y acceder a componentes relacionados.

Estas variables globales te permiten interactuar con diferentes partes de tu aplicación Vue, desde el enrutamiento hasta el estado global y el DOM.
