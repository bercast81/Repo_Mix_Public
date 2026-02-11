# 14 Vue Herrera - Formularios y Mantenimiento de Productos

- Nos vamos a centrar en los formularios
- Haremos que nuestor customInput reciba un v-model
- Usaremos VeeValidate junto a un validador de esquemas llamado Yup
- En este módulo todavía no vamos a mandar la data pero si la vamos a preparar para enviarla a nuestro backend
- Crearemos un dashboard administrativo con un menú lateral
- En el top bar mostraremos el nombre del usuario
- Mostraremos el listado de productos. Si clico encima del nombre voy al formulario
    - Al entrar tengo la información del producto existente en los inputs lista para ser editada
    - Tengo el título, el slug, la descripción, el precio, las tallas, inventario, para subir la imagen, vista previa de las imágenes, el género

## Continuación

- En este enlace tengo un panel administrativo

> https://www.creative-tim.com/twcomponents/component/admin

- Lo pego en AdminLayout.vue. La vista la guardo en un componente aparte (DashboardView), es el último div que representa los productos
- Si el componente viniera en un body **hay que quitarlo**
- Le hago algunos retoques
- AdminLayout.vue

~~~vue
<template>
<div class="flex w-screen h-screen text-gray-700">
            <div class="flex flex-col items-center w-16 pb-4 overflow-auto border-r border-gray-300">
                <a class="flex items-center justify-center flex-shrink-0 w-full h-16 bg-gray-300" href="#">
                    <svg class="w-8 h-8"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 mt-auto rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </a>
            </div>
            <div class="flex flex-col w-56 border-r border-gray-300">
                <button class="relative text-sm focus:outline-none group">
                    <div class="flex items-center justify-between w-full h-16 px-4 border-b border-gray-300 hover:bg-gray-300">
                        <span class="font-medium">
                            Dropdown
                        </span> 
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="absolute z-10 flex-col items-start hidden w-full pb-1 bg-white shadow-lg group-focus:flex">
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                    </div>
                </button>
                <div class="flex flex-col flex-grow p-4 overflow-auto">
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 1</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 2</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 3</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 4</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 5</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Item 6</span>
                    </a>
                    <a class="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-200 rounded hover:bg-gray-300"
                        href="#">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span class="ml-2 leading-none">New Item</span>
                    </a>
                </div>

            </div>
            <div class="flex flex-col flex-grow w-full">
                <div class="flex items-center flex-shrink-0 h-16 px-8 border-b border-gray-300 justify-between">
                    <h1 class="text-lg font-medium">Page Title</h1>
                    <div class="flex items-center ml-auto">
                        <button class="flex items-center justify-center h-10 px-4 text-sm font-medium rounded hover:bg-gray-300">
                            Action 1
                        </button>
                        <button class="flex items-center justify-center h-10 px-4 ml-2 text-sm font-medium bg-gray-200 rounded hover:bg-gray-300">
                            Action 2
                        </button>
                        <button class="relative ml-2 text-sm focus:outline-none group">
                            <div class="flex items-center justify-between w-10 h-10 rounded hover:bg-gray-300">
                                <svg class="w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </div>
                            <div class="absolute right-0 flex-col items-start hidden w-40 pb-1 bg-white border border-gray-300 shadow-lg group-focus:flex">
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="flex-grow p-6 overflow-auto bg-gray-200">
                   <router-view />
                </div>
            </div>
           

</div>

<a class="fixed flex items-center justify-center h-8 pr-2 pl-1 bg-blue-600 rounded-full bottom-0 right-0 mr-4 mb-4 shadow-lg text-blue-100 hover:bg-blue-600" href="https://twitter.com/lofiui" target="_top">
	<div class="flex items-center justify-center h-6 w-6 bg-blue-500 rounded-full">
		<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current r-jwli3a r-4qtqp9 r-yyyyoo r-16y2uox r-1q142lx r-8kz0gk r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue"><g><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></g></svg>
	</div>
	<span class="text-sm ml-1 leading-none">@lofiui</span>
</a>
</template>
~~~

- Creo admin/views/DashboardView.vue con la vista (con el último div del componente, los productos)

~~~vue
<template>
     <div class="grid grid-cols-3 gap-6">
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-3 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-3 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-1 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-2 bg-white border border-gray-300"></div>
        <div class="h-24 col-span-3 bg-white border border-gray-300"></div>
    </div>
</template>
~~~

- Debemos configurar la ruta en admin/routes/index.ts
- Redirecciono a admin-dashboard

~~~js
import isAdminGuard from "@/modules/auth/guards/is-admin.guard";
import isAuthenticatedGuard from "@/modules/auth/guards/is-authenticated.guard";
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    beforeEnter: [isAuthenticatedGuard, isAdminGuard],
    redirect: {name: 'admin-dashboard'},
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue'),
    children:[
        {
            path:'dashboard',
            name: 'admin-dashboard',
            component: ()=> import('@/modules/admin/views/DashboardView.vue')
        }
    ]
}
~~~

## Pantalla de productos

- Creo admin/views/ProductsView.vue
- Usaremos este componente Striped Table

> https://www.creative-tim.com/twcomponents/component/striped-table

- Le añado un div con un h1 y en el mismo div meto el componente
- Cambio los table headers
- Los table rows los borro todos menos uno
- Creo el script setup
- En el componente shop/views/HomeView.vue tengo el mismo código que voy a ocupar de tanstackQuery para la petición de productos
- Uso los productos en el table row con un v-for. Uso un v-bind en el class para aplicar uun fondo gris a las filas pares
- Uso la primera imagen del arreglo. Habría que colocar algo por si no hay imagen
- Uso un router-link para el titulo, lo mando a una ruta que todavía no existe
- El precio aparece en una especie de pastillita azul
- Uno las tallas que vienen en el array por comas
- Cambio los width de los table headers para que se ajusten bien
- Quito también los w-1/3 de los td, así no hace brincos 
- Coloco al final el BottomPagination
  - Le paso el page y en hasmore data uso la doble negación para transformar a true products (es decir, si tengo productos) y si el hasMoreData es menor a 10
- ProductsView.vue

~~~vue
<template>

<div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Productos</h1>
    <div class="py-8 w-full">
  <div class="shadow overflow-hidden rounded border-b border-gray-200">
    <table class="min-w-full bg-white">
      <thead class="bg-gray-800 text-white">
        <tr>
          <th class="w-10text-left py-3 px-4 uppercase font-semibold text-sm">Imagen</th>
          <th class="flex-1 text-left py-3 px-4 uppercase font-semibold text-sm">Título</th>
          <th class="w-28 text-left py-3 px-4 uppercase font-semibold text-sm">Precio</th>
          <th class="w-60 text-left py-3 px-4 uppercase font-semibold text-sm">Tallas</th>
        </tr>
      </thead>
    <tbody class="text-gray-700">
      <tr 
      v-for="(product, index) in products"
            :key="product.id"
            :class="{
                'bg-gray-100': index % 2 === 0 //coloco fondo gris en los pares
            }">
        <td class="text-left py-3 px-4">
            <img 
            class="h-10 w-10 object-cover"
            :src="product.images[0]" :alt="product.title" />
        </td>
        <td class="text-left py-3 px-4">
            <router-link 
                :to="`/admin/products/${product.id}`"
                class="hover:text-blue-500 hover:underline"
            >{{ product.title }}
            </router-link>
        </td>
        <td class="text-left py-3 px-4">
            <span class="bg-blue-200 text-blue-600 py-1 px-3 rounded-full text-xs">
                {{ product.price }}
            </span>
        </td>
        <td class="text-left py-3 px-4">
            {{ product.sizes.join(',') }}
        </td>
      </tr>
    </tbody>
    </table>
  </div>
      <ButtonPagination 
        :page="page"
        :has-more-data="!!products && products.length > 10"
    />
</div>    
</div>
</template>

<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue'
import { getProductsAction } from '@/modules/products/actions'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

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
		queryFn: ()=> getProductsAction(page.value +1), 
	})
})
</script>
~~~

- El products/action/getProductsAction es este

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

- El products/action/getProductImageAction 

~~~js
export const getProductImageAction =(imageName: string): string=> {

    return imageName.includes('http')
    ? imageName
    : `${import.meta.env.VITE_TESLO_API_URL}/files/product/${imageName}`
}
~~~

- Creamos la ruta para visualizar ProductsView.vue en admin/routes/index.ts

~~~js
import isAdminGuard from "@/modules/auth/guards/is-admin.guard";
import isAuthenticatedGuard from "@/modules/auth/guards/is-authenticated.guard";
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    beforeEnter: [isAuthenticatedGuard, isAdminGuard],
    redirect: {name: 'admin-dashboard'},
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue'),
    children:[
        {
            path:'dashboard',
            name: 'admin-dashboard',
            component: ()=> import('@/modules/admin/views/DashboardView.vue')
        },
        {
            path:'products',
            name: 'admin-products',
            component: ()=> import('@/modules/admin/views/ProductsView.vue')
        },
    ]
}
~~~

- Si apunto en el url a admin/products, veo la tabla en lugar de los productos (que tampoco veo los productos, no hemos hecho la petición para mostrar los productos)


## usePagination - Composable

- Optimización. Creemos un custom composable para la paginación
- Hay quien se crea composable para usar el useQuery, así no hay que ir repitiendo el queryKey
- En realidad, solo necesito obtener la página
- common/composables/usePagination.ts

~~~js
import { ref, watch } from "vue"
import { useRoute } from "vue-router"

export const usePagination =()=>{

    const route = useRoute()
    const page = ref(Number(route.query.page || 1))
   
    watch(
	()=>route.query.page,
	(newPage)=>{
		page.value = Number(newPage || 1)

		window.scrollTo({top:0, behavior: 'smooth'})
	}
)
   
    return {
        page
    }
}
~~~

- Usémoslo en el script de ProductsView.vue

~~~js
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue'
import { usePagination } from '@/modules/common/composables/use-pagination'
import { getProductsAction } from '@/modules/products/actions'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { watchEffect } from 'vue'

const {page} = usePagination()
const queryClient = useQueryClient()

const {data:products, isLoading} = useQuery({
  queryKey:['products', {page: page}],
  queryFn: ()=> getProductsAction(page.value),
})


watchEffect(()=>{
	queryClient.prefetchQuery({
		queryKey: ['products', {page: page.value +1}],
		queryFn: ()=> getProductsAction(page.value +1), 
	})
})
~~~

## Pantalla de Producto

- Creo en admin/routes/index.ts la ruta hija para mostrar el componente de producto

~~~js
import isAdminGuard from "@/modules/auth/guards/is-admin.guard";
import isAuthenticatedGuard from "@/modules/auth/guards/is-authenticated.guard";
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    beforeEnter: [isAuthenticatedGuard, isAdminGuard],
    redirect: {name: 'admin-dashboard'},
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue'),
    children:[
        {
            path:'dashboard',
            name: 'admin-dashboard',
            component: ()=> import('@/modules/admin/views/DashboardView.vue')
        },
        {
            path:'products',
            name: 'admin-products',
            component: ()=> import('@/modules/admin/views/ProductsView.vue')
        },
        {
            path:'products/:productId',
            name: 'admin-product',
            component: ()=> import('@/modules/admin/views/ProductView.vue')
        },
    ]
}
~~~

- Creo el componente ProductView.vue
- Fernando proporciona el formulario en un Gist

> https://gist.github.com/Klerith/26abee32f3d75c7f3ca52d8ec50f2ffd

~~~vue
<template>
  <div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Producto: <small class="text-blue-500">nombre</small></h1>
    <hr class="my-4" />
  </div>

  <form class="grid grid-cols-1 sm:grid-cols-2 bg-white px-5 gap-5">
    <div class="first-col">
      <!-- Primera parte del formulario -->
      <div class="mb-4">
        <label for="title" class="form-label">Título</label>
        <input type="text" id="title" class="form-control" />
      </div>

      <div class="mb-4">
        <label for="slug" class="form-label">Slug</label>
        <input type="text" id="slug" class="form-control" />
      </div>

      <div class="mb-4">
        <label for="description" class="form-label">Descripción</label>
        <textarea
          id="description"
          class="shadow h-32 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        ></textarea>
      </div>

      <div class="flex flex-row gap-3">
        <div class="mb-4">
          <label for="price" class="form-label">Precio</label>
          <input type="number" id="price" class="form-control" />
        </div>

        <div class="mb-4">
          <label for="stock" class="form-label">Inventario</label>
          <input type="number" id="stock" class="form-control" />
        </div>
      </div>

      <div class="mb-4">
        <label for="sizes" class="form-label">Tallas</label>
        <button type="button" class="bg-blue-100 p-2 rounded w-14 mr-2">XS</button>
        <button type="button" class="bg-blue-500 text-white p-2 rounded w-14 mr-2">S</button>
        <button type="button" class="bg-blue-500 text-white p-2 rounded w-14 mr-2">M</button>
      </div>
    </div>

    <!-- Segunda columna -->
    <div class="first-col">
      <label for="stock" class="form-label">Imágenes</label>
      <!-- Row with scrollable horizontal -->
      <div class="flex p-2 overflow-x-auto space-x-8 w-full h-[265px] bg-gray-200 rounded">
        <div class="flex-shrink-0">
          <img src="https://via.placeholder.com/250" alt="imagen" class="w-[250px] h-[250px]" />
        </div>

        <div class="flex-shrink-0">
          <img src="https://via.placeholder.com/250" alt="imagen" class="w-[250px] h-[250px]" />
        </div>
      </div>
      <!-- Upload image -->
      <div class="col-span-2 my-2">
        <label for="image" class="form-label">Subir imagen</label>

        <input multiple type="file" id="image" class="form-control" />
      </div>

      <div class="mb-4">
        <label for="stock" class="form-label">Género</label>
        <select class="form-control">
          <option value="">Seleccione</option>
          <option value="kid">Niño</option>
          <option value="women">Mujer</option>
          <option value="men">Hombre</option>
        </select>
      </div>

      <!-- Botón para guardar -->
      <div class="my-4 text-right">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
 @reference 'tailwindcss'
.form-label {
  @apply block text-gray-700 text-sm font-bold mb-2;
}

.form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- Tengo un título Producto: {nombre del producto}
- A la izquierda tengo una caja para el Titulo, debajo el slug, debajo la descripción en un text-area, debajo dos cajas con precio e inventario y debajo las tallas 
- A la derecha tengo dos imágenes (que no están todavía), debajo la caja con el botón para subir imagen y debajo el género
  - Abajo a la derecha está el botón de guardar
- Creemos las opciones en el dashboard, en el menú lateral para navegar entre dashboard y productos
- Donde va el PageTitle quiero poner el nombre del usuario activo, en el authStore tengo el getter username
  - No se aconseja desestructurar directamente del store
  - Habría que usar **storeToRefs**(authStore()) para poder desestructurar
- En AdminLayout.vue

~~~vue
<template>
<div class="flex w-screen h-screen text-gray-700">
            <div class="flex flex-col items-center w-16 pb-4 overflow-auto border-r border-gray-300">
                <a class="flex items-center justify-center flex-shrink-0 w-full h-16 bg-gray-300" href="#">
                    <svg class="w-8 h-8"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 mt-auto rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </a>
            </div>
            <div class="flex flex-col w-56 border-r border-gray-300">
                <button class="relative text-sm focus:outline-none group">
                    <div class="flex items-center justify-between w-full h-16 px-4 border-b border-gray-300 hover:bg-gray-300">
                        <span class="font-medium">
                            Dropdown
                        </span> 
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="absolute z-10 flex-col items-start hidden w-full pb-1 bg-white shadow-lg group-focus:flex">
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                    </div>
                </button>
                
                <!--Menú lateral-->
                <div class="flex flex-col flex-grow p-4 overflow-auto">
                    <RouterLink 
                        to="/admin"
                        class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Dashboard</span>
                    </RouterLink>
                    <RouterLink
                        to="/admin/products" 
                        class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Productos</span>
                    </RouterLink>

                    <a class="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-200 rounded hover:bg-gray-300"
                        href="#">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <!--Botón para crear unuevo Producto-->
                        <span class="ml-2 leading-none">Nuevo Producto</span>
                    </a>
                </div>

            </div>
            <div class="flex flex-col flex-grow w-full">
                <div class="flex items-center flex-shrink-0 h-16 px-8 border-b border-gray-300 justify-between">
                    <h1 class="text-lg font-medium">{{ authStore.username }}</h1>
                    <div class="flex items-center ml-auto">
                        <button class="flex items-center justify-center h-10 px-4 text-sm font-medium rounded hover:bg-gray-300">
                            Action 1
                        </button>
                        <button class="flex items-center justify-center h-10 px-4 ml-2 text-sm font-medium bg-gray-200 rounded hover:bg-gray-300">
                            Action 2
                        </button>
                        <button class="relative ml-2 text-sm focus:outline-none group">
                            <div class="flex items-center justify-between w-10 h-10 rounded hover:bg-gray-300">
                                <svg class="w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </div>
                            <div class="absolute right-0 flex-col items-start hidden w-40 pb-1 bg-white border border-gray-300 shadow-lg group-focus:flex">
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="flex-grow p-6 overflow-auto bg-gray-200">
                   <router-view />
                </div>
            </div>
           

</div>

<a class="fixed flex items-center justify-center h-8 pr-2 pl-1 bg-blue-600 rounded-full bottom-0 right-0 mr-4 mb-4 shadow-lg text-blue-100 hover:bg-blue-600" href="https://twitter.com/lofiui" target="_top">
	<div class="flex items-center justify-center h-6 w-6 bg-blue-500 rounded-full">
		<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current r-jwli3a r-4qtqp9 r-yyyyoo r-16y2uox r-1q142lx r-8kz0gk r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue"><g><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></g></svg>
	</div>
	<span class="text-sm ml-1 leading-none">@lofiui</span>
</a>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/modules/auth/stores/auth.store';


    const authStore = useAuthStore()

</script>
~~~

- ProductView (el formulario) es un componente que va a manejar mucha lógica: inputs, validaciones, etc
- Creo en admin/views/ProductView.ts

~~~js
import { defineComponent } from "vue"

export default defineComponent({

    setup(){
        console.log('Hola mundo')
    }
})
~~~

- Debo pasarle el archivo al script de ProductView.vue

~~~html
<script src="./ProductView.ts" lang="ts"></script>
~~~

- Creo un getter en ProductView.ts

~~~js
import { computed, defineComponent } from "vue"

export default defineComponent({

    

    setup(){
        console.log('Hola mundo')


        return{
            // Properties


            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']


            // Actions

        }
    }
})
~~~

- Ahora puedo usar el allSizes para mostrar las tallas en el ProductView

~~~html
<div class="mb-4">
    <label for="sizes" class="form-label">Tallas</label>
    <div class="flex">
         <button 
                v-for="size of allSizes"
                :key="size"
                type="button" 
                class="bg-blue-100 p-2 rounded w-14 mr-2 flex-1">
                {{ size }}
         </button>
    </div>
</div>
~~~

## Cargar información del producto

- Quiero cargar la data que contiene el producto al que hago clic en ProductsView del dashboard de admin
- Que cuando se habra la vista de ProductView con rl formulario cargue la data del producto al que he clicado
- Creemos una acción que nos sirva para traer la info de un producto, la crearemos en products//actions/get-product-by-id.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product } from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"
import { isAxiosError } from "axios"

export const getProductById =async (id: string)=>{
    
    //TODO: pensar la creación de un nuevo producto
    
    try {
        const {data} = await tesloApi.get<Product>(`/products/${id}`)
        //console.log(data) para ver el producto en consola

        return{
            ...data,
            images: data.images.map(getProductImageAction)
        }
    } catch (error) {
        console.log(error)

        throw new Error('Error obteniendo el producto')
    }
}
~~~

- El getProductImageAction.ts

~~~js
export const getProductImageAction =(imageName: string): string=> {

    return imageName.includes('http')
    ? imageName
    : `${import.meta.env.VITE_TESLO_API_URL}/files/product/${imageName}`
}
~~~

- En admin/views/ProductView.ts (donde está la lógica)
- Cuando se cargue el componente necesito traerme la info del producto
- ¿Cómo le paso el id? El defineProps solo funciona en el script setup
- Creo el objeto de props y se lo paso a la función setup

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { computed, defineComponent } from "vue"

export default defineComponent({

    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        //defineProps() solo funciona en el script setup
        
        const {data: product} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })


        return{
            // Properties


            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],


            // Actions

        }
    }
})
~~~

- Hay una property en el router (props) que hay que ponerle en true para que haga el match con la property productId

~~~js
import isAdminGuard from "@/modules/auth/guards/is-admin.guard";
import isAuthenticatedGuard from "@/modules/auth/guards/is-authenticated.guard";
import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw ={
    path: '/admin',
    name: 'admin',
    beforeEnter: [isAuthenticatedGuard, isAdminGuard],
    redirect: {name: 'admin-dashboard'},
    component : ()=> import('@/modules/admin/layouts/AdminLayout.vue'),
    children:[
        {
            path:'dashboard',
            name: 'admin-dashboard',
            component: ()=> import('@/modules/admin/views/DashboardView.vue')
        },
        {
            path:'products',
            name: 'admin-products',
            component: ()=> import('@/modules/admin/views/ProductsView.vue')
        },
        {
            path:'products/:productId',
            name: 'admin-product',
            props: true, //props en true!!<---------------------
            component: ()=> import('@/modules/admin/views/ProductView.vue')
        },
    ]
}
~~~

- Puedo poner un console.log de la data en la action para verla en pantalla
- Si no encontrara el producto habría que sacar al usuario de la pantalla producto
- Usaremos un watchEffect. En lugar de router.push uso replace porque no quiero que se pueda volver a esta pantalla si no existe
- ProductView.ts

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { computed, defineComponent, watchEffect } from "vue"
import { useRouter } from "vue-router"

export default defineComponent({

    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        watchEffect(()=>{
            if(isError.value && !isLoading.value){
                router.replace('/admin/products')
                return
            }
        })


        return{
            // Properties

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        
            
            // Actions
        }
    }
})
~~~

## Ref y reactive - El problema

- Son 8 campos. Va a requerir mucho trabajo
- Que el título tenga un valor, que el slug tenga un valor, que las tallas correspondan alas existentes, etc
- Podríamos trabajar con ref para declarar un objeto myForm reactivo y usar v-model, con un v-if si el myForm tiene data
- Quiero decirle al usuario cuando estoy en Title y le doy Tab para pasar a Slug, quiero decirle al usuario que Tutle es obligatorio
  - Validaciones, vaya. Un schema de validación que cumpla ciertas condiciones para disparar las notificaciones
  - Usando ref habría que hacer muchas validaciones manuales, los casos cuando sale bien, los focos, los estilos...

## VeeValidate


> npm i vee-validate

- No necesita configuración global
- Importamos useForm en ProductView.ts
- Desestructuro values del useForm, lo retorno en la función setup

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { defineComponent, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useForm} from 'vee-validate'

export default defineComponent({

    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {values} = useForm()

        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })


        return{
            // Properties
            values,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions

        }
    }
})
~~~

- Ahora ya puedo ir a ProductView.vue
- Vamos a crear una manera de visualizar los valores del formulario de forma temporal en pantalla, abajo de la vista del formulario
- Lo coloco dentro del template, al final

~~~html
<div class="grid grid-cols-2">
  <div class="bg-blue-300">
    {{ values }}
  </div>
</div>
~~~

- Todavía el formulario no tiene ninguna data, por lo que aparecen unas llaves vacías {}
- Necesitamos ir conectando los valores al formulario
- definefield lo tomamos también de useForm
- Lo usamos para llamar a una función que me va a regresae el email y el emailAtrrs
  - email sería el valor y emailAttrs las propiedades

~~~js
const {defineField} = useForm()

const [email, emailAttrs] = defineField('email')
~~~ 

- En ProductView.ts (dentro de la función setup)

~~~js
const {values, defineField} = useForm()

const [title, titleAttrs] = defineField('title')
const [slug, slugAttrs] = defineField('slug')
const [description, descriptionAttrs] = defineField('description')
const [price, priceAttrs] = defineField('price')
const [stock, stockAttrs] = defineField('stock')
const [gender, genderAttrs] = defineField('gender')
//TODO: defineArray para las tallas y las imagenes
~~~

- Todo esto necesito retornarlo en el return de la función setup

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { defineComponent, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useForm} from 'vee-validate'

export default defineComponent({

    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {values, defineField} = useForm()

        const [title, titleAttrs] = defineField('title')
        const [slug, slugAttrs] = defineField('slug')
        const [description, descriptionAttrs] = defineField('description')
        const [price, priceAttrs] = defineField('price')
        const [stock, stockAttrs] = defineField('stock')
        const [gender, genderAttrs] = defineField('gender')
        //TODO: defineArray para las tallas y las imagenes

        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })


        return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions

        }
    }
})
~~~

- Conectemos el título con v-model y v-bind

~~~html
<input 
    v-model="title"
    v-bind="titleAttrs" 
    type="text" 
    id="title" 
    class="form-control" />
~~~

- Si empiezo a escribir en el input del titulo puedo visualizarlo en el div que coloqué con values al final del template de ProductView.vue
- Si quiero forzar a que el título tenga un valor, ¿cómo lo hago?
- Usaremos un validador de schema llamado **yup**
- El schema se lo puedo pasar al useForm y de esta manejar los errores

> npm i yup 

- Puedo colocar el schema fuera del defineComponent en ProductView.ts
- Lo llamo validationSchema, que es igual que el nombre de la propiedad para pasarle el schema
  - Si no tendría que poner validationSchema: miSchema, en el useForm
  - Desestructuro los errores y los retorno en el return del setup()

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { defineComponent, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useForm} from 'vee-validate'
import * as yup from 'yup'

const validationSchema = yup.object({
    title: yup.string().required().min(2), //minimo 2 caracteres
    slug: yup.string().required(),
    description: yup.string().required(),
    price: yup.number().required(),
    stock: yup.number().min(1).required(),
    gender: yup.string().required().oneOf(['men', 'women', 'kid']),
})

export default defineComponent({

    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {values, defineField, errors} = useForm({
            validationSchema
        })

        const [title, titleAttrs] = defineField('title')
        const [slug, slugAttrs] = defineField('slug')
        const [description, descriptionAttrs] = defineField('description')
        const [price, priceAttrs] = defineField('price')
        const [stock, stockAttrs] = defineField('stock')
        const [gender, genderAttrs] = defineField('gender')
        //TODO: defineArray para las tallas y las imagenes

        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })


        return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,
            errors,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions
        }
    }
})
~~~

- En ProductView.vue me creo otro div para visualizar el validationSchema

~~~html
<div class="grid grid-cols-2">
    <div class="bg-blue-300">
        {{ values }}
    </div>
    <div class="bg-red-300">
        {{ errors }}
    </div>
</div>
~~~

- Si ahora me pongo en el input de Title en el navegador y me salgo sin escribir nada, me salta el error { "title": "title is a required field" }
- Lo puedo ver en pantalla porque estoy renderizando los errores en el div  dentro de ProductView.vue

## Mostrar los errores en pantalla

- Centrémonos en el title, ya conectaremos el resto del formulario, puesto que vamos a crear un componente reutilizable para reutilizar la lógica
- Una forma elegante sería marcar el borde en rojo cuando hay un error
- Uso :class para añadir lógica al css con tailwind
- Dentro del arreglo dejo la clase form-control para que siempre la tenga y abro llaves para usar lógica
- ProductView.vue

~~~html
<input 
    v-model="title"
    v-bind="titleAttrs" 
    type="text" 
    id="title" 
    :class="['form-control', {
        'border-red-500': errors.title //si hay un error el borde será rojo
    }]" />
~~~

- Para mostarr el error podemos usar un span
- ProductView.vue

~~~html
<div class="mb-4">
    <label for="title" class="form-label">Título</label>
    <input 
    v-model="title"
    v-bind="titleAttrs" 
    type="text" 
    id="title" 
    :class="['form-control', {
        'border-red-500': errors.title
    }]" />
    <span 
    class="text-red-400"
    v-if="errors.title">{{ errors.title }}</span>
</div>
~~~

- Como todos los componentes van a tener la misma lógica, lo mejor será crear un componente reutilizable CustomInput
- Puedo crear un v-model personalizado. Para que ese v-model funcione hay que definir el update:modelValue y el :value con el modelValue definido en las props

## Custom input y v-model

- En common/components/CustomInput.vue
- Conecto las props al input
- A :value le paso el modelValue
- Uso @input porque es un evento, uso el emit con update:modelValue. Esto habilita el v-model
- Ocupamos emitir el valor que tenga el input (y siempre queremos emitirlo) usamos (($event.target as HTMLInputElement)?.value ?? ''). Si no emite nada emite un string vacio
- Uso blur para cuando pierde el foco emitir blur
- Uso defineEmits para ambos
- CustomInput.vue

~~~vue
<template>
    <input 
      :type="type" 
      :value="modelValue" 
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value ?? '')"
      @blur="$emit('blur')"
      :class="['form-control', {
          'border-red-500': error
      }]" />
    <span 
      class="text-red-400"
      v-if="error">{{ error}}</span>
</template>

<script lang="ts" setup>
    interface Props{
        modelValue?: string | number
        error?: string
        type?: 'text' | 'number'
    }

    withDefaults(defineProps<Props>(),{
        type: 'text'
    })

    defineEmits(['update:modelValue', 'blur'])

</script>

<style scoped>
 @reference 'tailwindcss'

 .form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- Usémoslo en admin/views/ProductView.ts 
- Usando el script setup podíamos importar los componentes directamente
- Cuando usamos defineComponents necesitamos declarar que componentes va a disponer el componente padre explicitamente con el objeto components

~~~ts
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { defineComponent, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useForm} from 'vee-validate'
import * as yup from 'yup'
import CustomInput from "@/modules/common/components/CustomInput.vue"

const validationSchema = yup.object({
    title: yup.string().required().min(2),
    slug: yup.string().required(),
    description: yup.string().required(),
    price: yup.number().required(),
    stock: yup.number().min(1).required(),
    gender: yup.string().required().oneOf(['men', 'women', 'kid']),
})

export default defineComponent({
    components:{
        CustomInput //<----- AQUI!
    },
    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {values, defineField, errors} = useForm({
            validationSchema
        })

        const [title, titleAttrs] = defineField('title')
        const [slug, slugAttrs] = defineField('slug')
        const [description, descriptionAttrs] = defineField('description')
        const [price, priceAttrs] = defineField('price')
        const [stock, stockAttrs] = defineField('stock')
        const [gender, genderAttrs] = defineField('gender')
        //TODO: defineArray para las tallas y las imagenes

        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })


        return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,
            errors,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions

        }
    }
})
~~~

- Ahora ya puedo importar el CustomInput en ProductView.vue

~~~js
<CustomInput 
 v-model="title"
 v-bind="titleAttrs"
 :error="errors.title"
/>
~~~

- Me aparece este warning

~~~
Vue warn: Extraneous non-emits event listeners (change, input) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option. 
  at <CustomInput modelValue=undefined onUpdate:modelValue=fn onChange=fn<onChange>  ... > 
  at <ProductView productId="3552ca52-56d9-4805-9f20-d721c92250c2" onVnodeUnmounted=fn<onVnodeUnmounted> ref=Ref< Proxy(Object) > > 
  at <RouterView > 
  at <AdminLayout onVnodeUnmounted=fn<onVnodeUnmounted> ref=Ref< Proxy(Object) > > 
  at <RouterView key=1 > 
  at <App>
~~~

- Cuando se trabaja con este v-model y hay dos elementos retornados en el root (template) da problemas
- Simplemente colocándolos dentro de un div se soluciona

~~~vue
<template>
    <div> <!--USO UN DIV PARA QUITAR EL WARNING-->
        <input 
          :type="type" 
          :value="modelValue" 
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value ?? '')"
          @blur="$emit('blur')"
          :class="['form-control', {
              'border-red-500': error
          }]" />
        <span 
          class="text-red-400"
          v-if="error">{{ error}}</span>
    </div>
</template>

<script lang="ts" setup>
    interface Props{
        modelValue?: string | number
        error?: string
        type?: 'text' | 'number'
    }

    withDefaults(defineProps<Props>(),{
        type: 'text'
    })

    defineEmits(['update:modelValue', 'blur'])

</script>

<style scoped>
 @reference 'tailwindcss'

 .form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- Uso el CustomInput con el resto de campos (slug, precio e inventario)
- La descripción es un text area, crearé un CustomtextArea. Falta el del género
- Para los números uso el modificador v-model.number para transformar de string a número
- 
~~~vue
<template>
  <div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Producto: <small class="text-blue-500">nombre</small></h1>
    <hr class="my-4" />
  </div>

  <form class="grid grid-cols-1 sm:grid-cols-2 bg-white px-5 gap-5">
    <div class="first-col">
      <!-- Primera parte del formulario -->
      <div class="mb-4">
        <label for="title" class="form-label">Título</label>
          <CustomInput 
          v-model="title"
          v-bind="titleAttrs"
          :error="errors.title"
          />
      </div>

      <div class="mb-4">
        <label for="slug" class="form-label">Slug</label>
          <CustomInput 
          v-model="slug"
          v-bind="slugAttrs"
          :error="errors.slug"
          />
      </div>

      <div class="mb-4">
        <label for="description" class="form-label">Descripción</label>
        <textarea
          id="description"
          class="shadow h-32 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        ></textarea>
      </div>

      <div class="flex flex-row gap-3">
        <div class="mb-4">
          <label for="price" class="form-label">Precio</label>
            <CustomInput 
          v-model.number="price"
          v-bind="priceAttrs"
          :error="errors.price"
          />
        </div>

        <div class="mb-4">
          <label for="stock" class="form-label">Inventario</label>
            <CustomInput 
          v-model.number="stock"
          v-bind="stockAttrs"
          :error="errors.stock"
          />
        </div>
      </div>

      <div class="mb-4">
        <label for="sizes" class="form-label">Tallas</label>
        <div class="flex">
            <button 
                v-for="size of allSizes"
                :key="size"
                type="button" 
                class="bg-blue-100 p-2 rounded w-14 mr-2 flex-1">
                {{ size }}
            </button>
        </div>
      </div>
    </div>

    <!-- Segunda columna -->
    <div class="first-col">
      <label for="stock" class="form-label">Imágenes</label>
      <!-- Row with scrollable horizontal -->
      <div class="flex p-2 overflow-x-auto space-x-8 w-full h-[265px] bg-gray-200 rounded">
        <div class="flex-shrink-0">
          <img src="https://via.placeholder.com/250" alt="imagen" class="w-[250px] h-[250px]" />
        </div>

        <div class="flex-shrink-0">
          <img src="https://via.placeholder.com/250" alt="imagen" class="w-[250px] h-[250px]" />
        </div>
      </div>
      <!-- Upload image -->
      <div class="col-span-2 my-2">
        <label for="image" class="form-label">Subir imagen</label>

        <input multiple type="file" id="image" class="form-control" />
      </div>

      <div class="mb-4">
        <label for="stock" class="form-label">Género</label>
        <select class="form-control">
          <option value="">Seleccione</option>
          <option value="kid">Niño</option>
          <option value="women">Mujer</option>
          <option value="men">Hombre</option>
        </select>
      </div>

      <!-- Botón para guardar -->
      <div class="my-4 text-right">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  </form>

  <div class="grid grid-cols-2">
  <div class="bg-blue-300">
    {{ values }}
  </div>
  <div class="bg-red-300">
    {{ errors }}
  </div>
</div>
</template>

<script src="./ProductView.ts" lang="ts"></script>

<style scoped>
    @reference 'tailwindcss'
.form-label {
  @apply block text-gray-700 text-sm font-bold mb-2;
}

.form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- Falta ver el submit, bloqueo de botón, CustomtextArea, manejo de selectores (género, tallas)

## CustomTextArea y posteo del formulario


- En common/components/CustomtextArea.vue (similar al CustomInput.vue)
- Copio las clases que tiene y se las añado al componente dentro del style scoped

~~~html
<template>
    <div>
        <textarea 
          :value="modelValue" 
          @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement)?.value ?? '')"
          @blur="$emit('blur')"
          :class="['form-control',{
              'border-red-500': error
          }]"></textarea>
        <span 
          class="text-red-400"
          v-if="error">{{ error}}</span>
    </div>
</template>

<script lang="ts" setup>
    interface Props{
        modelValue?: string | number
        error?: string

    }

    defineProps<Props>()


    defineEmits(['update:modelValue', 'blur'])

</script>

<style scoped>
 @reference 'tailwindcss'

 :host {
  display: block;
  width: 100%;
}

 .form-control {
  @apply shadow h-32 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none
 }
  </style>
~~~

- Recuerda que para poder renderizar el componente, cuando usamos defineComponent en lugar del script setup hay que declarar el componente 
- ProductView.ts

~~~js
export default defineComponent({
    components:{
        CustomInput,
        CustomtextArea
    },

{...code}
})
~~~ 

- Lo uso en ProductView.vue

~~~html
<div class="mb-4">
    <label for="description" class="form-label">Descripción</label>
    <CustomtextArea 
    v-model="description"
    v-bind="descriptionAttrs"
    :error="errors.description"
    />
</div>
~~~

- **NOTA:** No se recomienda usar archivos de barril para exportar los archivos .vue
- Para manejar el posteo del formulario es bien sencillo
- Desestructuro el handleSubmit del useForm
- ProductView.ts

~~~js
const {values, defineField, errors, handleSubmit} = useForm({
            validationSchema
        })

const onSubmit = handleSubmit((value)=>{
            console.log({value})
        })

//retorno onSubmit en el return del setup() para poder usarlo en el ProductView.vue
~~~

- Ahora ya puedo usarlo en el form. No hace falta hacer el prevent default porque la función se va a encargar de hacer esto
- ProductView.vue

~~~html
<form 
    @submit="onSubmit"
    class="grid grid-cols-1 sm:grid-cols-2 bg-white px-5 gap-5">
~~~

- Faltan el gender, las tallas y las imágenes para poder hacer el submit!
- Luego veremos como cambiar el idioma de los mensajes de error

## Selectores y arreglos

- En las tallas quiero hacer clic en cada uno de los botones que se muestran y que se active el color, por lo que va a llevar un poco más de lógica
- Si no existe que no la agregue, si ya está seleccionada que la remueva, etc
- Para el selector de gender no hay nada especial, ya tengo gender y genderAttrs
- Lo conecto con el select

~~~html
<div class="mb-4">
<label for="stock" class="form-label">Género</label>
<select
    v-model="gender"
    v-bind="genderAttrs" 
    class="form-control">
    <option value="">Seleccione</option>
    <option value="kid">Niño</option>
    <option value="women">Mujer</option>
    <option value="men">Hombre</option>
</select>
<span class="text-red-400" v-show="errors.gender">
    {{ errors.gender }}</span>
</div>
~~~

- Veamos como hacer cuando tenemos un arreglo de imágenes
- Para usar useFieldArray tiene que haber un useForm previamente creado
- Puedes tener un componente que una varios componentes, pero cada uno tiene que tener un useForm independiente
- Es una restricción
- Para indicar en el useFieldArray el tipo no hace falta poner corchetes para indicar que es un array, solo pongo string
- Desestructuro fields, lo renombro a images
- Retorno images en el return del setup
- ProductView.ts

~~~js
const {values, defineField, errors, handleSubmit} = useForm({
        validationSchema
    })

const {fields: images} = useFieldArray<string>('images')

//retorno images
~~~

- Hago uso de un v-for en el componente que muestra las imágenes de ProductView.vue

~~~html
<div 
    v-for="image of images"
    :key="image.key"
    :alt="title"
    class="flex-shrink-0">
    <img :src="image.value" alt="imagen" class="w-[250px] h-[250px]" />
</div>
~~~

- No vemos nada de la misma forma que todavía no vemos cargado el titulo del producto, ni el slug ni nada
- ¿Cómo hacemos para mostrar esa información?
- En ProductView.ts tengo el product que extraigo del useQuery
- ProductView.ts

~~~js
const {data: product, isError, isLoading} = useQuery({
    queryKey: ['product', props.productId ],
    queryFn: ()=> getProductById(props.productId),
    retry: false //que no vuelva a intentarlo si falla
})
~~~

- Es tarde para establecerlo con initialValues porque cuando TansTackQuery resuelve, el fromulario ya está montado

~~~js
const {values, defineField, errors, handleSubmit} = useForm({
    validationSchema,
    initialValues: product.value //no funciona
})
~~~

- Esto funciona si previamente tengo los valores
- Nos falta el array de las tallas
- Lo creo
- ProductView.ts

~~~js
const {fields: sizes} = useFieldArray<string>('sizes')

//retorno sizes en el return del setup()
~~~

- Usemos @click y pasémosle una función que reciba la talla
- ProductView.vue
  
~~~html
<div class="flex">
<button 
    v-for="size of allSizes"
    :key="size"
    @click="toggleSize(size)"
    type="button" 
    class="bg-blue-100 p-2 rounded w-14 mr-2 flex-1">
    {{ size }}
</button>
</div>
~~~

- Creo la función en ProductView.ts

~~~js 
             //desestructuro los métodos remove y push, los renombro a removeSize y pushSize
const {fields: sizes, remove: removeSize, push: pushSize} = useFieldArray<string>('sizes')

const toggleSize = (size: string)=>{
    const currentSizes = sizes.value.map(size=>size.value)
    const hasSize = currentSizes.includes(size)

    if(hasSize){ //si ya existe lo elimino (para desmarcar la selección)
        removeSize(currentSizes.indexOf(size)) //hay que mandarle un índice para poderlo eliminar
    }else{
        pushSize(size)
    }        
}

//retorno la función en el return del setup()
~~~

- La funcionalidad está
- Ahora falta añadir la clase de tailwind para que cuando esté seleccionado se vea en azul y cuando clico lo desselecciono

## Inicializar formulario con valores del producto

- Este watchEffect se encarga de que si no tengo producto o hay un error me devuelva a la pantalla de products
- Está en el ProductView.ts, dentro del setup()

~~~js
watchEffect(()=>{
        if(isError.value &&!isLoading.value){
            router.replace('/admin/products')
            return
        }
    })
~~~

- Si tenemos un producto podría colocar la lógica dentro de este watchEffect después del if, pero se recomienda que cada watchEffect se encargue solo de una tarea específica
- Puedo usar un watch, que a diferencia del watchEffect dentro tiene sus propiedades reactivas, analizando el objeto del cambio
- Queremos estar pendientes de product
- Si tengo el product.value, puedo poner solo product y no hace falta que coloque ()=> product
- Una vez tenga el producto, voy a querer llamar a la función resetForm que desestructuro del useForm
- Coloco el deep en true para que esté pendiente de las properties internas del objeto
  - Si tengo cambios en el usuario, mediante el deep está pendiente también de esos objetos anidados 
  - El inmediate en true es para que se ejecute tan pronto el componente es construido
- ProductView.ts

~~~js
const {values, defineField, errors, handleSubmit, resetForm} = useForm({
            validationSchema
        })

watch(product, ()=>{
        if(!product) return

        resetForm({
            values: product.value
        })
    }, {
        deep: true,
        inmediate: true 
    })
~~~

- Formateo la salida del código que estoy mostrando debajo en la pantalla para el desarrollo de los formularios
- Uso JSON.stringify y una etiqueta pre 
- **NOTA:** esto es solo para visualizar mejor el json del producto en pantalla y los errores
- 
- ProductView.vue

~~~html
<div class="grid grid-cols-2">
  <pre class="bg-blue-300">
    {{ JSON.stringify(values,null, 2) }}
  </pre>
  <pre class="bg-red-300">
    {{ JSON.stringify(errors, null, 2) }}
  </pre>
</div>
~~~

- Ahora habría que marcar las tallas existentes y darles un color más oscuro para que se vea que están marcadas y 
- Hay que poner los errores en castellano
- Deshabilitar el botón de guardar si no están todos los campos sin errores
- VeeValidate tiene sus propios componentes personalizados

## Indicador visual de tallas seleccionadas

- En ProductView, en los inputs Precio e inventario agrego flex-1 para evitar que el diseño se desordene
- ProductView.vue

~~~html
<div class="flex flex-row gap-3">
<div class="mb-4 flex-1">
    <label for="price" class="form-label">Precio</label>
    <CustomInput 
    v-model.number="price"
    v-bind="priceAttrs"
    :error="errors.price"
    />
</div>

<div class="mb-4 flex-1">
    <label for="stock" class="form-label">Inventario</label>
    <CustomInput 
    v-model.number="stock"
    v-bind="stockAttrs"
    :error="errors.stock"
    />
</div>
</div>
~~~

- Lo más sencillo para hacer lo de las tallas es crear una función que reciba la talla y nos regrese un valor booleano si la talla existe o no existe
- Si requiero solo la función en el template y no la voy a usar en el script setup, puedo definirla (la función/acción) en el return del setup()
- ProductView.ts

~~~js
export default defineComponent({

{...code}

return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,
            errors,
            images,
            sizes,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions
            onSubmit,
            toggleSize,
            hasSize: (size: string)=>{ //<------ AQUI!
                const currentSizes = sizes.value.map(size=>size.value) //aplano con .map

                return currentSizes.includes(size) //esto devuelve un booleano
            }
        }
})
~~~

- Para meter lógica de css le coloco un v-bind al class y entre llaves, primero las clases que siempre van a ir y en un objeto coloco la lógica
- Coloco también la lógica del bg-blue-100 para que las clases de css no compitan y no dejárselo al navegador
- ProductView.vue

~~~html
<div class="mb-4 flex-1">
<label for="sizes" class="form-label">Tallas</label>
<div class="flex">
    <button 
        v-for="size of allSizes"
        :key="size"
        @click="toggleSize(size)"
        type="button" 
        :class="['p-2 rounded w-14 mr-2 flex-1',{
            'bg-blue-500 text-white': hasSize(size),
            'bg-blue-100': !hasSize(size)

        }]">
        {{ size }}
    </button>
</div>
</div>
~~~

- En ProductView.vue, donde tenía nombre coloco el title para mostrar el nombre del producto

~~~html
  <div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Producto: <small class="text-blue-500">{{  title }}</small></h1>
    <hr class="my-4" />
  </div>
~~~

## Metadata del formulario

- Para deshabilitar el botón de guardar si el formulario no es válido necesito acceder a la metadata del formulario
- En el useForm puedo desestructurar meta
- ProductView.ts

~~~js
const {values, defineField, errors, handleSubmit, resetForm, meta} = useForm({
            validationSchema
        })
//regreso meta en el return del setup()
~~~

- Renderizo también meta en la pantalla de ProductView.vue para ver
- Uso col-span-2 para que ocupe dos espacios de mi grid


~~~html
<pre class="bg-green-200 p-2 col-span-2">
    {{ JSON.stringify(meta, null, 2) }}
</pre>
~~~

- Fuera del objeto JSON de producto aparecen estas propiedades (si no toco nada del formulario y lo dejo tal cual lo renderiza por primera vez con la data de producto)

~~~
"touched": false, // si toco algo del formulario esto cambia a true
"pending": false, //muestra si hay algñún procedimiento asíncrono procesándose
"valid": true,   // en true pasa todas las validaciones
"dirty": false   // cuando el formulario ha sido manipulado se pone en true
~~~

## Errores en español

- En src/config/yup.ts
- No hace falta colocar back tics para usar ${values} (le paso los valores)
~~~js
import * as yup from 'yup'

yup.setLocale({
    mixed: {
        default: 'No es válido',
        required: 'Este campo es requerido',
        oneOf: 'Debe de ser uno de los siguientes valores ${values}' //seleccionado algo fuera de la lista de valores
    }
})
~~~

- En el main.ts importo el archivo yup.ts

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import router from './router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './config/yup'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)
app.use(Toast)

app.mount('#app')
~~~

- Ahora si no coloco un título me aparece 'Este campo es requerido'
- En género, si no selecciono nada del select me devuelve 'Debe de ser uno de los siguientes valores' con men, women, kid
- Este es un ejemplo de la configuración típica de estos errores en un archivo para yup

~~~js
import * as yup from 'yup';

// Establecer el idioma de los mensajes de error en español
yup.setLocale({
  mixed: {
    default: 'No es válido',
    required: 'Este campo es requerido',
    oneOf: 'Debe ser uno de los siguientes valores: ${values}',
    notOneOf: 'No debe ser uno de los siguientes valores: ${values}',
    defined: 'Debe estar definido',
    notNull: 'No puede ser nulo',
    notType: 'Debe ser de tipo ${type}',
  },
  string: {
    length: 'Debe tener exactamente ${length} caracteres',
    min: 'Debe tener al menos ${min} caracteres',
    max: 'Debe tener como máximo ${max} caracteres',
    email: 'Debe ser un correo electrónico válido',
    url: 'Debe ser una URL válida',
    trim: 'No debe contener espacios al inicio o al final',
    lowercase: 'Debe estar en minúsculas',
    uppercase: 'Debe estar en mayúsculas',
    matches: 'Debe coincidir con el siguiente patrón: "${regex}"',
  },
  number: {
    min: 'Debe ser mayor o igual a ${min}',
    max: 'Debe ser menor o igual a ${max}',
    lessThan: 'Debe ser menor a ${less}',
    moreThan: 'Debe ser mayor a ${more}',
    positive: 'Debe ser un número positivo',
    negative: 'Debe ser un número negativo',
    integer: 'Debe ser un número entero',
  },
  date: {
    min: 'Debe ser posterior a ${min}',
    max: 'Debe ser anterior a ${max}',
  },
  array: {
    min: 'Debe tener al menos ${min} elementos',
    max: 'Debe tener como máximo ${max} elementos',
  },
});
~~~

- En el objeto de yup que he creado en en el ProductView.ts puedo sobreescribir mensajes de error

~~~js
const validationSchema = yup.object({
    title: yup.string().required('Este campo es necesario').min(2),
    slug: yup.string().required(),
    description: yup.string().required(),
    price: yup.number().required(),
    stock: yup.number().min(1).required(),
    gender: yup.string().required().oneOf(['men', 'women', 'kid']),
})
~~~

- Paso componentes finales de este módulo
- ProductView.vue

~~~vue
<template>
  <div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Producto: <small class="text-blue-500">{{  title }}</small></h1>
    <hr class="my-4" />
  </div>

  <form 
    @submit="onSubmit"
    class="grid grid-cols-1 sm:grid-cols-2 bg-white px-5 gap-5">
    <div class="first-col min-w-0">
      <!-- Primera parte del formulario -->
      <div class="mb-4">
        <label for="title" class="form-label">Título</label>
          <CustomInput 
          class="block w-full"
          v-model="title"
          v-bind="titleAttrs"
          :error="errors.title"
          />
      </div>

      <div class="mb-4">
        <label for="slug" class="form-label">Slug</label>
          <CustomInput 
          v-model="slug"
          v-bind="slugAttrs"
          :error="errors.slug"
          />
      </div>

      <div class="mb-4">
        <label for="description" class="form-label">Descripción</label>
       <CustomtextArea 
        v-model="description"
        v-bind="descriptionAttrs"
        :error="errors.description"
       />
      </div>

      <div class="flex flex-row gap-3">
        <div class="mb-4 flex-1">
          <label for="price" class="form-label">Precio</label>
            <CustomInput 
          v-model.number="price"
          v-bind="priceAttrs"
          :error="errors.price"
          />
        </div>

        <div class="mb-4 flex-1">
          <label for="stock" class="form-label">Inventario</label>
            <CustomInput 
          v-model.number="stock"
          v-bind="stockAttrs"
          :error="errors.stock"
          />
        </div>
      </div>

      <div class="mb-4 flex-1">
        <label for="sizes" class="form-label">Tallas</label>
        <div class="flex">
            <button 
                v-for="size of allSizes"
                :key="size"
                @click="toggleSize(size)"
                type="button" 
                :class="['p-2 rounded w-14 mr-2 flex-1',{
                  'bg-blue-500 text-white': hasSize(size),
                  'bg-blue-100': !hasSize(size)

                }]">
                {{ size }}
            </button>
        </div>
      </div>
    </div>

    <!-- Segunda columna -->
    <div class="first-col">
      <label for="stock" class="form-label">Imágenes</label>
      <!-- Row with scrollable horizontal -->
      <div class="flex p-2 overflow-x-auto space-x-8 w-full h-[265px] bg-gray-200 rounded">
        <div 
          v-for="image of images"
          :key="image.key"
          :alt="title"
        class="flex-shrink-0">
          <img :src="image.value" alt="imagen" class="w-[250px] h-[250px]" />
        </div>

        
      </div>
      <!-- Upload image -->
      <div class="col-span-2 my-2">
        <label for="image" class="form-label">Subir imagen</label>

        <input multiple type="file" id="image" class="form-control" />
      </div>

      <div class="mb-4">
        <label for="stock" class="form-label">Género</label>
        <select
          v-model="gender"
          v-bind="genderAttrs" 
          class="form-control">
          <option value="">Seleccione</option>
          <option value="kid">Niño</option>
          <option value="women">Mujer</option>
          <option value="men">Hombre</option>
        </select>
        <span class="text-red-400" v-show="errors.gender">
          {{ errors.gender }}</span>
      </div>

      <!-- Botón para guardar -->
      <div class="my-4 text-right">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  </form>

  <div class="grid grid-cols-2">
  <pre class="bg-blue-300">
    {{ JSON.stringify(values,null, 2) }}
  </pre>
  <pre class="bg-red-300">
    {{ JSON.stringify(errors, null, 2) }}
  </pre>
  <pre class="bg-green-200 p-2 col-span-2">
    {{ JSON.stringify(meta, null, 2) }}
  </pre>
</div>
</template>

<script src="./ProductView.ts" lang="ts"></script>

<style scoped>
    @reference 'tailwindcss'
.form-label {
  @apply block text-gray-700 text-sm font-bold mb-2;
}

.form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- ProductView.ts

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/vue-query"
import { defineComponent, watch, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useFieldArray, useForm} from 'vee-validate'
import * as yup from 'yup'
import CustomInput from "@/modules/common/components/CustomInput.vue"
import CustomTextArea from "@/modules/common/components/CustomTextArea.vue"

const validationSchema = yup.object({
    title: yup.string().required().min(2),
    slug: yup.string().required(),
    description: yup.string().required(),
    price: yup.number().required(),
    stock: yup.number().min(1).required(),
    gender: yup.string().required().oneOf(['men', 'women', 'kid']),
})

export default defineComponent({
    components:{
        CustomInput,
        CustomTextArea
    },
    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {values, defineField, errors, handleSubmit, resetForm, meta} = useForm({
            validationSchema
        })

        const {fields: images} = useFieldArray<string>('images')
        const {fields: sizes, remove: removeSize, push: pushSize} = useFieldArray<string>('sizes')

        const toggleSize = (size: string)=>{
            const currentSizes = sizes.value.map(size=>size.value)
            const hasSize = currentSizes.includes(size)

            if(hasSize){ //si existe lo elimino
                removeSize(currentSizes.indexOf(size)) //hay que mandarle un índice para poderlo eliminar
            }else{
                pushSize(size)
            }        
        }

        const onSubmit = handleSubmit((value)=>{
            console.log({value})
        })

        const [title, titleAttrs] = defineField('title')
        const [slug, slugAttrs] = defineField('slug')
        const [description, descriptionAttrs] = defineField('description')
        const [price, priceAttrs] = defineField('price')
        const [stock, stockAttrs] = defineField('stock')
        const [gender, genderAttrs] = defineField('gender')
        //TODO: defineArray para las tallas y las imagenes

        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })

        watch(product, ()=>{
            if(!product) return

            resetForm({
                values: product.value
            })
        }, {
            deep: true,
            immediate: true 
        })


        return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,
            errors,
            images,
            sizes,
            meta,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions
            onSubmit,
            toggleSize,
            hasSize: (size: string)=>{
                const currentSizes = sizes.value.map(size=>size.value)

                return currentSizes.includes(size) //esto devuelve un booleano
            }
        }
    }
})
~~~

- ProductsView.vue

~~~vue
<template>

<div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Productos</h1>
    <div class="py-8 w-full">
  <div class="shadow overflow-hidden rounded border-b border-gray-200">
    <table class="min-w-full bg-white">
      <thead class="bg-gray-800 text-white">
        <tr>
          <th class="w-10text-left py-3 px-4 uppercase font-semibold text-sm">Imagen</th>
          <th class="flex-1 text-left py-3 px-4 uppercase font-semibold text-sm">Título</th>
          <th class="w-28 text-left py-3 px-4 uppercase font-semibold text-sm">Precio</th>
          <th class="w-60 text-left py-3 px-4 uppercase font-semibold text-sm">Tallas</th>
        </tr>
      </thead>
    <tbody class="text-gray-700">
      <tr 
      v-for="(product, index) in products"
            :key="product.id"
            :class="{
                'bg-gray-100': index % 2 === 0 //coloco fondo gris en los pares
            }">
        <td class="text-left py-3 px-4">
            <img 
            class="h-10 w-10 object-cover"
            :src="product.images[0]" :alt="product.title" />
        </td>
        <td class="text-left py-3 px-4">
            <router-link 
                :to="`/admin/products/${product.id}`"
                class="hover:text-blue-500 hover:underline"
            >{{ product.title }}
            </router-link>
        </td>
        <td class="text-left py-3 px-4">
            <span class="bg-blue-200 text-blue-600 py-1 px-3 rounded-full text-xs">
                {{ product.price }}
            </span>
        </td>
        <td class="text-left py-3 px-4">
            {{ product.sizes.join(',') }}
        </td>
      </tr>
    </tbody>
    </table>
  </div>
  <ButtonPagination 
        :page="page"
        :has-more-data="!!products && products.length > 10"
    />
</div>    
</div>
</template>

<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue'
import { usePagination } from '@/modules/common/composables/use-pagination'
import { getProductsAction } from '@/modules/products/actions'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { watchEffect } from 'vue'

const queryClient = useQueryClient()
const {page} = usePagination()

const {data:products, isLoading} = useQuery({
  queryKey:['products', page],
  queryFn: ()=> getProductsAction(page.value),
})


watchEffect(()=>{
	queryClient.prefetchQuery({
		queryKey: ['products', {page: page.value +1}],
		queryFn: ()=> getProductsAction(page.value +1), 
	})
})
</script>
~~~

- CustomInput.vue

~~~vue
<template>
    <div>
        <input 
          :type="type" 
          :value="modelValue" 
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value ?? '')"
          @blur="$emit('blur')"
          :class="['form-control', {
              'border-red-500': error
          }]" />
        <span 
          class="text-red-400"
          v-if="error">{{ error}}</span>
    </div>
</template>

<script lang="ts" setup>
    interface Props{
        modelValue?: string | number
        error?: string
        type?: 'text' | 'number'
    }

    withDefaults(defineProps<Props>(),{
        type: 'text'
    })

    defineEmits(['update:modelValue', 'blur'])

</script>

<style scoped>
 @reference 'tailwindcss'

 .form-label {
  @apply block text-gray-700 text-sm font-bold mb-2;
}

.form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}

</style>
~~~

- CustomtextArea.vue

~~~js
<template>
    <div>
        <textarea 
          :value="modelValue" 
          @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement)?.value ?? '')"
          @blur="$emit('blur')"
          :class="['form-control',{
              'border-red-500': error
          }]"></textarea>
        <span 
          class="text-red-400"
          v-if="error">{{ error}}</span>
    </div>
</template>

<script lang="ts" setup>
    interface Props{
        modelValue?: string | number
        error?: string

    }

    defineProps<Props>()


    defineEmits(['update:modelValue', 'blur'])

</script>

<style scoped>
 @reference 'tailwindcss'

 :host {
  display: block;
  width: 100%;
}

 .form-control {
  @apply shadow h-32 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none
 }
  </style>
~~~


- ProductCard.vue

~~~vue
<template>
    <article class="rounded-xl bg-white p-3 shadow-lg hover:shadow-xl hover:transform hover:scale-105 duration-300 ">
      <a href="#">
        <div class="relative flex items-end overflow-hidden rounded-xl">
          <img 
          class="h-[250px] object-cover"
          :src="product.images[0]" :alt="product.title" />
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

- products/actions/
- get-products.action.ts

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

- get-product-image.action.ts

~~~js
export const getProductImageAction =(imageName: string): string=> {

    return imageName.includes('http')
    ? imageName
    : `${import.meta.env.VITE_TESLO_API_URL}/files/product/${imageName}`
}
~~~

- get-product-by-id.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product } from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"
import { isAxiosError } from "axios"

export const getProductById =async (id: string)=>{
    
    //TODO: pensar la creación de un nuevo producto
    
    try {
        const {data} = await tesloApi.get<Product>(`/products/${id}`)
        
        
        return{
            ...data,
            images: data.images.map(getProductImageAction)
        }
    } catch (error) {
        console.log(error)

        throw new Error('Error obteniendo el producto')
    }
}
~~~

-------

