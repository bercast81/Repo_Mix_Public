# Vue Herrera - Slots y DaisyUI

- Nos vamos a enfocar en trabajar con los slotes y DaisyUI, aunque Daisy no sea la mejor tecnología
- Un slot nos permite desde un componente padre mandar componentes hijos dentro de la definición del componente padre
- Esto ayuda a crear componentes reutilizables
- Este módulo nos encamina para cuando lleguemos a trabajar con Pinia, poder explicarlo basado en esta aplicación
- Trabajaremos con modales
- Es un app de proyectos

## ProjectsApp

- Creamos un proyecto con npm create vue@latest
- name: projects-app
- TypeScript: si
- JSX: no
- Vue Router: si
- Pinia: si
- Vitest: si
- E2E: no
- ESLint: si
- Prettier: si
- Instalo Tailwind
- En App.vue borro todo lo que hay y pego únicamente el RouterView

~~~vue
<template>
  <RouterView />
</template>
~~~

- Puedo colocar el semicollon en true y el trailingComa en all en el .prettierc.json, simplemente por el estilo. ASí cuando guarde lo formateará siempre igual

~~~json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
~~~

- La estructura de directorios será
- modules
- modules/common 
  - modules/common/components/ (donde irá el navbar, sidebar, tendré todo lo que s compartido que no tiene una relación directa con los otros módulos)
- modules/projects (agregar proyectos, tareas, etc)
  - modules/projects/layouts
  - modules/projects/components
  - modules/projects/views
- No hay carpeta de composables, porque el ejercicio está enfocado a Pinia y como maneja la data
    - Pinia nos permite agregar lógica en las acciones
- Con esta estructura podemos empezar, se irá ampliando a medida que avancemos

## Librería de componentes DaisyUI

- Instalemos esta librería de componentes para Tailwind (se necesita tener Tailwind previamente instalado)

> npm i -D daisyui@latest

- Hay que añadir esta linea a styles.css (que está importado en el main)

~~~css
@import "tailwindcss";
@plugin "daisyui";
~~~

- Para probar que la configuración ha ido bien, puedo copiar todos los botones de una muestra desde la web

> https://daisyui.com/components/button/

- En App.vue los renderizo

~~~vue
<template>
  <button class="btn btn-neutral">Neutral</button>
  <button class="btn btn-primary">Primary</button>
  <button class="btn btn-secondary">Secondary</button>
  <button class="btn btn-accent">Accent</button>
  <button class="btn btn-info">Info</button>
  <button class="btn btn-success">Success</button>
  <button class="btn btn-warning">Warning</button>
  <button class="btn btn-error">Error</button>
  <RouterView />
</template>
~~~

- Fácilmente se pueden crear, poniendo solo btn- (y Ctrl+space para ver las opciones)

## Estructura de los componentes

- Vamos a ir a componentes (de la web de DaisyUI) constantemente

> https://daisyui.com/components/

- En modules/projects/layouts/ProjectsLayout.vue

~~~vue
<template>
  <div class="flex flex-col ">
    <!-- Top Menu-->
    <main>
        <!--Side Menu-->
        
        <RouterView />
    </main>  
  </div>
</template>
~~~

- Vamos con el Top Menu, como es un elemento común que quiero reutilizar en toda mi aplicación lo colocaremos en modules/common/components

~~~vue
<template>
    <div class="flex items-center justify-between p-4 bg-base-200">
        <h2 class="text-lg font-bold text-blue-600">Notion</h2>
    </div>
</template>
~~~

- Lo renderizo en ProjectsLayout (donde estaba el comment de Top Menu)
  - Puedo usar TopMenu o top-menu
- No vemos nada en pantalla porque hay que redireccionar el Landing en el Layout
- Podemos cargarlo de manera perezosa o si va a ser algo que siempre vamos a necesitar simplemente usar el componente
- router/index.ts

~~~js
import ProjectsLayout from '@/modules/projects/layouts/ProjectsLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: ProjectsLayout
    }
  ],
})

export default router
~~~

- Toca el SideMenu. Lo creo en modules/projects/components/SideMenu.vue

~~~vue
<template>
    <aside class="bg-base-200 w-72 min-h-screen">
        <h2 class="text-lg font-bold mx-4">Proyectos</h2>
        <p class="text-sm text-gray-500 mx-4">No hay proyectos</p>
    </aside>
</template>
~~~

- Lo coloco dentro del main del Layout (donde estaba el comment SideMenu)
- Se recomienda usar como una etiqueta semántica html (top-menu) antes que TopMenu

~~~vue
<template>
  <div class="flex flex-col ">
    <top-menu />
    <main>
        <side-menu />
        
        <router-view />
    </main>  
  </div>
</template>

<script setup lang="ts">
import TopMenu from '@/modules/common/components/TopMenu.vue';
import SideMenu from '../components/SideMenu.vue';

</script>
~~~

- Usemos un menú llamado Collapsable submenu, lo pego en SideMenu

~~~vue
<template>
  <aside class="bg-base-200 w-72 min-h-screen">
    <h2 class="text-lg font-bold mx-4">Proyectos</h2>
    <p class="text-sm text-gray-500 mx-4">No hay proyectos</p>
    <!--Menu-->
     <ul class="menu rounded-box w-56">
        <li><a>Item 1</a></li>
        <li>
            <details open>
            <summary>Parent</summary>
            <ul>
                <li><a>Submenu 1</a></li>
                <li><a>Submenu 2</a></li>
                <li>
                <details open>
                    <summary>Parent</summary>
                    <ul>
                    <li><a>Submenu 1</a></li>
                    <li><a>Submenu 2</a></li>
                    </ul>
                </details>
                </li>
            </ul>
            </details>
        </li>
        <li><a>Item 3</a></li>
        </ul>
    </aside>
</template>
~~~

- DaisyUI hace que funcione sin JS
- Los elementos como summary que no existen, son como si fueran divs, solo que DaisyUI ya sabe que estilos aplicarle
- No hay que importarlos

## Estructura de projects view

- Trabajemos con la pantalla que se verá en el centro que es un listado de todos nuestros proyectos
- Buscamos la table with a row that highlights on hover 
- modules/projects/views/ProjectsView.vue
- Los views se incrustan dentro de los layouts
- Le coloco un w-full al div para que me ocupe toda la pantalla de ancho
- Solo dejo una fila, usaremos un v-for para listarlas
- ProjectsView.vue

~~~vue
<template>
    <div class="overflow-x-auto w-full">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th></th>
        <th>Proyectos</th>
        <th>Tareas</th>
        <th>Avances</th>
      </tr>
    </thead>
    <tbody>
      <!-- row 1 -->
      <tr>
        <th>1</th>
        <td>Cy Ganderton</td>
        <td>Quality Control Specialist</td>
        <td>Blue</td>
      </tr>
    </tbody>
  </table>
</div>
</template>
~~~

- Será una ruta hija en el router
- router/index.ts

~~~js
import ProjectsLayout from '@/modules/projects/layouts/ProjectsLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: {name: 'projects'},
      component: ProjectsLayout,
      children:[
        {
          path:'projects',
          name: 'projects',
          component: ()=>import('@/modules/projects/views/ProjectsView.vue')
        }
      ]
    }
  ],
})

export default router
~~~

- Aparece la tabla abajo porque me faltan unas clases de tailwind en el main del Layout (flex flex-row)
- ProjectsLayout.vue

~~~vue
<template>
  <div class="flex flex-col">
    <top-menu />
    <main class="flex flex-row">
        <side-menu />
        
        <RouterView />
    </main>  
  </div>
</template>

<script setup lang="ts">
import TopMenu from '@/modules/common/components/TopMenu.vue';
import SideMenu from '../components/SideMenu.vue';

</script>
~~~

- Voy a querer un botón flotante. Busco circle button. Lo coloco abajo de la tabla
- Añado la clase btn-secondary
- Busco en svgrepo.com otro svg, Add Circle SVG Vector (se puede editar el svg en la página, de edit svg puedo hacer un copy)
- Le coloco la clase fixed y uso bottom-10 right-10 para situarlo en la esquina inferior derecha

~~~vue
<template>
<div class="overflow-x-auto w-full">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th></th>
        <th>Proyectos</th>
        <th>Tareas</th>
        <th>Avances</th>
      </tr>
    </thead>
    <tbody>
      <!-- row 1 -->
      <tr>
        <th>1</th>
        <td>Cy Ganderton</td>
        <td>Quality Control Specialist</td>
        <td>Blue</td>
      </tr>
    </tbody>
  </table>
  <button class="btn btn-circle btn-secondary fixed bottom-10 right-10">
    <svg viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" 
    stroke-linecap="round" 
    stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier"> 
        <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
        <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
    </g>
    </svg>
</button>
</div>
</template>
~~~

- Ahora si, vamos con el código para que funcione

## Botón flotante con Slots

- Separemos el código del botón flotante en un componente independiente
- modules/common/components/FabButton.vue

~~~vue
<template>
      <button class="btn btn-circle btn-secondary fixed bottom-10 right-10">
    <svg viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" 
    stroke-linecap="round" 
    stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier"> 
        <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
        <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
    </g>
    </svg>
</button>
</template>
~~~

- Lo renderizo en ProjectsView, debajo de la tabla, (después del div)
- El FabButton va a requerir cierta personalización, la emisión de los eventos, la posición quiero darla basada en unas properties
- Definamos el script setup de FabButton
- Defino la interfaz de las props. Si quiero un valor por defecto uso la función with defaults, le paso el defineProps tipado y en un objeto seteo la propiedad por defecto
- Como le voy a poner una propiedad por defecto marco como opcional position en la interfaz
- Creo las clases dentro de la etiqueta style con la palabra scoped para que solo afecte a este componente
- Para usar las clases de manera condicional uso v-bind con class y encierro las clases dentro de corchetes
- Fuera de las clases por defecto le paso la prop

~~~vue
<template>
      <button :class="['btn btn-circle btn-secondary fixed', position]">
    <svg viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" 
    stroke-linecap="round" 
    stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier"> 
        <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
        <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round"></path> 
    </g>
    </svg>
</button>
</template>

<script setup lang="ts">

interface Props{
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

withDefaults(defineProps<Props>(), {
    position: 'bottom-right'
})
</script>

<style scoped>
@reference 'tailwindcss'

.top-left{
    @apply top-10 left-10;
}
.top-right{
    @apply top-10 right-10;
}
.bottom-left{
    @apply bottom-10 left-10;
}
.bottom-right{
    @apply bottom-10 right-10;
}

</style>
~~~

- El componente no me pide la property, porque la he marcado como opcional y he setado bottom-right por defecto con withDefaults - - Puedo cambiar la posición para ver si funciona

~~~js
<fab-button position="bottom-left"/>
~~~

- Si quiero personalizar el icono (para hacerlo más reutilizable) ¿cómo lo hago?
- Cómo recibo el children del componente? es decir, cómo recibo este Hola mundo? (el children)

~~~js
<fab-button>
  <span>Hola mundo</span>
</fab-button>
~~~

- Usando el componente global slot
- Borro el svg de FabButton y coloco el slot
- Se puede usar con autocierre o como etiqueta con cierre normal

~~~vue
<template>
  <button :class="['btn btn-circle btn-secondary fixed', position]">
    <slot />
  </button>
</template>
~~~

- Ahora veo Hola mundo en el botón
- Le puedo pasar el svg, para hacerlo más bonito en modules/common/icons/AddCircle.vue

~~~vue
<template>
  <svg 
     viewBox="0 0 24 24" 
     fill="none" 
     xmlns="http://www.w3.org/2000/svg">
     <g id="SVGRepo_bgCarrier" 
     stroke-width="0"></g>
     <g id="SVGRepo_tracerCarrier" 
     stroke-linecap="round" 
     stroke-linejoin="round"></g>
     <g id="SVGRepo_iconCarrier"> 
        <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
        stroke="#1C274C" stroke-width="1.5" stroke-linecap="round">
        </path> 
        <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" 
        stroke="#1C274C" 
        stroke-width="1.5" 
        stroke-linecap="round">
        </path> 
    </g>
  </svg>
</template>
~~~

- Ahora puedo pasarle el componente a fab-button

~~~js
<fab-button><add-circle /></fab-button>
~~~

- También podríamos usar una property para hacer esto
- Yo voy a querer saber que se hizo clici en el botón, uso defineEmits (va a emitir un 'click')
- Cuando haga click (@click es el on-click) emitirá el evento 'click' con $emit('click')

~~~vue
<template>
  <button 
  :class="['btn btn-circle btn-secondary fixed', position]"
  @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">

interface Props{
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

withDefaults(defineProps<Props>(), {
    position: 'bottom-right'
})

defineEmits(['click'])
</script>

<style scoped>
@reference 'tailwindcss'

.top-left{
    @apply top-10 left-10;
}
.top-right{
    @apply top-10 right-10;
}
.bottom-left{
    @apply bottom-10 left-10;
}
.bottom-right{
    @apply bottom-10 right-10;
}

</style>
~~~

- Ahora en el fab-button tengo el evento @click

~~~vue
<fab-button @click="console.log('clicked')">
      <add-circle />
</fab-button>
~~~

## Modals sin slots

- Al tocar el fab-button vamos a mostrar un modal que me sirva para capturar el valor del nuevo poroyecto para empezar a crearlo
- Busco en DaisyUI el modal Dialog modal
- Copio a partir del dialog (no desde el button) para implementar la lógica con Vue
- modules/common/components/InputModal.vue

~~~vue
<template>
    <dialog class="modal"> <!--si le añado open se muestra el modal-->
  <div class="modal-box">
    <h3 class="text-lg font-bold">Hello!</h3>
    <p class="py-4">Press ESC key or click the button below to close</p>
    <div class="modal-action">
      <form method="dialog">
        <!-- if there is a button in form, it will close the modal -->
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
</template>
~~~

- Lo renderizo encima del fab-button en ProjectsView.vue
- Para que se vea el modal, tengo que añadirle el atributo open a dialog
- Le coloco un v-bind al open y le asigno un la prop open, de la que depende el modal para estar visible o no
- Si el button es de type button no cierra el modal, si es de tipo submit (para la propagación del formulario), si cierra
- Si no se especifica, por defecto es de tipo submit
- Creo un div de toda la pantalla para bloquear el fondo
- En las props necesito el open como boolean pues es la variable de control
- El modal también necesita emitir la data del input, por lo que uso defineEmits, y emitir un close para cerrar 
- Creo la variable reactiva inputValue y se la paso con v-model al input
- En el form usamos @submit y le pasamos el valor del formulario
  - Uso .prevent para evitar la propagación del formulario (para que no haga un refresh el navegador)
- InputModal.vue

~~~vue
<template>
    <dialog class="modal" :open="open">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Hello!</h3>
    <p class="py-4">Press ESC key or click the button below to close</p>
    <div class="modal-action flex flex-col">
      <form method="dialog" @submit.prevent="submitValue">
        <input
        v-model="inputValue"
        type="text" 
        placeholder="Nombre del proyecto"
        class="input input-bordered input-primary w-full flex-1"
        >
        <div class="flex justify-end mt-5 mr-4">
            <button class="btn">Close</button>
            <button type="submit" class="btn btn-primary">Aceptar</button>
        </div>
      </form>
    </div>
  </div>
</dialog>
<div class="modal-backdrop fixed top-0 left-0 z-10 bg-black opacity-40 w-screen h-screen">
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';


    interface Props{
        open: boolean //siempre la necesito porque es la variable de control
    }

    defineProps<Props>()

    const emits= defineEmits<{
        close: [void], //close no emite nada
        value: [text: string] //value emite un text de tipo string
    }>()

    const inputValue= ref('')

    const submitValue=()=>{
        if(!inputValue.value){
            //foco en el input
        } 

        emits('value', inputValue.value.trim()) //emito el valor
        emits('close')

        inputValue.value='' //reseteo el inputValue
    }
</script>
~~~

## Funcionalidad del modal


- Ahora el modal no se cierra porque no hay una propagación del formulario
- Quiero que el foco del elemento aparezca cuando le doy a Aceptar para que se ilumine la caja de texto
- Creo inputRef, lo inicio en null y lo tipo 

~~~js
const inputRef= ref<HTMLInputElement | null>(null)
~~~

- Se lo coloco al input con ref="inputRef". No es necesario ponerle los : a ref (:ref). Es el único elemento que no lo necesita
- Cuando se monta el componente ya tenemos acceso a su referencia (el input)
- Lo usaré para poner el foco en la caja de texto cuando no haya un valor

~~~js
const inputRef= ref<HTMLInputElement | null>(null)

const submitValue=()=>{
    if(!inputValue.value){
        inputRef.value?.focus()
        return
    } 

    emits('value', inputValue.value.trim()) //emito el valor
    emits('close')

    inputValue.value='' //reseteo el inputValue
}
~~~

- La funcionalidad de abrir y cerrar el modal depende de nuestras props (con open)
- En el componente padre (ProjectsView.vue) definimos una variable reactiva modalOpen con false por defecto
- Se la paso al open con un v-bind para indicarle que no es un string sino una variable
- Cuando clicamos el FabButton, cambiamos el modalOpen a true

~~~vue
<template>
{...code}
  <input-modal :open="openModal" />
    <fab-button @click="openModal = true">
      <add-circle />
    </fab-button>
</template>

<script setup lang="ts">
import FabButton from '@/modules/common/components/FabButton.vue';
import InputModal from '@/modules/common/components/InputModal.vue';
import AddCircle from '@/modules/common/icons/AddCircle.vue';
import { ref } from 'vue';

const openModal= ref(false)
</script>
~~~

- En el InputModal usamos el v-if para mostrar el div con el background oscuro translúcido usando la prop open
- Cuando clico el botón de close, debo llamar al close que tiene que cambiar el valor de openModal para cerrar el modal y el fondo
- Usando $emit podría bastar

~~~vue
<button @click="$emit('close')" class="btn">Close</button>
~~~

- Y recibir el evento close desde el padre ProjectView

~~~vue
<input-modal :open="openModal" @close="openModal = false"/>
  <fab-button @click="openModal = true">
    <add-circle />
  </fab-button>
~~~

- Ahora necesitamos recibir el valor del input, creo una función onNewValue en ProjectsView.vue
- Se lo paso al evento value que definí con defineEmits
- Si el evento que emite el value simplemento lo pasamos como argumento a la función, podemos mandar la función solo por referencia
~~~vue
<template>
{...code}

  <input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="onNewValue" 
  />
    <fab-button @click="openModal = true">
      <add-circle />
    </fab-button>
</template>

<script setup lang="ts">
import FabButton from '@/modules/common/components/FabButton.vue';
import InputModal from '@/modules/common/components/InputModal.vue';
import AddCircle from '@/modules/common/icons/AddCircle.vue';
import { ref } from 'vue';

const openModal= ref(false)

const onNewValue=(projectName: string)=>{
  console.log(projectName)
}
</script>
~~~

- En el InputModal.vue recuerda que emito el inputValue.value con el evento value y que el input tiene el inputValue en el v-model

~~~js
//uso el v-model para guardar el valor del input en una variable
<input
    ref="inputRef"
    v-model="inputValue"
    type="text" 
    placeholder="Nombre del proyecto"
    class="input input-bordered input-primary w-full flex-1"
    >

// emito el evento que he definido antes con defineEmits pasandole el valor
  
  const emits= defineEmits<{
        close: [void], //close no emite nada
        value: [text: string] //value emite un text de tipo string
    }>()

  emits('value', inputValue.value.trim()) //emito el valor (inputValue es el text)
~~~

- Ahora si le doy al botón abre el modal, pone el resto de la pantalla  en negro bloqueándolo, si escribo en la caja de texto Hola mundo, lo imprime en consola, cierra el modal y cierra el fondo. Si aprieto el botón de close también cierra el modal
- Puedo personalizar el placeholder del modal agregando la prop en la interfaz, no hace falta usar un v-bind (:placeholder) porque le paso un string

~~~js
interface Props{
      open: boolean, //siempre la necesito porque es la variable de control
      placeholder?: string
  } 

//solo tengo que pasarle la prop al modal
 <input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="onNewValue"
  placeholder="Escribe aquí tu apellido"
  />
~~~

- Hagamos lo mismo con el título y subtítulo del modal
- Puedo usar v-if para hacer el subtitle opcional
- InputModal.vue

~~~vue
<template>
    <dialog id="my_modal_1" class="modal" :open="open">
  <div class="modal-box">
    <h3 class="text-lg font-bold">{{ title }}</h3>
    <p v-if="subTitle" class="py-4">{{ subtitle }}</p>
    <div class="modal-action flex flex-col">
      <form method="dialog" @submit.prevent="submitValue">
        <input
        ref="inputRef"
        v-model="inputValue"
        type="text" 
        placeholder="Nombre del proyecto"
        class="input input-bordered input-primary w-full flex-1"
        >
        <div class="flex justify-end mt-5 mr-4">
            <button @click="$emit('close')" class="btn">Close</button>
            <button type="submit" class="btn btn-primary">Aceptar</button>
        </div>
      </form>
    </div>
  </div>
</dialog>
<div 
v-if="open"
class="modal-backdrop fixed top-0 left-0 z-10 bg-black opacity-40 w-screen h-screen">
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';


    interface Props{
        open: boolean, //siempre la necesito porque es la variable de control
        placeholder?: string,
        title: string,
        subtitle?: string
    }

    defineProps<Props>()

    const emits= defineEmits<{
        close: [void], //close no emite nada
        value: [text: string] //value emite un text de tipo string
    }>()

    const inputValue= ref('')
    const inputRef= ref<HTMLInputElement | null>(null)

    const submitValue=()=>{
        if(!inputValue.value){
            inputRef.value?.focus()
            return
        } 

        emits('value', inputValue.value.trim()) //emito el valor
        emits('close')

        inputValue.value='' //reseteo el inputValue
    }
</script>
~~~

- Ahora le paso el titulo y el subtitulo como string en las props desde el padre ProjectsView

~~~js
<input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="onNewValue"
  title="Añade aquí tu proyecto"
  subtitle="Desde aquí puedes añadir tu proyecto"
  placeholder="Nombre del proyecto"
  />
~~~

## named Slots - Slots con nombre

- Un caso típico de Slots con nombre es un modal, donde tenemos un header, un cuerpo y un footer con acciones (los botones)
- Creo modules/common/components/CustomModal.vue
- Le pego el código del modal de DiasyUI sin el button (a partir del dialog)
- open es lo que hace que esté visible el componente, uso las props con el withDefaults para setear open como false por defecto
- Uso el v-bind en open para pasarle la prop
- Le coloco el componente que creé para dejar el fondo de la pantall opaco. Lo coloco fuera del dialog para que no afecte el modal

~~~vue
<template>
 <dialog class="modal" :open="open">
  <div class="modal-box">
    <!--Header-->
    <h3 class="text-lg font-bold">Hello!</h3>
    <p class="py-4">Press ESC key or click the button below to close</p>
    <!--Body-->
    <!--Footer/Actions-->
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>
  <div 
    v-if="open"
    class="modal-backdrop fixed top-0 left-0 z-10 bg-black opacity-40 w-screen h-screen">
  </div>
</template>


<script setup lang="ts">
    interface Props{
        open: boolean
    }
    withDefaults(defineProps<Props>(),{
        open: false
    })
</script>
~~~

- Lo llamos en ProjectView, añado un nuevo botón que usa la variable reactiva customOpenModal en el on-click

~~~vue
<template>
{...code}
<custom-modal :open="customOpenModal"/>

<fab-button @click="customOpenModal = true" position="bottom-left">
    <add-circle />
  </fab-button>
</template>

<script>
const customOpenModal=ref(false)
{...code}
</script>
~~~

- Hay que quitar el fondo opaco cuando cierro. No lo vamos a controlar con un emit, sino de otra manera
- Mandaremos las piezas desde ProjectsView a nuestro componente CustomModal
- Dividamos el componente CustomModal en header, body, y footer actions
- Puedo especificarle un nombre al slot

~~~vue
<template>
 <dialog class="modal" :open="open">
  <div class="modal-box">
    <!--Header-->
    <div class="border-b border-b-blue-500">
         <h1 class="text-lg font-bold">Header</h1>
         <slot name="header" />
    </div>
    <!--Body-->
    <div class="my-5">
        <h1>Body</h1>
        <slot name="body" />
    </div>
    <!--Footer/Actions-->
    <div class="modal-action">
        <div class="border-t border-t-blue-500 pt-2">
            <h1>Footer actions</h1>
            <slot name="footer" />
        </div>
    </div>
  </div>
</dialog>
<div 
  v-if="open"
  class="modal-backdrop fixed top-0 left-0 z-10 bg-black opacity-40 w-screen h-screen">
</div>
</template>


<script setup lang="ts">
    interface Props{
        open: boolean
    }
    withDefaults(defineProps<Props>(),{
        open: false
    })
</script>
~~~

- Solo tengo que mandarle el contenido desde el padre usando el template numeral y el nombre del slot

~~~js
<custom-modal :open="customOpenModal">
  <template #header>
    <h1 class="text-3xl">Titulo del modal</h1>
  </template>
</custom-modal>
~~~





