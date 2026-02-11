# 10 Vue Herrera - Pinia (Gestor de estado)

- Trabajar con el store en Pinia no es distinto que trabajar con un composable. con la excepción que la función watch no está
- Imagina una piña, la piel está compuesta por hexágonos. Esos hexágonos serían los stores de manera independiente
- Desde las devtools se puede ver el store (desde el icono de piña)
  - Desde las devtools se pueden borrar estados
- En cada proyecto yo puedo añadir infinitas tareas a completar
- Tendremos una barra de progreso (Avance)
- En este ejercicio no uniremos varios stores, pero se pueden unir

## Instalación de Pinia

- Pinia es básciamente un composable, solo que la función de inicialización es un poco diferente
- No se hace con un composable sino con Pinia porque nos da ciertos superpoderes

> npm i pinia

- main.ts

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

- Pinia es perezoso por defecto (no lo carga si no se utiliza)

## Projects Store

- Se aconseja ponerle use al principio y Store al final del store
- Prefiero tener los stores acoplados a los módulos
- Si regreso projects como computed podría hacer la propiedad de solo lectura, ya que usando solo ref se puede modificar
- src/modules/projects/stores//projects.store.ts

~~~js
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Project } from "../interface/project.interface";

export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref<Project[]>([])

    return {projects}
})
~~~

- La interfaz de proyectos en modules/projects/interface/projects.interface.ts

~~~js
export interface Project{
    id: string
    name: string
    tasks: Task[]
}

export interface Task{
    id: string
    name: string
    completedAt?: Date 
}
~~~

- ¿Cómo uso el store?
- Me creo un estado incial (initialLoad)

~~~js
import { defineStore } from "pinia";
import { ref } from "vue";
import type { Project } from "../interface/project.interface";

const initialLoad = (): Project[]=>{
    return [
        {
            id: '1',
            name: 'project 1',
            tasks:[]
        },
        {
            id: '2',
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref<Project[]>(initialLoad())

    return {projects}
})
~~~

- Para usarlo voy al script setup de modules/projects/views/ProjectView.vue

~~~js
const projectStore = useProjectsStore()
~~~

- Con eso ya me aparece el estado en las vueDevtools
- Una vez hago referencia al store ya se inicializa y luego hace referencia a la data que hay (es como un singleton)

## Usando el store


- Hay varias maneras de consumir nuestro store
- Si uso la desestructuración se pierde la reactividad del store

~~~js
//se pierde la reactividad
const {projects} = useProjectsStore()
~~~

- Para aplicar desestructuración se debe usar storeToRefs

~~~js
const {projects} = storeToRefs(useProjectsStore())
~~~

- Pero también se puede usar tal cual lo teníamos tal que así
- Uso el componente progress de DaisyUI para la barra de avance, de momento con el avance en duro (value=40)
- ProjectView.vue

~~~js
//script setup
const projectStore = useProjectsStore()

//template
 <tbody>
    <!-- row 1 -->
    <tr v-for="(project,index) in projectStore.projects" :key="project.id">
    <th>{{ index+1 }}</th>
    <td>{{ project.name }}</td>
    <td>{{ project.tasks.length }}</td>
    <td>
        <progress class="progress progress-primary w-56" value="40" max="100"></progress>
    </td>
    </tr>
</tbody>
~~~

- Desde las devTools puedo cambiarle el nombre al proyecto, añadir una task, etc
  - Con el tasks.length, si añado una tarea aparece 1 en Tareas
- El estado es volátil. Para hacerlo persistente lo leeriamos de un backend o grabar en el localStorage
- Podemos crear una propiedad computada para evitar que desde cualquier otro lugar se puedan realizar modificaciones del store
- En el ProjecstView script setup esto funciona

~~~vue
<template>
{...code}
  <input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="onNewValue"
  title="Añade aquí tu proyecto"
  subtitle="Desde aquí puedes añadir tu proyecto"
  placeholder="Nombre del proyecto"
  />
</template>

<script>
const openModal= ref(false)
const customOpenModal=ref(false)

const projectStore = useProjectsStore()

const onNewValue=(projectName: string)=>{
  projectStore.projects.push({
    id: '3',
    name: projectName,
    tasks: []
  })
}
</script>
~~~

- Hay varios problemas en hacerlo de esta manera
  - Puede ser que el id sea una función UUID, o se tiene que crear basado en cierta estructura
  - Yo no quiero que cualquiera pueda llegar a mi store y modificarlo de esa manera
  - Podemos trabajar con una propiedad computada
- Ya no ocupo regresar los proyectos, así me aseguro de que los proyectos solo puedan ser accedidos y modifcados dentro del store
  - Es como crearse una propiedad privada de solo lectura (en teoría. voy a poder insertar) 
- projects.store.ts

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "../interface/project.interface";

const initialLoad = (): Project[]=>{
    return [
        {
            id: '1',
            name: 'project 1',
            tasks:[]
        },
        {
            id: '2',
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref<Project[]>(initialLoad())

    return {
        // Properties
        //projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value])
        
        // Actions
    }
})
~~~

- En ProjectView.vue se está quejando porque ya no tengo .projects sino .projectList
- Ahora si escribo en el input Nuevo Proyecto sigue publicándolo, no debería poder usar el .push
- Esta es la manera en la que vamos a crear nuestros getters (con propiedades computadas)
- Podemos crear la función para agregar proyectos en el store
- Como todo esto está pasando por referencia gracias al computed, vamos a tener la actualización
- Instalo uuid para empezar a trabajar con UUID

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "../interface/project.interface";

const initialLoad = (): Project[]=>{
    return [
        {
            id: '1',
            name: 'project 1',
            tasks:[]
        },
        {
            id: '2',
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref<Project[]>(initialLoad())

    return {
        // Properties
        //projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value])
        // Actions
    }
})
~~~

- Esta acción es la que voy a usar en lugar de onNewValue
- ProjectsView.vue

~~~js
 <input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="projectStore.addProject"
  title="Añade aquí tu proyecto"
  subtitle="Desde aquí puedes añadir tu proyecto"
  placeholder="Nombre del proyecto"
  />
~~~

- Como el value está emitiendo un string y lo que espera es un string, puedo passarle la función por referencia
- Trabajamos con .push porque no tenemos un backend, sino serían tareas asíncronas

## Colocar foco en el modal

- Quiero que al abrir el modal se ponga automáticamente el foco en la caja de texto
- Quiero poner el foco tan pronto cambie el openModal a true (el componente ya está montado de antes, por lo que las funciones del ciclo de vida no me servirían)
- watch es para estar pendiente de una propiedad en concreto (en este caso las props que es donde tengo open)
  - En el callback tengo las nuevas props, puedo desestructurar el open
- watchEffect sirve para estar pendiente de las propiedades reactivas que tiene el componente
- Uso nextTick de Vue para darle tiempo a la referencia a tomar el componente, ya que Vue va muy rápido (!)
- modules/common/components/InputModal.vue

~~~js
//script setup
   const props= defineProps<Props>()

    watch(props, async ({ open }) => {
      if (open) {
      await nextTick();
      inputRef.value?.focus();
    }
});
~~~

## Store to LocalStorage

- Usaremos el LocalStorage porque no tenemos backend+
- Podemos hacerlo todo en el initialLoad del store para obtener el estado del localStorage y retornarlo, luego usar $subscribe con el store para guardar el estado incial
- Pero hay un paquete de npm llamado **pinia-plugin-persistedstate**
- Solo hay que poner en la definición del store, después de las llaves, el persist: true
- Usaremos **@vueuse/core**, es más multiuso

> https://vueuse.org/

- Hago uso de la función useLocalStorage, le pongo el tipado (se lo quito a ref)
- projects.store.ts

~~~js
export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref( useLocalStorage<Project[]>('projects', initialLoad()))

    const addProject =(name: string) =>{
        if(name.length === 0) return

        projects.value.push({
            id: uuidv4(),
            name,
            tasks: []
        })
    }
    return {
        // Properties
        //projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        
        // Actions
        addProject
    }
})
~~~

- Puedo inicializarlo como un arreglo vacío, es totalmente válido

~~~js
 const projects = ref( useLocalStorage<Project[]>('projects', []))
~~~

- Ahora si recargo el navegador la información es persistente
- VueUse tiene muchas utilidades muy útiles, que mezclado con los composables lo hacen muy potente

## Menú lateral

- Si no hay proyectos debería aparecer "No hay proyectos"
- Y si hay proyectos debería aparecer el menú 
- Para facilitar el ejercicio retorno projects del store

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "../interface/project.interface";
import {v4 as uuidv4} from 'uuid'
import { useLocalStorage } from "@vueuse/core";

const initialLoad = (): Project[]=>{
    return [
        {
            id: uuidv4(),
            name: 'project 1',
            tasks:[]
        },
        {
            id: uuidv4(),
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref( useLocalStorage<Project[]>('projects', initialLoad()))

    const addProject =(name: string) =>{
        if(name.length === 0) return

        projects.value.push({
            id: uuidv4(),
            name,
            tasks: []
        })
    }
    return {
        // Properties
        projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        
        // Actions
        addProject
    }
})
~~~

- Buscamos modules/projects/components/SideMenu.vue
- Importo el store en el script
- A este componente solo le va a importar saber como luce este store
- Uso el length de los proyectos con un v-if  para mostrar el párrafo "No hay proyectos"
- En el ul un v-else

~~~vue
<template>
  <aside class="bg-base-200 w-72 min-h-screen">
    <h2 class="text-lg font-bold mx-4">Proyectos</h2>
    <p v-if="projectsStore.projects.length == 0" class="text-sm text-gray-500 mx-4">No hay proyectos</p>
    <!--Menu-->
     <ul v-else class="menu rounded-box w-56">
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

<script setup lang="ts">
import { useProjectsStore } from '../stores/projects.store';

    const projectsStore = useProjectsStore()
</script>
~~~

- Bien podría crear un getter para el length de los proyectos
- No hace falta que use un ternario porque ya devuelve una expresión booleana
- projects.store.ts

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "../interface/project.interface";
import {v4 as uuidv4} from 'uuid'
import { useLocalStorage } from "@vueuse/core";

const initialLoad = (): Project[]=>{
    return [
        {
            id: uuidv4(),
            name: 'project 1',
            tasks:[]
        },
        {
            id: uuidv4(),
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref( useLocalStorage<Project[]>('projects', initialLoad()))

    const addProject =(name: string) =>{
        if(name.length === 0) return

        projects.value.push({
            id: uuidv4(),
            name,
            tasks: []
        })
    }
    return {
        // Properties
        projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        noProjects: computed(()=>projects.value.length == 0),
        
        // Actions
        addProject
    }
})
~~~

- Ahora puedo usar el getter directamente en lugar del .length

~~~js
<p v-if="projectsStore.noProjects" class="text-sm text-gray-500 mx-4">No hay proyectos</p>
~~~

- details solo aparece si el proyecto tiene tareas, sino solo debería aparecer el enlace directo
- El template se puede usar como un Fragments de React, no solo con los slots
- Lo que sea que ponga dentro del template, si está dentro de un li, va a ser hijo directo del li
- Coloco lo que había en details dentro del template, le quito el atributo open para que se tenga que clicar para mostrarlo
- Uso RouterLink para navegar al proyecto (todavía no está montado en el router)
- Uso otro template con un v-else para mostrar solo el enlace al proyecto con el nombre (sin las tareas que no hay)

~~~vue
<template>
  <aside class="bg-base-200 w-72 min-h-screen">
    <h2 class="text-lg font-bold mx-4">Proyectos</h2>
    <p v-if="projectsStore.noProjects" class="text-sm text-gray-500 mx-4">No hay proyectos</p>
    <!--Menu-->
     <ul v-else class="menu rounded-box w-56">
        <li v-for="project in projectsStore.projectList" :key="project.id">
        <template v-if="project.tasks.length > 0">
         <details>
            <summary>
                <router-link :to="`/project/${project.id}`">{{ project.name }}</router-link>
            </summary>
            <ul>
                <li v-for="task in project.tasks">
                  <router-link :to="`/project/${project.id}`">{{ task }}</router-link>  
                </li>
            </ul>
         </details>
        </template>

        <template v-else>
            <summary>
                <router-link :to="`/project/${project.id}`">{{ project.name }}</router-link>
            </summary>
        </template>
        </li>
        </ul>
    </aside>
</template>

<script setup lang="ts">
import { useProjectsStore } from '../stores/projects.store';

    const projectsStore = useProjectsStore()
</script>
~~~

- Todavía no tengo nada apuntando a esos paths de los RouterLink
- Como no tienen tareas, no aparece la flecha para clicar y desplegar el menú
- falta la pantalla donde recibir el argumento (el id), validar que existe, si no hay que salir de ahi, etc

## ProjectView - pantalla para ver el proyecto

- Creo en modules/projects/views/ProjectView.vue (el general es ProjectsView.vue)
- Digamos que por ahora lo único que quiero hacer es tomar el nombre del proyecto
- ProjectView.vue

~~~vue
<template>
    <div>
        <h1 class="text-3xl">{{ 'hola mundo' }}</h1>
    </div>
</template>
~~~

- Coloquemos la página en una ruta del router

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
        },
        {
          path:'project/:id',
          name: 'project',
          component: ()=>import('@/modules/projects/views/ProjectView.vue')
        }
      ]
    }
  ],
})

export default router
~~~

- Si ahora clico en alguno de los proyectos del menú lateral me muestra el hola mundo
- En la url aparece algo como http://localhost:5173/project/f2d88cbb-3554-48fc-992e-c295590262ad
- Una duda: que pasa si la persona recarga el navegador estando en esta página, y dado que en nuestro Pinia Store tiene que cargarse, porque está basado en el localStorage, qué pasa en ese caso?
- Lo primero, tenemos que ser capaces de obtener el id del url. Hay varias maneras, veamos una que no hemos visto
- Usando useRoute, puedo desestructurar params que es donde tengo el id
- ProjectView.vue

~~~js
//script setup
const {params} = useRoute()

console.log(params.id)
~~~

- También es bien común mandar las props en true desde el router
- router/index.ts

~~~js
{
path:'project/:id',
props: true,
name: 'project',
component: ()=>import('@/modules/projects/views/ProjectView.vue')
}
~~~

- Para obtenerlas tengo que definirlas (las tipo)
- Ahora ya puedo usar el id
- ProjectView.vue

~~~vue
<template>
    <div>
        <h1 class="text-3xl">{{ id }}</h1>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

//const {params} = useRoute()

interface Props{
    id: string
}

defineProps<Props>()

</script>

<style scoped>

</style>
~~~

- Vamos a usar el componente Breadcrumbs de DaisyUI para ir creando el Path tipo Home>Documents>Add Document
- Selecciono Breadcrumbs with icons
- Creo modules/common/components/BreadCrumbs.vue
- Pego el código dentro de un template

~~~vue
<template>
    <div class="breadcrumbs text-sm">
  <ul>
    <li>
      <a>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-4 w-4 stroke-current">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
        Home
      </a>
    </li>
    <li>
      <a>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-4 w-4 stroke-current">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
        Documents
      </a>
    </li>
    <li>
      <span class="inline-flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-4 w-4 stroke-current">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        Add Document
      </span>
    </li>
  </ul>
</div>
</template>
~~~

- Hacemos algunos cambios, el del medio no lo necesito (dejo solo el primero y el tercero), usamos un RouterLink en lugar de un anchor tag, uso las props para colocarle el name al el último elemento (no tengo más subrutas)
- Coloco un &nbsp al Home, que es colocar un espacio porque queda muy pegado
- BreadCrumbs.vue

~~~vue
<template>
    <div class="breadcrumbs text-sm">
  <ul>
    <li>
      <router-link to="/projects">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-4 w-4 stroke-current">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
        </svg>
        &nbsp;
        Home
    </router-link>
    </li>
    <li>
      <span class="inline-flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-4 w-4 stroke-current">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        {{ name }}
      </span>
    </li>
  </ul>
</div>
</template>

<script lang="ts" setup>
interface Props{
    name: string
}
defineProps<Props>()
</script>
~~~

- Usemos el BreadCrumbs en ProjectView.vue
- De name le paso project en duro

~~~vue
<template>
    <div>
        <bread-crumbs name="project"></bread-crumbs>
    </div>
</template>

<script setup lang="ts">
import BreadCrumbs from '@/modules/common/components/BreadCrumbs.vue';

interface Props{
    id: string
}

defineProps<Props>()

</script>

<style scoped>

</style>
~~~

- Si estoy en ProjectsView (el home) no aparecen los BreadCrumbs, pero si voy a project 1 en el menú lateral izquierdo, aparece Home (con un icono) / project (con otro icono)
- Quiero que en vez de poner project en duro aparezca el nombre del proyecto
- Puedo tomar el id en ProjectView, ir al store y tomar ese proyecto
- Hagámoslo mal para luego hacerlo bien
- En el script de ProjectView.vue

~~~js
interface Props{
    id: string
}

const props = defineProps<Props>()
const projectStore = useProjectsStore()             //puede ser undefined
const project= projectStore.projectList.find(project => project.id== props.id)
~~~

- Uso project en el template de ProjectView.vue
- Si no hay un project le paso un string con no-name
- Uso v-bind en el name para poder añadir lógica y no solo un string

~~~vue
<bread-crumbs :name="project?.name ?? 'no-name'"></bread-crumbs>
~~~

- Parece funcionar bien, pero cuando estoy en la página de un proyecto debo volver al Home para ir a la de otro proyecto
- Cambia la url pero no se está destruyendo el componente y volviendo a crear
- Si me quedo en otro proyecto y recargo el navegador, ahí si cambia
- Tengo que estar pendiente de si el id cambia 
- Ya hemos visto el watch
- Podemos hacerlo con computed
- ProjectView.vue

~~~js
//script
interface Props{
    id: string
}

const props = defineProps<Props>()
const projectStore = useProjectsStore()

const project = computed(() => {
  return projectStore.projectList.find((x) => x.id === props.id);
});
~~~

- De esta manera si puedo cambiar entre proyectos
- Otra manera usando el watch, pero no tenemos el valor (aparece no-name) cuando se recarga
    - Es por como funciona el watch
    - La primera vez que se va a la página no cambia, por eso no se ejecuta
    - Para que se dispare nada más montar el componente puedo usar inmediate en true

~~~js
//script
const project = ref<Project|null>()

watch(()=>props.id, ()=>{
    project.value= projectStore.projectList.find((x) => x.id === props.id);
},
{
    immediate: true
})
~~~

- **Explicación de computed**:
- Se utiliza cuando quieres derivar un valor de otras reactividades, como en este caso, projectStore.projectList y props.id.
- Es un valor reactivo que se actualiza automáticamente cada vez que sus dependencias cambian.
- La idea detrás de computed es que estás creando una propiedad calculada que depende de otras propiedades reactivas, y Vue lo optimiza para recalcular solo cuando alguna de esas dependencias cambia. No es necesario hacer nada explícito para "guardar" el resultado, ya que computed retorna un valor que siempre estará actualizado.
- **El watch**:
- Se utiliza cuando quieres ejecutar un efecto secundario (side effect) en respuesta a un cambio en los valores reactivos.
- Usualmente se usa para ejecutar código que no necesariamente debe ser calculado, sino que debe ejecutar alguna acción cuando los datos cambian. En tu ejemplo, estás buscando un proyecto y luego actualizando el valor de project.
- watch no retorna un valor; más bien, actúa sobre una acción. Aquí estás usando project.value directamente dentro de un watch, lo que hace que sea más adecuado si tienes efectos secundarios.
- Optimización: computed es más eficiente en términos de rendimiento en comparación con watch cuando se trata de derivar valores, porque solo se recalcula cuando alguna de sus dependencias cambia, y Vue lo maneja automáticamente. Si usas watch, cada vez que props.id cambie, el efecto se ejecutará y se actualizará manualmente el valor, lo que puede ser innecesario si solo quieres un valor calculado.
- ¿Cuándo usar watch en vez de computed?
- Si necesitas ejecutar acciones secundarias como llamar a una API, actualizar el estado de otros elementos, o hacer cosas que no sean directamente valores derivados.
- Si el cálculo no es simplemente un valor derivado sino que implica lógica compleja o efectos secundarios.

## Redireccionar si no existe el proyecto

- Si navegamos a un URL que no existe (con un id fake) aparece Home / no-name
- Hagamos la redirección, en ProjectView.vue hago udo del useRouter
- En ProjectView.vue

~~~js
//script
interface Props{
    id: string
}

const router = useRouter()
const props = defineProps<Props>()
const projectStore = useProjectsStore()

const project = ref<Project|undefined>()

watch(()=> props.id, ()=>{
    project.value= projectStore.projectList.find((x) => x.id === props.id);
    if(!project.value){
        router.replace('/')
    }
}, {
    immediate: true
})
~~~

- Pongo el breadcrumb dentro de un section dentro de un div con w-full (en ProjectView.vue)
- Hago algunos cambios en el template, agrego otro section y una tabla (que busco en DaisyUI), Table with a row that highlights on hover
- El componente luce así

~~~html
    <div class="overflow-x-auto">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Job</th>
        <th>Favorite Color</th>
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
      <!-- row 2 -->
      <tr class="hover:bg-base-300">
        <th>2</th>
        <td>Hart Hagerty</td>
        <td>Desktop Support Technician</td>
        <td>Purple</td>
      </tr>
      <!-- row 3 -->
      <tr>
        <th>3</th>
        <td>Brice Swyre</td>
        <td>Tax Accountant</td>
        <td>Red</td>
      </tr>
    </tbody>
  </table>
</div>
~~~

- Borro todos los rows exceptuando el que tiene el hover y customizo el header. Meto la tabla en el segundo section
- Pongo un m-2 en el section para que no quede todo tan pegado a los bordes
- ProjectView.vue

~~~vue
<template>
    <div class="w-full">
        <section class="m-2">
            <bread-crumbs :name="project?.name ?? 'no-name'"></bread-crumbs>
        </section>
            
        <section class="m-2">
            <template>
                <div class="overflow-x-auto">
            <table class="table">
                <!-- head -->
                <thead>
                <tr>
                    <th class=""w-14>Completada</th>
                    <th>Tarea</th>
                    <th>Completada en</th>
                </tr>
                </thead>
                <tbody>    
                <tr class="hover:bg-base-300">
                    <th>2</th>
                    <td>Hart Hagerty</td>
                    <td>Desktop Support Technician</td>
                    <td>Purple</td>
                </tr>
                </tbody>
            </table>
            </div>
            </template>
        </section>
    </div>
</template>

<script setup lang="ts">
import BreadCrumbs from '@/modules/common/components/BreadCrumbs.vue';
import { useProjectsStore } from '../stores/projects.store';
import { computed, ref, watch } from 'vue';
import type { Project } from '../interface/project.interface';
import { useRouter } from 'vue-router';

interface Props{
    id: string
}

const router = useRouter()
const props = defineProps<Props>()
const projectStore = useProjectsStore()

const project = ref<Project|undefined>()

watch(()=> props.id, ()=>{
    project.value= projectStore.projectList.find((x) => x.id === props.id);
    if(!project.value){
        router.replace('/')
    }
}, {
    immediate: true
})
</script>
~~~

- Creo otro row en la tabla con un input

~~~html
<section class="m-2">
    <div class="overflow-x-auto">
<table class="table">
    <!-- head -->
    <thead>
    <tr>
        <th class="w-14">Completada</th>
        <th>Tarea</th>
        <th>Completada en</th>
    </tr>
    </thead>
    <tbody>    
    <tr class="hover:bg-base-300">
        <th>2</th>
        <td>Hart Hagerty</td>
        <td>Desktop Support Technician</td>
        <td>Purple</td>
    </tr>
    <tr class="hover:bg-base-300">
        <th></th>
        <td>
            <input type="text"
            class="input input-primary w-full opacity-60 tranisition-all"
            placeholder="Nueva tarea"
            >
        </td>
    </tr>
    </tbody>
</table>
</div>
</section>
~~~

- Cuando el foco esté encima quiero que se vea fuerte (sin la opacidad)
- Fácil con tailwind

~~~html
 <input type="text"
  class="input input-primary w-full opacity-60 tranisition-all hover:opacity-100 focus:opacity-100"
  placeholder="Nueva tarea"
  >
~~~

## Agregar tareas al proyecto

- Creo la función en el store para agregar tarea. La retorno para poder usarla
- projects.store.ts

~~~js
//store

const addTaskToProject =(projectId: string, taskName: string)=>{
    
    if(taskName.trim().length === 0) return

    const project= projects.value.find(p => p.id === projectId)

    if(!project) return 

    project.tasks.push({
    id: uuidv4(),
    name: taskName,
    })
    
}
~~~

- Uso el v-model y el @keypress.enter para insertar la tarea, me creo una función para poder borrar la tarea del input una vez insertada
- No ocupo el evento porque todo lo tengo a la mano
- Uso un v-for para renderizar la tarea

~~~vue
<template>
  <tbody>    
    <tr v-for="task in project?.tasks" :key="task.id" class="hover:bg-base-300">
        <th>2</th>
        <td>{{ task.name }}</td>
        <td>Desktop Support Technician</td>
        <td>Purple</td>
    </tr>
    <tr class="hover:bg-base-300">
        <th></th>
        <td>
            <input type="text"
            class="input input-primary w-full opacity-60 tranisition-all hover:opacity-100 focus:opacity-100"
            placeholder="Nueva tarea"
            v-model="newTask"
            @keypress.enter="addTask"
            >
        </td>
    </tr>
  </tbody>  
{...code}
</template>

<script setup lang="ts">
//imports

interface Props{
    id: string
}

const router = useRouter()
const props = defineProps<Props>()
const projectStore = useProjectsStore()
const project = ref<Project|undefined>()
const newTask = ref('')

watch(()=> props.id, ()=>{
    project.value= projectStore.projectList.find((x) => x.id === props.id);
    if(!project.value){
        router.replace('/')
    }
}, {
    immediate: true
})

const addTask=()=>{
    if(!project.value) return
    projectStore.addTaskToProject(project.value.id, newTask.value)
    newTask.value=""
}
</script>
~~~

## Completar tareas y progreso


- Donde tenemos ese número 2 en la tabla de ProjectView.vue colocaremos un chekcbox para marcar la tarea completada o no
- En DaisyUI, un checkbox no es más que un input que tiene el type checkbox, con la propiedad checked en true por defecto
- Uso la doble negación para el cheked con el completedAt. Con una negación, estoy diciendo "si no existe una fecha", con doble negación lo transformo en un valor booleano. Si tiene un valor será true (con la doble negación)

~~~html
 <tr v-for="task in project?.tasks" :key="task.id" class="hover:bg-base-300">
    <th>
        <input type="checkbox"
            :checked="!!task.completedAt"
            class="checkbox checkbox-primary"
        >
    </th>
    <td>{{ task.name }}</td>
    <td>Desktop Support Technician</td>
    <td>Purple</td>
</tr>
~~~

- Tenemos que insertar una fecha en completedAt para que al marcar el checkbox se ponga en true
- Creo toggletAsk en projects.store.ts

~~~js
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Project } from "../interface/project.interface";
import {v4 as uuidv4} from 'uuid'
import { useLocalStorage } from "@vueuse/core";

const initialLoad = (): Project[]=>{
    return [
        {
            id: uuidv4(),
            name: 'project 1',
            tasks:[]
        },
        {
            id: uuidv4(),
            name: 'project 2',
            tasks:[]
        },
    ]
}



export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref( useLocalStorage<Project[]>('projects', initialLoad()))

    const addProject =(name: string) =>{
        if(name.length === 0) return

        projects.value.push({
            id: uuidv4(),
            name,
            tasks: []
        })
    }

    const addTaskToProject =(projectId: string, taskName: string)=>{
        
        if(taskName.trim().length === 0) return

       const project= projects.value.find(p => p.id === projectId)

       if(!project) return 

       project.tasks.push({
        id: uuidv4(),
        name: taskName,
       })
        
    }

    const toggleTask = (projectId: string, taskId: string)=>{
       const project= projects.value.find(p => p.id === projectId)
        if(!project) return

        const task= project.tasks.find(t=> t.id === taskId)
        if(!task) return

        task.completedAt = task.completedAt ? undefined : new Date()
    }

    return {
        // Properties
        projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        noProjects: computed(()=>projects.value.length == 0),
        
        // Actions
        addProject,
        addTaskToProject,
        toggleTask
    }
})
~~~

- Usamos toggletAsk en ProjectView.vue
- Uso el on-change en el input y le paso los argumentos a la función. Uso ! en project para que no se queje, ya que si no hay proyecto no podría entrar en la página, por lo que seguro que hay proyecto

~~~js
<input type="checkbox"
        :checked="!!task.completedAt"
        class="checkbox checkbox-primary"
        @change="projectStore.toggleTask(project!.id, task.id)"
>
~~~

- Renderizo el completedAT

~~~js
<tr v-for="task in project?.tasks" :key="task.id" class="hover:bg-base-300">
    <th>
        <input type="checkbox"
            :checked="!!task.completedAt"
            class="checkbox checkbox-primary"
            @change="projectStore.toggleTask(project!.id, task.id)"
        >
    </th>
    <td>{{ task.name }}</td>
    <td>{{ task.completedAt }}</td>
</tr>
~~~

- Si le doy al checkbox aparece la fecha completa en la columna de la derecha (con el header Completada en)
- Tenemos que indicar la barra de progreso según las tareas completadas o no
- Tenemos que calcular el value (del componente progress) basado en las tareas completadas
- Hagamos la función en el store
- Creo una propiedad computada llamada projectsWithCompletion
  - Necesito regresar un nuevo arreglo con el id del proyecto, el nombre, el númerod e tareas y el completion
  - .map me va a permitir regresar otro arreglo basado en un arreglo
- projects.store.ts

~~~js

export const useProjectsStore= defineStore('projects', ()=>{
    const projects = ref( useLocalStorage<Project[]>('projects', initialLoad()))

    const addProject =(name: string) =>{
        if(name.length === 0) return

        projects.value.push({
            id: uuidv4(),
            name,
            tasks: []
        })
    }

    const addTaskToProject =(projectId: string, taskName: string)=>{
        
        if(taskName.trim().length === 0) return

       const project= projects.value.find(p => p.id === projectId)

       if(!project) return 

       project.tasks.push({
        id: uuidv4(),
        name: taskName,
       })
        
    }

    const toggleTask = (projectId: string, taskId: string)=>{
       const project= projects.value.find(p => p.id === projectId)
        if(!project) return

        const task= project.tasks.find(t=> t.id === taskId)
        if(!task) return

        task.completedAt = task.completedAt ? undefined : new Date()
    }

    

    return {
        // Properties
        projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        noProjects: computed(()=>projects.value.length == 0),
        projectsWithCompletion: computed(()=>{
            return projects.value.map(project=>{
                const total = project.tasks.length
                
                const completed = project.tasks.filter(t=> t.completedAt).length
                const completion = total === 0 ? 0 : (completed/total) * 100

                return{
                    id: project.id,
                    name: project.name,
                    taskCount: total,
                    completion: completion
                }
            })
        }),
        
        // Actions
        addProject,
        addTaskToProject,
        toggleTask
    }
})
~~~

- En ProjecstView.vue (el plano general, donde está la barra de progress)
- En lugar del projectList en el for usaré el projectWithCompletion
- Uso el .taskCount en lugar de tasks.length

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
      <tr v-for="(project,index) in projectStore.projectsWithCompletion" :key="project.id">
        <th>{{ index+1 }}</th>
        <td>{{ project.name }}</td>
        <td>{{ project.taskCount }}</td>
        <td>
          <progress class="progress progress-primary w-56" :value="project.completion" max="100"></progress>
        </td>
      </tr>
    </tbody>
  </table>
 </div>

  <input-modal 
  :open="openModal" 
  @close="openModal = false"
  @value="projectStore.addProject"
  title="Añade aquí tu proyecto"
  subtitle="Desde aquí puedes añadir tu proyecto"
  placeholder="Nombre del proyecto"
  />

  <custom-modal :open="customOpenModal">
    <template #header>
      <h1>Esto es el header</h1>
    </template>
  </custom-modal>
  
  <fab-button @click="openModal = true">
    <add-circle />
  </fab-button>

  <fab-button @click="customOpenModal = true" position="bottom-left">
    <add-circle />
  </fab-button>

</template>

<script setup lang="ts">
import CustomModal from '@/modules/common/components/CustomModal.vue';

import FabButton from '@/modules/common/components/FabButton.vue';
import InputModal from '@/modules/common/components/InputModal.vue';
import AddCircle from '@/modules/common/icons/AddCircle.vue';
import { ref } from 'vue';
import { useProjectsStore } from '../stores/projects.store';

const openModal= ref(false)
const customOpenModal=ref(false)

const projectStore = useProjectsStore()

const onNewValue=(projectName: string)=>{
  projectStore.projectList.push({
    id: '3',
    name: projectName,
    tasks: []
  })
}
</script>
~~~

- Si quiero mostrar el porcentaje puedo redondear el completion con un Math.round
- projects.store.ts

~~~js
return {
        // Properties
        projects,
    
        // Getters (propiedades computadas)
        projectList: computed(()=> [...projects.value]),
        noProjects: computed(()=>projects.value.length == 0),
        projectsWithCompletion: computed(()=>{
            return projects.value.map(project=>{
                const total = project.tasks.length
                
                const completed = project.tasks.filter(t=> t.completedAt).length
                const completion = total === 0 ? 0 : (completed/total) * 100

                return{
                    id: project.id,
                    name: project.name,
                    taskCount: total,
                    completion: Math.round(completion)
                }
            })
        }),
}
~~~

- Y usar el project.completion en el td de la barra de progreso en ProjectsView.vue

~~~html
<td>
    <progress class="progress progress-primary w-56" :value="project.completion" max="100"></progress>
    {{ project.completion }}
</td>
~~~

- El ProjectView.vue queda así

~~~vue
<template>
    <div class="w-full">
        <section class="m-2">
            <bread-crumbs :name="project?.name ?? 'no-name'"></bread-crumbs>
        </section>
        <section class="m-2">
                <div class="overflow-x-auto">
            <table class="table">
                <!-- head -->
                <thead>
                <tr>
                    <th class="w-14">Completada</th>
                    <th>Tarea</th>
                    <th>Completada en</th>
                </tr>
                </thead>
                <tbody>    
                <tr v-for="task in project?.tasks" :key="task.id" class="hover:bg-base-300">
                    <th>
                        <input type="checkbox"
                            :checked="!!task.completedAt"
                            class="checkbox checkbox-primary"
                            @change="projectStore.toggleTask(project!.id, task.id)"
                        >
                    </th>
                    <td>{{ task.name }}</td>
                    <td>{{ task.completedAt }}</td>
                </tr>
                <tr class="hover:bg-base-300">
                    <th></th>
                    <td>
                        <input type="text"
                        class="input input-primary w-full opacity-60 tranisition-all hover:opacity-100 focus:opacity-100"
                        placeholder="Nueva tarea"
                        v-model="newTask"
                        @keypress.enter="addTask"
                        >
                    </td>
                </tr>
                </tbody>
            </table>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import BreadCrumbs from '@/modules/common/components/BreadCrumbs.vue';
import { useProjectsStore } from '../stores/projects.store';
import { computed, ref, watch } from 'vue';
import type { Project } from '../interface/project.interface';
import { useRouter } from 'vue-router';

interface Props{
    id: string
}

const router = useRouter()
const props = defineProps<Props>()
const projectStore = useProjectsStore()
const project = ref<Project|undefined>()
const newTask = ref('')

watch(()=> props.id, ()=>{
    project.value= projectStore.projectList.find((x) => x.id === props.id);
    if(!project.value){
        router.replace('/')
    }
}, {
    immediate: true
})

const addTask=()=>{
    if(!project.value) return
    projectStore.addTaskToProject(project.value.id, newTask.value)
    newTask.value=""
}
</script>
~~~

- El SideMenu.vue queda así (añado un router-link al h2 de Proyectos para poder clicar para ir al Home)

~~~vue
<template>
  <aside class="bg-base-200 w-72 min-h-screen">
    <h2 class="text-lg font-bold mx-4">
        <router-link to="/">Proyectos</router-link>
    </h2>
    <p v-if="projectsStore.noProjects" class="text-sm text-gray-500 mx-4">No hay proyectos</p>
    <!--Menu-->
     <ul v-else class="menu rounded-box w-56">
        <li v-for="project in projectsStore.projectList" :key="project.id">
        <template v-if="project.tasks.length > 0">
         <details>
            <summary>
                <router-link :to="`/project/${project.id}`">{{ project.name }}</router-link>
            </summary>
            <ul>
                <li v-for="task in project.tasks">
                  <router-link :to="`/project/${project.id}`">{{ task.name }}</router-link>  
                </li>
            </ul>
         </details>
        </template>

        <template v-else>
            <summary>
                <router-link :to="`/project/${project.id}`">{{ project.name }}</router-link>
            </summary>
        </template>
        </li>
        </ul>
    </aside>
</template>

<script setup lang="ts">
import { useProjectsStore } from '../stores/projects.store';

    const projectsStore = useProjectsStore()
</script>
~~~

- El router queda así

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
        },
        {
          path:'project/:id',
          props: true,
          name: 'project',
          component: ()=>import('@/modules/projects/views/ProjectView.vue')
        }
      ]
    }
  ],
})

export default router
~~~

- Faltaría poder editar las tareas las tareas clicando encima de la tarea
--------


