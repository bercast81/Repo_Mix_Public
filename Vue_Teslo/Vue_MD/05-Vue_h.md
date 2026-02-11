# 05 Vue Herrera - Pokemon Game


- Nos vamos a enfocar a crear un nuego de Pokemon
  - Quién es ese Pokemon? Y seleccionar uno del listado
  - Con un contador (las veces que se ha ganado o perdido)
  - Rango de pokemones (los primeros 51, o los 200, los 800)
  - Vamos a ir excluyendo las selecciones (siempre serán 4 pokemones entre los que elegir)
  - En la pantalla se verá ¿Quién es el pokemon?, debajo una silueta y debajo cuatro cajas con los diferentes nombres a elegir
  - Cuando se clique en una de las opciones se iluminarán todas remarcando la correcta y aparecerá la opción jugar de nuevo
  - Cuando se acierta veremos confeti
- Tailwind, clases condicionales, emisiones de eventos, manejo de properties, manejar el estado, etc
- Trabajaremos con el Composition API y el script setup, perfectamente lo podremos desarrollar d esta manera si usar defineComponents

## Inicio del proyecto 

> npm create vue@latest

- name: pokemon-game
- TypeScript: si
- JSX: no
- Vue Router: no
- Pinia: no
- Vitest: si
- E2E: no
- EsLint: si
- Prettier: si
- Entro en la carpeta del proyecto y le doy a npm install
- Tenemos varias maneras de organizar el filesystem
  - Por tipos (con todos los components en /components)
  - Por tipos y features (cuando la aplicación es un poco más grande, con cada componente en su carpeta dentro de components)
    - El inconveniente de esta manera es que hay muchas carpetas duplicadas, es dificil de rastrear, mantener... 
  - Screaming architecture (dividir por módulos, core, payments, y dentro de cada módulo components, composables, store, lib, etc)
    - De esta manera agrupamos el código por módulos
    - Trabajaremos de esta manera
- En App.vue, uso el snippet vbase y selecciono vbase-3-ts-setup (Vue VsCode Snippets)
- Creo src/assets/styles.css
- Lo importo en el main.ts

~~~js
import './assets/styles.css'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
~~~

- Instalamos tailwind

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

- Cuando uses clases de tailwind en dentro del style scoped hay que usar @referenece "tailwindcss"
- Ejemplo

~~~vue
<style scoped>
  @reference "tailwindcss";
</style>
~~~

## Estructura de la aplicación

- src/modules/pokemon/composables
- src/modules/pokemon/components
- src/modules/pokemon/pages/PokemonGame.vue
- Creamos un loading en PokemonGame.vue
- Con w-screen y h-screen lo centro en la pantalla
- El animate-pulse hace que parpadee
- Una vez visto el resultado renderizándolo en App.vue le coloco un v-if=false para no mostrarlo
- Debajo del section del loader vamos a tener el juego, abro otro section
- PokemonGame.vue

~~~vue
<template>
    <section v-if="false" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section class="flex flex-col justify-center items-center w-screen h-screen">
        <h1>¿Quién es este Pokemón?</h1>
        
        <!--Pokemon Picture-->

        <!--Pokemon Options-->
        
    </section>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>
~~~

- pokemon/components/PokemonPicture.vue
- En la pokeapi las imágenes están en sprites/other/dream_world/front_default
- Colocamos el string en el src de la imágen para ver cómo queda al renderizarlo en PokemonGame.vue
- Le coloco el brightness-0 y unas clases para que no se pueda arrastrar la imagen oscura y ver cuál es

~~~vue
<template>
  <section>
    <img 
    class="brightness-0 h-[200px]"
    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png">
  </section>
</template>

<script setup lang="ts">

</script>

<style scoped>
/*para que la persona pno pueda mover la imagen oscura y ver cual es*/
img{
    user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select:none
}
</style>
~~~

- Vamos con PokemonOptions.vue, hagámoslo provisional

~~~vue
<template>
  <section class="mt-5">
    <ul>
        <li>Pókemon 1</li>
        <li>Pókemon 2</li>
        <li>Pókemon 3</li>
        <li>Pókemon 4</li>
    </ul>
  </section>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>
~~~

- Lo renderizo también en PokemonGame.vue

~~~vue
<template>
    <section v-if="false" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        
        <PokemonPicture />
        <PokemonOptions />

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';


</script>

<style scoped>
@reference "tailwindcss";

li{
    @apply bg-white rounded-lg shadow-md p-3 m-2 cursor-pointer w-40 text-center transition-all hover:bg-gray-100
}
</style>
~~~

- Puedo aplicarle unas clases temporales porque luego los voy a transformar en botones
- En styles.css añado unas clases para el color de fondo

~~~css
@import "tailwindcss";

html, body{
    background-color: #f1f1f1;
}
~~~

- Creo en src/assets/animation.css y pego este código

~~~css
.fade-in {
    animation: fadeIn 0.3s;
    -webkit-animation: fadeIn 0.3s;
    -moz-animation: fadeIn 0.3s;
    -o-animation: fadeIn 0.3s;
    -ms-animation: fadeIn 0.3s;
  }
  @keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
  }
  
  @-moz-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
  }
  
  @-webkit-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
  }
  
  @-o-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
  }
  
  @-ms-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
  }
~~~

- Esto hace que cuando añada la clase fade-in añade un efecto de fade-in, para cuando mostremos el pokemon que es

## Enumeraciones y tipado de datos

- Voy a iniciar la lógica en el composable
- En pokemon/composables/usePokemonGame.ts
- El juego tiene tres estados: cuando se gana, se pierde y cuando se está jugando
- Este estado lo almacenaré en una variable reactiva gameStatus
- Para tiparlo creo pokemon/interfaces/game-status.enum.ts
- Aunque los enum ni los types sean interfaces, colocaré aquí todo lo que es tipado
- game-status.enum.ts

~~~js
export enum GameStatus{
 Playing = 'playing',
 Won = 'won',
 Lost='lost'   
}
~~~

Puedo crear un archivo de barril en interfaces/index.ts
- index.ts

~~~js
export * from './game-status.enum';
~~~

- Ahora ya puedo usarlo en usePokemonGame.ts
- Necesito crear el listado random de pokemons
- Si en la pokeapi uso limit=151 me trae 151 pokemons. Trabajaremos con eso
- Hagámoslo con axios

> npm i axios

- pokemon/api/pokemon-api.ts

~~~js
import axios from 'axios'


const pokemonApi = axios.create({
    baseURL: "https://pokeapi.co/api/v2/pokemon"
})


export {pokemonApi} //después usaremos middlewares
~~~

- Llamo con el onMounted a getPokemons, que es para cuando se monte se ejecute, aunque en este caso es redundante ya que al pasar por el script setup se va a montar igual si invocaramos la función sin el onMounted

~~~js
import { onMounted, ref } from "vue"
import { GameStatus } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)

    const getPokemons = async() =>{
        const response = await pokemonApi.get('/?limit=151')
        console.log(response)
    }

    //getPokemons()

    onMounted(()=>{
        getPokemons()
    })

    return {
        gameStatus
    }
}
~~~

- Usemos el usePokemonGame en PokemonGame.vue, desestructuremos el gameStatus para que TS no se queje
- PokemonGame.vue

~~~vue
<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';

const {gameStatus} = usePokemonGame()
</script>
~~~

- Deberíamos poder ver en consola el resultado de la petición gracias al console.log
- Los pokemons están en data/results (results es un arreglo de objetos con name, url)
- Lo que me gustaría tener es el id y el nombre del pokemon
- Y también quiero tipar la respuesta. Abrimos POSTMAN, hago la petición y uso paste json as code
- En interfaces/pokemon-list.response.ts

~~~js
export interface PokemonListResponse {
    count:    number;
    next:     string;
    previous: null;
    results:  Result[];
}

export interface Result {
    name: string;
    url:  string;
}
~~~

- Lo coloco en el archivo de barril
- Ahora ya puedo tipar la respuesta de axios en el composable usePokemonGame

~~~js
const getPokemons = async() =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        console.log(response)

    }
~~~

## Propiedades computadas y orden aleatrorio

- Lo que necesito es el id del pokemon (que viene en la url en la última posición antes del /) y el nombre
- Creo la pokemon.interface.ts

~~~js
export interface Pokemon{
    id: number
    name: string
}
~~~

- Incluyo la interfaz en el archivo de barril

~~~js
export * from './game-status.enum';
export * from './pokemon-list.response';
export * from './pokemon.interface'
~~~

- La url de un pokemon es "https://pokeapi.co/api/v2/pokemon/1/"
- Uso el split para dividir la url por /, me interesa la posición -2 que es dónde está el id
- Uso el .at para indicarle la posición. Este método solo está disponible en JS 2022
- Guardo el id en una constante y le pongo que si no hay id le ponga 0 para que TS no se queje si viene undefined
- Parseo el id a número en el return con un +
- Ahora si puedo regresar el pokemonsArray
- En el onmounted guardo el array en pokemons y los imprimo en consola

~~~js
import { onMounted, ref } from "vue"
import { GameStatus, type Pokemon, type PokemonListResponse } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)

    const getPokemons = async(): Promise<Pokemon[]> =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        
        const pokemonsArray= response.data.results.map(pokemon=>{
            const urlParts= pokemon.url.split('/') //lo corto por el /, el id está en la posición -2
            const id = urlParts.at(-2) ?? 0; //para que no se queje si el id es undefined
           
            return{
                name: pokemon.name,
                id: +id  //parseo el id a número 
            } 
        })

        return pokemonsArray
    }

      onMounted(async ()=>{
       const pokemons= await getPokemons()
       console.log(pokemons)
    })

    return {
        gameStatus
    }
}
~~~

- Para poder usar .at he tenido que agregar estas dos lineas (target y lib) al compilerOptions
- tsconfig.app.json

~~~json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2022", "dom"],

    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
~~~

- Veo en consola que tengo el name y el id en el array
- Ahora voy a necesitar mezclarlos para tenerlos de manera aleatoria
- Math.random va desde 0 a 0.99999999. Es lo que voy a usar cuando retorno el array de pokemons

~~~js
return pokemonsArray.sort(()=> Math.random() - 0.5)
~~~

- Creo una variable reactiva pokemons y en lugar de crear la constante pokemons en el onMounted, uso pokemons.value para guardar los pokemons
- El isLoading es una propiedad computada, ya que depende de si hay o no elementos en pokemons (la variable reactiva que acabao de crear donde guardo los pokemons)

~~~js
import { computed, onMounted, ref } from "vue"
import { GameStatus, type Pokemon, type PokemonListResponse } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)
    
    const pokemons = ref<Pokemon[]>([])

    const isLoading= computed(()=> pokemons.value.length === 0)

    const getPokemons = async(): Promise<Pokemon[]> =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        
        const pokemonsArray= response.data.results.map(pokemon=>{
            const urlParts= pokemon.url.split('/') //lo corto por el /, el id está en la posición -2
            const id = urlParts.at(-2) ?? 0; //para que no se queje si el id es undefined
           
            return{
                name: pokemon.name,
                id: +id  //parseo el id a número 
            } 
        })

        return pokemonsArray.sort(()=> Math.random() - 0.5)

    }

    onMounted(async ()=>{
       pokemons.value= await getPokemons()
       console.log(pokemons)
    })

    return {
        gameStatus,
        isLoading
    }
}
~~~

- Ya puedo usar el isLoading para renderizar el Loading de PokemonGame.vue con un v-if (y el juego con un v-else)

~~~vue
<template>
    <section v-if="isLoading" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        
        <PokemonPicture />
        <PokemonOptions />

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';

const {gameStatus, isLoading} = usePokemonGame()
</script>

<style scoped>

</style>
~~~

- También necesito crearme una variable reactiva para las opciones a elegir de pokemon en usePokemonGame.ts
- La llamaré pokemonOptions
- Creo la función getNextOptions para manejarla
- Le paso cuántos pokemons quiero mostrar en la lista para elegir (para hacerlo más reutilizable si quiero añadirle dificultad)
- Le pongo 4 por defecto
- En pokemons.value tengo todos los pokemones
- Uso slice para cortar desde la posición 0 a la indicada por howMany
- slice no modifica el arreglo, ahora yo debo eliminar esos 4 pokemons del arreglo original
- Vuelvo a usar el slice, pero ahora solo le paso el howmany, para que corte los primeros 4 y quede el arreglo sin ellos
- getNextOptions va a ser el botón que inicie un nuevo juego
- Llamo a la función en el onMounted (si no le paso un valor tiene 4 por defecto)
- usePokemonGame.ts

~~~js
import { computed, onMounted, ref } from "vue"
import { GameStatus, type Pokemon, type PokemonListResponse } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)
    const pokemons = ref<Pokemon[]>([])
    const pokemonOptions= ref<Pokemon[]>([]) //aquí guardaré las 4 opciones de pokemon a elegir

    const isLoading= computed(()=> pokemons.value.length === 0)

    const getPokemons = async(): Promise<Pokemon[]> =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        
        const pokemonsArray= response.data.results.map(pokemon=>{
            const urlParts= pokemon.url.split('/') 
            const id = urlParts.at(-2) ?? 0; 
           
            return{
                name: pokemon.name,
                id: +id  //parseo el id a número 
            } 
        })

        return pokemonsArray.sort(()=> Math.random() - 0.5)

    }

    const getNextOptions = (howMany: number= 4) =>{
        gameStatus.value = GameStatus.Playing
        pokemonOptions.value= pokemons.value.slice(0, howMany) //me quedo con los primeros 4
        pokemons.value = pokemons.value.slice(howMany) //el array se queda sin los primeros 4
    }

    onMounted(async ()=>{
       pokemons.value= await getPokemons()
       getNextOptions()

       //console.log(pokemonOptions.value)  --> tengo 4 pokemons
    })

    return {
        gameStatus,
        isLoading,
        pokemonOptions,
        getNextOptions
    }
}
~~~

## Determinar el pokemon correcto

- Necesito escoger uno de los pokemons de pokemonOptions para que sea el correcto (el de la imagen)
- Hagámoslo como unapropiedad computada randomPokemon
- Uso Math.floor para aplanar el resultado sin decimales (obtener un entero), que redondee, y muliplico el Math.random por la cantidad de pokemons
- Retorno randomPokemon para poder desestructurarlo del composable y renderizarlo en PokemonGame.vue
- usePokemonGame.ts

~~~js
const pokemonOptions= ref<Pokemon[]>([])

    const randomPokemon= computed(()=>{
        return pokemonOptions.value[Math.floor(Math.random()* pokemonOptions.value.length)]
    })
~~~

- Renderizo el randomPokemon en PokemonGame

~~~vue
<template>
    <section v-if="isLoading" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <h3>{{ randomPokemon }}</h3>
        
        <PokemonPicture />
        <PokemonOptions />

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';

const {gameStatus, isLoading, randomPokemon} = usePokemonGame()
</script>

<style scoped>

</style>
~~~

## Componente PokemonPicture

- Ya tenemos el pokemon correcto (randomPokemon, que está en la lista de las 4 opciones a elegir)
- Ahora debo mandarle la imagen a PokemonPicture, lo haremos a través del id
- PokemonGame.vue

~~~vue
 <PokemonPicture :pokemon-id="randomPokemon?.id"/>
~~~

- En PokemonPicture recibamos esta property
- Defino las props
- Hago una propiedad computada basada en el pokemon que le mando
- Hago un bind en el src para pasarle la imagen

~~~vue
<template>
  <section>
    <img 
    class="brightness-0 h-[200px]"
    :src="pokemonImage">
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';


  interface Props{
    pokemonId: number | undefined
  }

const props=  defineProps<Props>();

  const pokemonImage = computed(
    ()=> `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${props.pokemonId}.svg`
  )

</script>

<style scoped>
/*para que la persona pno pueda mover la imagen oscura y ver cual es*/
img{
    user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select:none
}
</style>
~~~

- Ahora ya tengo la imagen de una de las 4 opciones, el nombre y la imagen de randomPokemon es el correcto
- En PokemonGame.vue añado una condición al v-if, que randomPokemon.id sea null

~~~vue
<template>
    <section v-if="isLoading || randomPokemon?.id == null" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <h3>{{ randomPokemon }}</h3>
        
        <PokemonPicture :pokemon-id="randomPokemon?.id"/>
        <PokemonOptions />

    </section>
</template>
~~~

- Tenemos que recibir otra propiedad para mostrar la imagen real del pokemon (con brightness y que no se vea osucra)
- Llamo a la property show-pokemon, es un boolean. Lo pongo en true para hacer la prueba, pero será dinámico

~~~js
<PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="true"/>
~~~

- En PokemonPicture.vue, puedo usar la función withDefaults pasándole las props, y de segundo argumento un objeto con las props por defecto
- Uso un v-if con el !showPokemon para la imagen en false por defecto (con el brightness a 0, se ve una sombra de la imagen) y un v-else para mostrar la imagen real (con colores)
- Le añado la calse fade-in que tengo en el animations.css (tiene que estar importado en el main!)

~~~vue
<template>
  <section>
    <img v-if="!showPokemon" class="brightness-0 h-[200px]" :src="pokemonImage">
    <img v-else class=" fade-in h-[200px]" :src="pokemonImage">
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';


  interface Props{
    pokemonId: number | undefined
    showPokemon?: boolean
  }

const props=  withDefaults(defineProps<Props>(), {
  showPokemon: false
});

  const pokemonImage = computed(
    ()=> `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${props.pokemonId}.svg`
  )

</script>

<style scoped>
/*para que la persona pno pueda mover la imagen oscura y ver cual es*/
img{
    user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select:none
}
</style>
~~~

- Determinaremos este true y false según el gameStatus
- En playing estará en false, en won o lost estará en true (mostrará la imagen)
- Desestructuro el gameStatus del composable y hago la logica en el :show-pokemon
- Se muestra solo si no está jugando

~~~js
<PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="gameStatus != GameStatus.Playing"/>
~~~

## Mostrar las posibles opciones

- Es el momento de trabajar con el componente PokemonOptions
- Desde PokemonGame,vue, Puedo usar un alias en la desestructuración del composable para no confundirme usando :
- PokemonGame.vue

~~~vue
<template>
    <section v-if="isLoading || randomPokemon?.id == null" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <h3>{{ randomPokemon }}</h3>
        
        <PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="gameStatus != GameStatus.Playing"/>
        <PokemonOptions :options="options"/>

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';
import { GameStatus } from '../interfaces';
                                                    //uso un alias
const {gameStatus, isLoading, randomPokemon, pokemonOptions:options} = usePokemonGame()
</script>

<style scoped>

</style>
~~~

- En PokemonOptions.vue tengo que definir las props
- Uso un v-for en el botón, siempre debo pasarle el key
- Uso la clase capitalize para que paraezca la primera letra del nombre en mayúsculas
- Cambio li por button en el style

~~~vue
<template>
  <section class="mt-5 flex flex-col">
    <button v-for="{name, id} in options" :key="id" class="capitalize">
      {{ name }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { Pokemon } from '../interfaces';


interface Props{
  options: Pokemon[]
}

defineProps<Props>()
</script>

<style scoped>
@reference "tailwindcss";

button{
    @apply bg-white rounded-lg shadow-md p-3 m-2 cursor-pointer w-40 text-center transition-all hover:bg-gray-100
}
</style>
~~~

- Cuando toco una de las opciones (alguno de los botones) yo tengo que **emitir** qué opción es
- Uso defineEmits en el script setup de PokemonOptions
- Puedo usar el tipado entre llaves, poniendo la propiedad a emitir tipada entre corchetes

~~~js
defineEmits<{
  selectedOption: [id: number]
}>()
~~~

- Tengo que decirle al componente que emita el valor, para ello usamos **@click**
- Le paso el evento entre comillas, y como segundo parámetro el valor 

~~~vue
<button v-for="{name, id} in options" :key="id" class="capitalize" @click="$emit('selectedOption', id)">
{{ name }}
</button>
~~~

- Vayamos al componente padre (PokemonGame.vue) a recoger ese evento con @selected-option
- Hagamos una función onSelectedOption con un console.log para comprobar que el id se está pasando correctamente

~~~vue
<template>
    <section v-if="isLoading || randomPokemon?.id == null" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <h3>{{ randomPokemon }}</h3>
        
        <PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="gameStatus != GameStatus.Playing"/>
        <PokemonOptions :options="options" @selected-option="onSelectedOption"/>

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';
import { GameStatus } from '../interfaces';
                                                    //uso un alias
const {gameStatus, isLoading, randomPokemon, pokemonOptions:options} = usePokemonGame()

const onSelectedOption= (value: number)=> console.log(value)
</script>

<style scoped>

</style>
~~~

- Cuando el jugador elige una opción vamos a bloquear los botones
- Ahora me interesa determinar que la persona ganó
- Si el id del botón presionado hace match con el del randomPokemon la persona ganó

## Determinar si la persona gana o pierde


- Renderizamos en PokemonGame.vue el gameStatus en vez del randomPokemon, para que se vea Playing si estamos jugando, Win si ganamos o Lost si perdemos
- En el composable usePokemonGame.ts es donde haremos la lógica, con la función checkAnswer
- Para el confetti usaremos canvas-confetti (npm i canvas-confetti, instalo los @types)
- usePokemonGame.ts

~~~js
import { computed, onMounted, ref } from "vue"
import { GameStatus, type Pokemon, type PokemonListResponse } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"
import confetti from 'canvas-confetti'

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)
    const pokemons = ref<Pokemon[]>([])
    const pokemonOptions= ref<Pokemon[]>([])

    const randomPokemon= computed(()=>{
        return pokemonOptions.value[Math.floor(Math.random()* pokemonOptions.value.length)]
    })

    const isLoading= computed(()=> pokemons.value.length === 0)

    const getPokemons = async(): Promise<Pokemon[]> =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        
        const pokemonsArray= response.data.results.map(pokemon=>{
            const urlParts= pokemon.url.split('/') //lo corto por el /, el id está en la posición -2
            const id = urlParts.at(-2) ?? 0; //para que no se queje si el id es undefined
           
            return{
                name: pokemon.name,
                id: +id  //parseo el id a número 
            } 
        })

        return pokemonsArray.sort(()=> Math.random() - 0.5)

    }

    const getNextOptions = (howMany: number= 4) =>{
        gameStatus.value = GameStatus.Playing
        pokemonOptions.value= pokemons.value.slice(0, howMany)
        pokemons.value = pokemons.value.slice(howMany)
    }

    const checkAnswer=(id: number)=>{
        const hasWon = randomPokemon.value?.id === id
        if(hasWon){
            gameStatus.value = GameStatus.Won
            confetti({
                particleCount: 300,
                spread: 150,
                origin: {y:0.6}
            })
        }
    }

    onMounted(async ()=>{
       pokemons.value= await getPokemons()
       getNextOptions()
    })

    return {
        gameStatus,
        isLoading,
        pokemonOptions,
        getNextOptions,
        randomPokemon,
        checkAnswer
    }
}
~~~

- Desestructuro en el componente padre PokemonGame checkAnswer del composable usePokemonGame
- Coloco la función en el @selected-option

~~~vue
<template>
    <section v-if="isLoading || randomPokemon?.id == null" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <h3>{{ gameStatus }}</h3>
        
        <PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="gameStatus != GameStatus.Playing"/>
        <PokemonOptions :options="options" @selected-option="checkAnswer"/>

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';
import { GameStatus } from '../interfaces';
                                                    //uso un alias
const {gameStatus, isLoading, randomPokemon, pokemonOptions:options, checkAnswer} = usePokemonGame()

</script>

<style scoped>

</style>
~~~

- Ahora, si le doy a la opción indicada en uno de los botones, cambia el status solo si acierto (pone Won) y salta el confetti
- Falta la lógica de si la persona no gana en el composable usePokemonGame.ts

~~~js
const checkAnswer=(id: number)=>{
        const hasWon = randomPokemon.value?.id === id
        if(hasWon){
            gameStatus.value = GameStatus.Won
            confetti({
                particleCount: 300,
                spread: 150,
                origin: {y:0.6}
            })
            return
        }
        gameStatus.value= GameStatus.Lost
    }
~~~

- De esta manera, cuando pierdo me muestra la imagen y cambia el status, pero todavía puedo darle a otras opciones hasta acertar
- Hay que bloquear los botones una vez ganó o perdió y añadir un botón para un nuevo juego

## Bloquear opciones

- Vamos a mandar una nueva property a PokemonOptions, la llamaremos block-selection 

~~~js
<PokemonOptions 
        :options="options" 
        @selected-option="checkAnswer" 
        :block-selection="gameStatus != GameStatus.Playing"/>
~~~

- Añado la prop en el componente PokemonOptions
- Quiero saber cuando fallé cuál era la opción correcta, remarquémosla
- Puedo ponerle a class :, que quede **:class** y usar corchetes (entre comillas) para poner clases de CSS y loógica
- Cuando mando un objeto es una forma condicional de mandar CSS
- Necesito recibir la respuesta correcta en el PokemonOptions para aplicar clases de manera condicional a los botones, para mostrar en azul si ha acertado y en rojo cuando sea una opción incorrecta
- Le paso otra property llamada correct-answer a PokemonOptions que recibirá desde el padre PokemonGame
- Debo declararla en las props de PokemonOptions
- La clase correct o incorrect solo se aplicará si el blockSelection está en true, para que no se muestren marcadas las opciones sin ni siquiera haber jugado

~~~js
<template>
  <section class="mt-5 flex flex-col">
    <button v-for="{name, id} in options" :key="id" 
    :class="['capitalize disabled:shadow-none disbaled:bg-gray-300',{
      correct: id === correctAnswer && blockSelection,
      incorrect: id !== correctAnswer && blockSelection
    }]"
    @click="$emit('selectedOption', id)"
    :disabled="blockSelection"
    >
      {{ name }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { Pokemon } from '../interfaces';


interface Props{
  options: Pokemon[],
  blockSelection: boolean,
  correctAnswer: number
}

defineProps<Props>()

defineEmits<{
  selectedOption: [id: number]
}>()

</script>

<style scoped>
@reference "tailwindcss";

button{
    @apply bg-white rounded-lg shadow-md p-3 m-2 cursor-pointer w-40 text-center transition-all hover:bg-gray-100
}

.correct{
  @apply bg-blue-500 text-white
}

.incorrect{
  @apply bg-red-100 opacity-70
}
</style>
~~~

## Nuevo juego

- Un cambio. Para cambiar el nombre de una función en todos los lugares presionaremos F2 con la función clicada
  - Cambiaremos GetNextOptions por getNextRound
- usePokemonGames.ts
~~~js
import { computed, onMounted, ref } from "vue"
import { GameStatus, type Pokemon, type PokemonListResponse } from "../interfaces"
import { pokemonApi } from "../api/pokemon-api"
import confetti from 'canvas-confetti'

export const usePokemonGame =()=>{

    const gameStatus = ref<GameStatus>(GameStatus.Playing)
    const pokemons = ref<Pokemon[]>([])
    const pokemonOptions= ref<Pokemon[]>([])

    const randomPokemon= computed(()=>{
        return pokemonOptions.value[Math.floor(Math.random()* pokemonOptions.value.length)]
    })

    const isLoading= computed(()=> pokemons.value.length === 0)

    const getPokemons = async(): Promise<Pokemon[]> =>{
        const response = await pokemonApi.get<PokemonListResponse>('/?limit=151')
        
        const pokemonsArray= response.data.results.map(pokemon=>{
            const urlParts= pokemon.url.split('/') //lo corto por el /, el id está en la posición -2
            const id = urlParts.at(-2) ?? 0; //para que no se queje si el id es undefined
           
            return{
                name: pokemon.name,
                id: +id  //parseo el id a número 
            } 
        })

        return pokemonsArray.sort(()=> Math.random() - 0.5)

    }

    const getNextRound = (howMany: number= 4) =>{
        gameStatus.value = GameStatus.Playing
        pokemonOptions.value= pokemons.value.slice(0, howMany)
        pokemons.value = pokemons.value.slice(howMany)
    }

    const checkAnswer=(id: number)=>{
        const hasWon = randomPokemon.value?.id === id
        if(hasWon){
            gameStatus.value = GameStatus.Won
            confetti({
                particleCount: 300,
                spread: 150,
                origin: {y:0.6}
            })
            return
        }
        gameStatus.value= GameStatus.Lost
    }

    onMounted(async ()=>{
       pokemons.value= await getPokemons()
       getNextRound()
    })

    return {
        gameStatus,
        isLoading,
        pokemonOptions,
        getNextRound,
        randomPokemon,
        checkAnswer,
    
    }
}
~~~

- Ahora si, creemos un botón que dispare la función y que aparezca solo cuando no se esté en GameStatus.Playing
- Pongo el botón dentro de un div para darle espacio
- PokemonGame.vue

~~~js
<template>
    <section v-if="isLoading || randomPokemon?.id == null" class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="text-3xl">Esper, por favor</h1>
        <h3 class="animate-pulse">Cargando pokemons...</h3>
    </section>
    <section v-else class="flex flex-col justify-center items-center w-screen h-screen">
        <h1 class="m-5">¿Quién es este Pokemón?</h1>
        <div class="h-20">
            <button class="m-3 p-4 bg-blue-500 text-white rounded-md"
            v-if="gameStatus != GameStatus.Playing"
            @click="getNextRound(4)"
            >¿Nuevo juego?</button>
        </div>
        
        
        <PokemonPicture :pokemon-id="randomPokemon?.id" :show-pokemon="gameStatus != GameStatus.Playing"/>
        <PokemonOptions 
        :options="options" 
        @selected-option="checkAnswer" 
        :block-selection="gameStatus != GameStatus.Playing"
        :correct-answer="randomPokemon.id"
        />

    </section>
</template>

<script setup lang="ts">
import PokemonOptions from '../components/PokemonOptions.vue';
import PokemonPicture from '../components/PokemonPicture.vue';
import { usePokemonGame } from '../composables/usePokemonGame';
import { GameStatus } from '../interfaces';
                                                    //uso un alias
const {gameStatus, isLoading, randomPokemon, pokemonOptions:options, checkAnswer, getNextRound} = usePokemonGame()

</script>

<style scoped>

</style>
~~~

- Podemos configurar el path para usar alias y reducir el largo de las importaciones
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@pokemon': fileURLToPath(new URL('./src/modules/pokemon', import.meta.url)),
    },
  },
})
~~~

- En el tsconfig.app.json también debemos añadir el nuevo alias

~~~json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2022", "dom"],

    "paths": {
      "@/*": ["./src/*"],
      "@pokemon/*": ["./src/modules/pokemon/*"]
    }
  }
}
~~~
-----

## Explicacion argumentos función setup y eventos

Te explico: en la Composition API de Vue 3, `setup()` es la función donde defines la lógica reactiva de tu componente. La diferencia está en **qué necesita acceso a la instancia del componente** y qué no.

## **Lo que NO se pasa como argumentos**:
```javascript
import { ref, computed, onMounted } from 'vue'

export default defineComponent({
  setup() {
    // Variables reactivas básicas
    const count = ref(0)
    const double = computed(() => count.value * 2)
    
    // Hooks del ciclo de vida
    onMounted(() => {
      console.log('Componente montado')
    })
    
    // Funciones normales
    const increment = () => {
      count.value++
    }
    
    return { count, double, increment }
  }
})
```

## **Lo que SÍ se pasa como argumentos**:
El `setup()` recibe dos parámetros cuando necesita interactuar con:

### 1. **`props`** - Acceder a las props
```javascript
export default defineComponent({
  props: {
    title: String,
    initialCount: Number
  },
  
  setup(props) {  // ← props como primer argumento
    // Usar props dentro de lógica reactiva
    const count = ref(props.initialCount || 0)
    const titleWithCount = computed(() => 
      `${props.title}: ${count.value}`
    )
    
    return { count, titleWithCount }
  }
})
```

### 2. **`context`** - Acceder al contexto del componente
```javascript
export default defineComponent({
  setup(props, context) {  // ← context como segundo argumento
    
    // Acceder a:
    // a) Eventos emitidos
    const emitEvent = () => {
      context.emit('custom-event', 'datos')  // Emitir eventos
    }
    
    // b) Slots
    console.log(context.slots.default())  // Acceder a slots
    
    // c) Attrs (atributos no declarados como props)
    console.log(context.attrs.class)  // Clases CSS no declaradas
    
    // d) Exponer métodos públicos (raro, pero posible)
    context.expose({ publicMethod: () => {} })
    
    return { emitEvent }
  }
})
```

## **Ejemplo completo combinado**:
```javascript
import { ref, computed } from 'vue'

export default defineComponent({
  props: {
    initialValue: {
      type: Number,
      default: 0
    }
  },
  
  emits: ['value-changed'],  // Eventos declarados
  
  setup(props, { emit }) {  // ← Desestructuración de context
    
    // Lógica reactiva usando props
    const count = ref(props.initialValue)
    
    const increment = () => {
      count.value++
      emit('value-changed', count.value)  // Emitir evento
    }
    
    const double = computed(() => count.value * 2)
    
    return {
      count,
      increment,
      double
    }
  }
})
```

## **¿Por qué esta diferencia?**

1. **`props` se pasa como argumento** porque:
   - Necesitas acceder a valores que vienen del padre
   - Vue necesita saber que tu `setup()` depende de ciertas props para la reactividad

2. **`context` se pasa como argumento** porque:
   - Proporciona acceso a características específicas de la instancia del componente
   - Permite emitir eventos, acceder a slots, etc.

3. **Lo demás no se pasa** porque:
   - `ref()`, `computed()`, `onMounted()` son funciones independientes del ciclo de vida
   - No necesitan conocer la instancia específica del componente para funcionar

## **Alternativa con `<script setup>` (SFC)**:
En componentes de un solo archivo (Single File Components):
```vue
<script setup>
// Props y emits se declaran de forma diferente
const props = defineProps(['initialValue'])
const emit = defineEmits(['value-changed'])

// El resto igual que antes
const count = ref(props.initialValue)
const increment = () => {
  count.value++
  emit('value-changed', count.value)
}
</script>
```

**Conclusión**: Pasas como argumentos solo lo que necesita interactuar directamente con la instancia del componente (props y contexto). La lógica reactiva pura no necesita estos argumentos.


# Ejemplo completo con `<script setup>`, `defineEmits` y padre

## **Componente Hijo (ChildComponent.vue)**
Este componente emitirá eventos al padre:

```vue
<template>
  <div class="child">
    <h3>Componente Hijo</h3>
    <p>Contador interno: {{ internalCount }}</p>
    
    <button @click="increment">Incrementar +1</button>
    <button @click="reset">Reiniciar a 0</button>
    <button @click="sendCustomData">
      Enviar datos personalizados
    </button>
    
    <!-- Input para enviar texto -->
    <div style="margin-top: 20px">
      <input 
        v-model="message" 
        placeholder="Escribe un mensaje"
        @keyup.enter="sendMessage"
      />
      <button @click="sendMessage">Enviar Mensaje</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps } from 'vue'

// 1. Definir las props que recibe (opcional)
const props = defineProps({
  initialCount: {
    type: Number,
    default: 0
  }
})

// 2. Definir los eventos que emite
const emit = defineEmits([
  'increment',          // Evento simple
  'reset',              // Evento sin datos
  'custom-event',       // Evento con datos complejos
  'message-sent',       // Evento con string
  'update:count'        // Convención para v-model
])

// 3. Estado interno del componente hijo
const internalCount = ref(props.initialCount)
const message = ref('')

// 4. Funciones que emiten eventos
const increment = () => {
  internalCount.value++
  
  // Emitir evento con datos (número)
  emit('increment', internalCount.value)
  
  // También emitir con formato v-model
  emit('update:count', internalCount.value)
}

const reset = () => {
  internalCount.value = 0
  
  // Emitir evento sin datos
  emit('reset')
  
  // Emitir para v-model
  emit('update:count', internalCount.value)
}

const sendCustomData = () => {
  // Emitir evento con objeto complejo
  emit('custom-event', {
    count: internalCount.value,
    timestamp: new Date().toISOString(),
    randomId: Math.random().toString(36).substring(7)
  })
}

const sendMessage = () => {
  if (message.value.trim()) {
    // Emitir evento con string
    emit('message-sent', message.value)
    message.value = ''
  }
}
</script>

<style scoped>
.child {
  border: 2px solid #42b883;
  padding: 20px;
  border-radius: 10px;
  margin: 10px;
  background-color: #f9f9f9;
}

button {
  margin: 5px;
  padding: 8px 16px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #33a06f;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
}
</style>
```

## **Componente Padre (ParentComponent.vue)**
Este componente recibe y maneja los eventos:

```vue
<template>
  <div class="parent">
    <h2>Componente Padre</h2>
    
    <!-- Mostrar estado del padre -->
    <div class="stats">
      <p>Contador en padre: {{ parentCount }}</p>
      <p>Último mensaje: {{ lastMessage || 'Ninguno aún' }}</p>
      <p>Último evento personalizado:</p>
      <pre>{{ lastCustomEvent || 'Ninguno aún' }}</pre>
    </div>
    
    <!-- Usar componente hijo -->
    <ChildComponent 
      :initial-count="5"
      @increment="handleIncrement"
      @reset="handleReset"
      @custom-event="handleCustomEvent"
      @message-sent="handleMessage"
      @update:count="handleCountUpdate"
      v-model:count="parentCount"  <!-- Sintaxis v-model -->
    />
    
    <!-- Otro hijo independiente -->
    <ChildComponent 
      @increment="(count) => console.log('Segundo hijo:', count)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

// Estado del componente padre
const parentCount = ref(0)
const lastMessage = ref('')
const lastCustomEvent = ref(null)

// Funciones manejadoras de eventos
const handleIncrement = (newCount) => {
  console.log('Evento "increment" recibido:', newCount)
  // Aquí podrías actualizar estado del padre si es necesario
}

const handleReset = () => {
  console.log('Evento "reset" recibido')
  parentCount.value = 0
}

const handleCustomEvent = (data) => {
  console.log('Evento personalizado recibido:', data)
  lastCustomEvent.value = JSON.stringify(data, null, 2)
}

const handleMessage = (message) => {
  console.log('Mensaje recibido:', message)
  lastMessage.value = message
  alert(`Mensaje del hijo: "${message}"`)
}

const handleCountUpdate = (newValue) => {
  console.log('Evento update:count recibido:', newValue)
  // parentCount ya se actualiza automáticamente con v-model
}
</script>

<style scoped>
.parent {
  border: 3px solid #35495e;
  padding: 25px;
  border-radius: 12px;
  max-width: 600px;
  margin: 20px auto;
  background-color: #f0f8ff;
}

.stats {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  overflow-x: auto;
}

h2 {
  color: #35495e;
  margin-bottom: 20px;
}
</style>
```

## **App.vue (Componente raíz)**
```vue
<template>
  <div id="app">
    <h1>Comunicación Padre-Hijo en Vue 3</h1>
    <p>Usando script setup y defineEmits</p>
    
    <ParentComponent />
  </div>
</template>

<script setup>
import ParentComponent from './components/ParentComponent.vue'
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

body {
  margin: 0;
  padding: 20px;
  background-color: #f8f9fa;
}
</style>
```

## **Características clave demostradas:**

1. **`defineEmits()`** para declarar eventos en el hijo
2. **`emit('nombre-evento', datos)`** para emitir eventos
3. **`@evento="handler"`** para escuchar en el padre
4. **Tipos de datos enviados:**
   - Números: `emit('increment', count)`
   - Strings: `emit('message-sent', message)`
   - Objetos complejos: `emit('custom-event', { ... })`
   - Sin datos: `emit('reset')`

5. **v-model personalizado** con `update:propName`
6. **Múltiples hijos** independientes

## **Para ejecutar este ejemplo:**

1. Crea un proyecto Vue 3:
```bash
npm create vue@latest
# o
npm init vue@latest
```

2. Crea los componentes en `src/components/`

3. Reemplaza el contenido de `App.vue`

La comunicación fluye así: **Hijo emite → Padre escucha → Padre ejecuta función**

**¡Excelente pregunta!** Hay dos formas distintas de emitir eventos en Vue, y la confusión es común:

## **1. `$emit` - Options API (Vue 2 / Options API de Vue 3)**
Se usa **dentro del template** o en métodos con `this`:

```vue
<!-- Options API - Template -->
<template>
  <button @click="$emit('increment', 1)">Incrementar</button>
  <!-- $emit directamente en el template -->
</template>

<script>
export default {
  methods: {
    increment() {
      this.$emit('increment', 1) // $emit con this
    }
  }
}
</script>
```

## **2. `emit()` - Composition API (Vue 3 con setup())**
Se obtiene del contexto y se usa en el `setup()`:

```vue
<!-- Composition API con <script setup> -->
<script setup>
import { defineEmits } from 'vue'

// Declarar los eventos
const emit = defineEmits(['increment', 'reset'])

const handleClick = () => {
  emit('increment', 1) // Usar la función emit
}
</script>

<template>
  <!-- Usamos función, NO $emit directo -->
  <button @click="handleClick">Incrementar</button>
  <!-- O directamente en el template: -->
  <button @click="emit('increment', 1)">Otro botón</button>
</template>
```

## **3. `emit()` - Composition API (setup() function)**
```vue
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  setup(props, { emit }) { // emit desestructurado del contexto
    const handleClick = () => {
      emit('increment', 1)
    }
    
    return { handleClick }
  }
})
</script>
```

## **Comparación lado a lado:**

| Característica | `$emit` (Options API) | `emit()` (Composition API) |
|----------------|----------------------|---------------------------|
| **Donde se usa** | En template o métodos | En script setup o setup() |
| **Acceso** | `this.$emit()` | `const emit = defineEmits()` |
| **Declaración** | `emits: ['evento']` | `defineEmits(['evento'])` |
| **En template** | `@click="$emit('evento')"` | `@click="emit('evento')"` |
| **Recomendación** | Vue 2 o Options API | Vue 3 Composition API |

## **Ejemplo práctico completo:**

### **Componente Hijo (ChildComponent.vue)**
```vue
<script setup>
import { ref } from 'vue'

// Definir eventos que se emitirán
const emit = defineEmits(['saludo', 'contador'])

const nombre = ref('Juan')
const contador = ref(0)

// Función que emite evento
function enviarSaludo() {
  emit('saludo', `¡Hola desde ${nombre.value}!`)
}

// Función que emite con datos
function incrementar() {
  contador.value++
  emit('contador', {
    valor: contador.value,
    timestamp: new Date().toISOString()
  })
}

// Emitir directamente en template también es válido
const emitDirecto = () => emit('saludo', 'Mensaje directo')
</script>

<template>
  <div>
    <!-- Opción 1: Llamar a función que emite -->
    <button @click="enviarSaludo">Saludar (función)</button>
    
    <!-- Opción 2: Emitir directamente en template -->
    <button @click="emit('saludo', 'Directo desde template')">
      Saludar (directo)
    </button>
    
    <!-- Opción 3: Usar función intermedia -->
    <button @click="emitDirecto">Saludar (intermedio)</button>
    
    <button @click="incrementar">Contador: {{ contador }}</button>
  </div>
</template>
```

### **Componente Padre (ParentComponent.vue)**
```vue
<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const mensajeRecibido = ref('')
const ultimoContador = ref(null)

// Función que maneja el evento 'saludo'
function manejarSaludo(mensaje) {
  mensajeRecibido.value = mensaje
  console.log('Saludo recibido:', mensaje)
}

// Función que maneja el evento 'contador'
function manejarContador(datos) {
  ultimoContador.value = datos
  console.log('Contador actualizado:', datos)
}
</script>

<template>
  <div>
    <h2>Mensaje: {{ mensajeRecibido }}</h2>
    <p>Último contador: {{ ultimoContador?.valor }}</p>
    
    <!-- Escuchar eventos del hijo -->
    <ChildComponent 
      @saludo="manejarSaludo"
      @contador="manejarContador"
    />
    
    <!-- También puedes usar función inline -->
    <ChildComponent 
      @saludo="(msg) => console.log('Inline:', msg)"
    />
  </div>
</template>
```

## **¿Por qué el cambio en Composition API?**

1. **Sin `this`**: Composition API no usa `this`, por eso no hay `this.$emit`
2. **Mejor tipado**: `defineEmits` permite tipado TypeScript
3. **Más explícito**: Declaras explícitamente qué eventos emites

## **Tipado TypeScript (opcional pero recomendado):**
```vue
<script setup lang="ts">
// Con tipado TypeScript
const emit = defineEmits<{
  saludo: [mensaje: string]  // Un parámetro string
  contador: [datos: { valor: number, timestamp: string }]  // Objeto
  reset: []  // Sin parámetros
}>()

// Ahora TypeScript valida los tipos:
emit('saludo', 'Hola') // ✓ Correcto
emit('saludo', 123) // ✗ Error: debe ser string
emit('contador', { valor: 1, timestamp: '...' }) // ✓ Correcto
</script>
```

## **Resumen:**
- **`$emit`** → Options API (Vue 2 o Vue 3 Options API)
- **`emit()`** → Composition API (Vue 3 con `<script setup>` o `setup()`)
- **En el padre**, siempre recibes igual: `@evento="funcionManejadora"`
- **El manejador** recibe automáticamente los argumentos emitidos

**Regla mnemotécnica**: Si usas `<script setup>`, usa `defineEmits()` y `emit()`. Si usas Options API (con `export default {}`), usa `$emit`.

-----

