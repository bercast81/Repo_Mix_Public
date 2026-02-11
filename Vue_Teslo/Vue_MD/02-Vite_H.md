# 02 Vue Herrera - Vite Single File Components

- La opción recomendada en la documentación es npm create vue@latest

> npm create vue@latest

- name: Indecision-app
- TypeScript: yes
- JSX:no
- Router: no
- Pinia: no
- Vitest: no
- End-to-End: no
- ESLint: yes
- Prettier: yes
- El router, pinia, vitest aprenderemos como configurarlo luego
- Las devtools ya vienen por defecto!
- Hay que hacer un npm install en la carpeta del proyecto
- vamos con el análisis de los archivos y directorios que crea por defecto

## Explicación de archivos y directorios

- vite.config.ts: archivo de configuración de vite. Tiene los plugins de vue y resuelve ./src

~~~js
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
~~~

- tsconfig son archivos de configuración de node, TypeScript. No hace falta tocarlos
- El README nos lo tendremos que currar para describir los pasos para que otros sepan como echar andar la aplicación
- El package.json ya lo conocemos, es donde están los scripts, las dependencias, el nombre de la app, la versión y otras cosas
- Hay varios scripts

~~~json
"scripts": {
    "dev": "vite",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "build-only": "vite build",
    "type-check": "vue-tsc --build",
    "lint": "eslint . --fix --cache",
    "format": "prettier --write --experimental-cli src/"
  }
~~~

- Tenemos el index.html donde esta el div con id app que es donde vivirá la aplicación de Vue
    - Aquí es donde agregaríamos bootstrap, por ejemplo

~~~html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
~~~

- El env.d.ts nos facilitará trabajar con variables de entorno (aunque no en este archivo)
- .prettierc.json son las reglas de configuración del prettier

~~~json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false, //pone todos los punto y coma al final en true
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all" //todo con comillas dobles
}
~~~

- .gitignore no sube los archivos a git que en el se incluyen
- eslint.config.ts

~~~js
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  skipFormatting,
)
~~~

- En la carpeta src tenemos el main.ts y el App.vue
- main.ts

~~~js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
~~~

- En Vue.app no esta App porque decidí tener el proyecto en blanco. Lo haremos desde cero
- Muestra esto por defecto

~~~vue
<script setup lang="ts"></script>

<template>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
</template>

<style scoped></style>
~~~

- En public es donde guardaremos recursos estáticos
- Los node_modules es donde están todos los paquetes de dependencias. No se tocan de manera manual
- En .vscode están las configuraciones de vscode para trabajar con Vue
    - settings.json es la configuración de vscode determinada por el equipo de Vue

## SFC - Single File Component


- En src/App.vue (es el único componente que nos va a permitir tener una sola palabra)
- El template siempre requiere un child element
- Agregando la palabra setup a la etiqueta script es como si ya tuviera la función setup definida
- Con la etiqueta style puedo añadirle estilos
  - Para que no los aplique de forma global y solo los aplique al componente uso la palabra **scoped**
  - El scoped añade una data adicional al elemento en el html generado de ese componente que ayuda a Vue a que solo le aplique los estilos al elemento indicado

~~~vue
<script setup lang="ts" setup> //agrego aquí la palabra setup
  console.log("Hola mundo!")
</script>

<template>
  <h1>Hola mundo!</h1>
</template>


<style scoped>
h1{
  color: red
}
</style>
~~~

- Si el main.ts da error de que no encuentra App.vue hacer un **Developer: Reload Window** con Ctrl+Shift+P
- En la parte central inferior del navegador están las devtools, hay una V de Vue y una mira de disparo
  - Si le doy a la mira de disparo y luego clico sobre un componente me lleva al código del componente en vscode

## Estado y eventos

- Vamos a crear un contador
- El square será un valor computado según el valor que tengamos en el counter
- El esqueleto sería este

~~~vue
<script setup lang="ts"></script>

<template>
  <section>
    <h3>Counter: {{ 10 }}</h3>
    <h3>Square: {{ 10 * 10}}</h3>
    <div>
      <button>+1</button>
      <button>-1</button>
    </div>
  </section>
</template>
~~~

- Creo las variables reactivas
- Square es una propiedad computada que cambia cuando counter cambia

~~~vue
<script lang="ts" setup>
import { computed, ref } from 'vue';

const counter = ref(2);
const squareCounter = computed(()=>counter.value * counter.value)
</script>

<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button>+1</button>
      <button>-1</button>
    </div>
  </section>
</template>
~~~

- Vamos con los botones

~~~vue
<script lang="ts" setup>
import { computed, ref } from 'vue';

const counter = ref(2);
const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;
</script>

<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button @click="increment">+1</button>
      <button @click="decrement">-1</button>
    </div>
  </section>
</template>
~~~

- También podría haber usado counter++ directamente
- No hace falta usar .value en el template cuando usamos variables reactivas usando ref
- Veremos otras maneras de trabajar

~~~vue
<button @click="counter++">+1</button>
~~~

## Nuestro primer componente

- Creemos un componente específico del counter
- Creo src/components/MyCounter.vue   (el nombre tienen que ser dos palabras, excepto App.vue)
- App.vue queda así

~~~vue
<script lang="ts" setup>
import MyCounter from './components/MyCounter.vue';


</script>

<template>
  <h1>Mi primera app</h1>
  <hr>

  <MyCounter />
</template>
~~~

- Mycounter.vue queda así

~~~vue
<script lang="ts" setup>
import { computed, ref } from 'vue';

const counter = ref(2);
const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;
</script>

<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button @click="increment">+1</button>
      <button @click="decrement">-1</button>
    </div>
  </section>
</template>
~~~

- Hay otra sintaxis que es usando data(), que es la de Options API (sin el setup)
- custom1 es un elemento personalizado
- Ejemplo:

~~~vue
<template>
  <div class="example">{{ msg }}</div>
</template>

<script>
export default {
  data() { //Esto es el Options API
    return {
      msg: 'Hello world!'
    }
  }
}
</script>

<style>
.example {
  color: red;
}
</style>

<custom1>
  This could be e.g. documentation for the component.
</custom1>
~~~


## Define Props - Recibir properties

- Es probable que necesite comunicar componentes
- En este ejemplo, puede que quiera especificar un valor por defecto en MyCounter
- Para ello se usa **v-bind**, la forma corta es :
- App.vue

~~~vue
<script lang="ts" setup>
import MyCounter from './components/MyCounter.vue';


</script>

<template>
  <h1>Mi primera app</h1>
  <hr>

  <MyCounter :value="5"/>
</template>
~~~

- Estamos viendo la manera en que se usa script setup
- Para las props tenemos las funciones defineProps (y también está defineEmits para los eventos)
- MyCounter.vue

~~~vue
<script lang="ts" setup>
import { computed, ref } from 'vue';

const props= defineProps({
    value: {type: Number, required: true}
    //value: Number   //de esta manera considera value opcional
})

const counter = ref(props.value);
const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;

</script>
~~~

- Podríamos desestructurar el value de las props

~~~js
const {value}= defineProps({
    value: {type: Number, required: true}
    //value: Number   //de esta manera considera value opcional
})
~~~

- Se puede usar <> y unas llaves con defineProps para tipar las props. De esta manera se consideran obligatorias también

~~~js
const props= defineProps<{
  value: number
  }>()
~~~

- Perfectamente puedo crear una interfaz

~~~js
interface Props{
  value: number //si lo quiero opcional uso value?
}

const props = defineProps<Props>()
~~~

- Si lo pongo opcional (value?) TypeScript se queja porque puede la prop value puede ser undefined
- Si es nulo le pongo 5 por defecto

~~~js
const counter = ref(props.value ?? 5);
~~~

## Componente tradicional

- Hasta ahora hemos visto el script setup (Composition API)
- Es la forma abreviada de trabajar
- Cuando los componentes tienen mucha lógica vamos a usar los **Composable Functions** (es similar a los custom hooks)
- Para la forma tradicional, creo un nuevo componente MyCounterScript.vue
- Le quito la palabra setup a la etiqueta script
- Uso defineComponent

~~~vue
<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button @click="increment">+1</button>
      <button @click="decrement">-1</button>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, computed} from 'vue';

export default defineComponent({
    props:{
        value: {type:Number, required: true}
    },
    setup(props){

        const counter = ref(props.value);
        const squareCounter = computed(()=>counter.value * counter.value);
        const increment =()=>counter.value ++;
        const decrement =()=>counter.value --; 
        
        return {
            counter,
            squareCounter,
            increment,
            decrement
        }

    }   
})
</script>
~~~

- Este código no es obsoleto, nos va a servir cuando tengamos mucho código en un archivo independiente

## Separar lógica del SFC

- Con mucho código usaríamos Composable Functions y trabajaríamos con el script setup
- Lo veremos
- Creo MyCounterScript2.vue y MyCounterScript2.ts en components/my-counter-script
- Si tuviera css de este componente también lo colocaría dentro de esta carpeta
- Lo que había dentro del script en el componente de vue lo corto y lo pego en el .ts

~~~js
import { defineComponent, ref, computed} from 'vue';

export default defineComponent({ //es importante usar defineComponent!!
    props:{
        value: {type:Number, required: true}
    },
    setup(props){

        const counter = ref(props.value);
        const squareCounter = computed(()=>counter.value * counter.value);
        const increment =()=>counter.value ++;
        const decrement =()=>counter.value --; 
        
        return {
            counter,
            squareCounter,
            increment,
            decrement
        }

    }   
})
~~~

- Es el código de TypeScript que corresponde a este componente de Vue
- Para referenciarlo uso src en la etiqueta script del componente .vue

~~~vue
<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button @click="increment">+1</button>
      <button @click="decrement">-1</button>
    </div>
  </section>
</template>

<script lang="ts" src="./MyCounterScript2.ts">

</script>
~~~

## Integrar estilos de terceros

- Aprendamos a configurar Bootstrap pero usaremos Tailwind a lo largo del curso
- Hay varias maneras de trabajar con estilos
- Puedo crear un styles.css en src y trabajar con una hoja de estilos global
  - Lo importo en el main

- styles.css

~~~css
html,body{
    margin:0;
    background-color:#018992
}
~~~

- main.ts

~~~js
import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

createApp(App).mount('#app')
~~~

- Para usar Bootstrap lo más fácil sería usar el CDN en el html
- index.html

~~~html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
    <link 
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" 
    rel="stylesheet" 
    integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" 
    crossorigin="anonymous" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
~~~

- Pero vamos a trabajar con Tailwind en Vite

> npm install tailwindcss @tailwindcss/vite

- En vite.config.ts

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
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
~~~

- En el styles.css

~~~css
@import "tailwindcss";
~~~

- Ya puedes usar tailwindcss
- Para juntar todas las clases de Tailwind en una sola clase uso @apply
- Debo usar @reference "tailwindcss" en el scope de style

~~~vue
<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button class="btn" @click="increment">+1</button>
      <button class="btn" @click="decrement">-1</button>
    </div>
  </section>
</template>

<script lang="ts" src="./MyCounterScript2.ts">

</script>

<style scoped>
  @reference "tailwindcss";
  
  .btn{
    @apply p-5 bg-red-500 rounded hover:bg-red-600 mr-2;
  }

</style>
~~~

- Para que desaparezca el warning de @reference abro las settings de VsCode con Ctrl+Shift+P Preferences: Open Settings (UI)
  - Buscar unknown, en CSS > Lint: Unknown At Rules marcar ignore

## Crear y desplegar aplicación

- Ejecutar **npm run build**
- Esto nos da un .html, un .css y un .js y los assets en una carpeta dist
- Estos son los archivos que se suben al hosting (Netlify u otros)
- Para comprobar la versión de producción instalar http-server y usar el comando http en la carpeta dist

## Composable Functions

- Sería conveniente agrupar toda la lógica del contador para tenerla en un único lugar para que otros componentes puedan usarla
- Es simplemente una función con la lógica de la aplicación que retorna las variables (reactivas) para que cualquiera pueda usarlas
- Está inspirado en los custom hooks
- Creo en src/composables/useCounter.ts
- Para solucionar las importacionas usar **Ctrl + .**

~~~js
import { computed, ref } from 'vue';

export const useCounter = ()=>{



const counter = ref(5);
const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;


    //puede regresar cualquier cosa, un objeto, un arreglo
    // si retorna un arreglo usar return [] as const para que siempre regrese el mismo orden
    return  {
        counter,
        squareCounter,
        increment,
        decrement
    }
}
~~~

- Cuando la propiedad es read-only (como el squareCounter) se puede definir directamente en el return
- Para usar los valores desestructuro de la función

~~~js
const {counter, squareCounter,increment,decrement} = useCounter()
~~~

- Para poder incluir un valor inicial al contador podría hacerse así

~~~js
import { computed, ref } from 'vue';

export const useCounter = (initialValue: number)=>{

const counter = ref(initialValue);
const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;


    //puede regresar cualquier cosa, un objeto, un arreglo
    // si retorna un arreglo usar return [] as const para que siempre regrese el mismo orden
    return  {
        counter,
        squareCounter,
        increment,
        decrement
    }
}
~~~

- Para usar las props en MyCounterScript.vue

~~~vue
<template>
  <section>
    <h3>Counter: {{ counter }}</h3>
    <h3>Square: {{ squareCounter}}</h3>
    <div>
      <button @click="increment">+1</button>
      <button @click="decrement">-1</button>
    </div>
  </section>
</template>

<script lang="ts">
import { useCounter } from '@/composables/useCounter';
import { defineComponent, ref, computed} from 'vue';

export default defineComponent({
    props:{
        value: {type:Number, required: true}
    },
    setup(props){
        const {counter, squareCounter,increment,decrement} = useCounter(props.value)
   
        
        return {
            counter,
            squareCounter,
            increment,
            decrement
        }

    }   
})
</script>
~~~

- Si yo declaro la variable fuera del useCounter de esta manera

~~~js
import { computed, ref } from 'vue';

const counter = ref(10);

export const useCounter = (initialValue: number)=>{


const squareCounter = computed(()=>counter.value * counter.value);
const increment =()=>counter.value ++;
const decrement =()=>counter.value --;


    //puede regresar cualquier cosa, un objeto, un arreglo
    // si retorna un arreglo usar return [] as const para que siempre regrese el mismo orden
    return  {
        counter,
        squareCounter,
        increment,
        decrement
    }
}
~~~

- Todos los MyCounter que usen el useCounter tendrán el valor de 10 y cambiarán de manera simultánea
- Entonces he creado un **gestor de estado global** basado en un Composable
---------



