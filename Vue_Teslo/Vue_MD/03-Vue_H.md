# 03 Vue Herrera - Indecision App

## Objetivo de la sección

- Crearemos un chat
- Las respuestas las obtendremos de un API de Yes No que devuelve una imagen con un Si o un NO
- No hay IA aquí
- Vamos a tener scroll en la caja del chat
- Vamos a aprender sobre elenvío y comunicación entre componentes, manejo de estado, composables, etc
- Borramos toda la lógica de los contadores

## Estructura y diseño del chat

- Gist - Estructura a utilizar (chat simplificado con la etiqueta template de Vue)

~~~vue
<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
        <!-- Messages go here -->
        <!-- Example Message -->
        <div class="flex justify-end">
          <div class="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
            Hey, how's your day going?
          </div>
        </div>

        <!-- Example Received Message -->
        <div class="flex">
          <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
            Not too bad, just a bit busy. How about you?
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 flex items-center">
      <input
        type="text"
        placeholder="Type your message..."
        class="flex-1 border rounded-full px-4 py-2 focus:outline-none"
      />
      <button
        class="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#ffffff"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </button>
    </div>
  </div>
</template>
~~~

- Creo un nuevo directorio src/views/IndecisionView.vue
- Pego el código del Gist
- Lo renderizo en App.vue

~~~vue
<template>
 <IndecisionView />
</template>

<script lang="ts" setup>
import IndecisionView from './views/IndecisionView.vue';

</script>
~~~

- Nos da el layout del chat pero falta la lógica
- En tsconfig.app.json tenemos configurado el path relativo con la arroba

~~~json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",

    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
~~~

- Eso significa que puedo usar @ para entrar en src en las importaciones

~~~js
import IndecisionView from '@/views/IndecisionView.vue';
~~~

- Se pueden separar las herramientas en otra ventana si molestan con Alt+Shift+D

> http://localhost:5173/__devtools__/

- Aunque podríamos trabajar sobre el código dado, lo recomendable sería trabajar con **componentes pequeños más controlables**
- Creo components/chat/Chatmessages.Vue
- Coloco la etiqueta template y dentro el código de los chat messages
- ChatMessages.vue

~~~vue
<template>
     <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
        <!-- Messages go here -->
        <!-- Example Message -->
        <div class="flex justify-end">
          <div class="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
            Hey, how's your day going?
          </div>
        </div>

        <!-- Example Received Message -->
        <div class="flex">
          <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
            Not too bad, just a bit busy. How about you?
          </div>
        </div>
      </div>
    </div>
</template>
~~~

- Renderizo ChatMessages en el IndecisionView.vue
- Creo MessageBox.vue

~~~vue
<template>
    <div class="bg-white p-4 flex items-center">
      <input
        type="text"
        placeholder="Type your message..."
        class="flex-1 border rounded-full px-4 py-2 focus:outline-none"
      />
      <button
        class="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#ffffff"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </button>
    </div>
</template>
~~~

- Lo renderizo en IndecisionView.vue, quedando así

~~~vue
<script setup lang="ts">
import ChatMessages from '@/components/chat/ChatMessages.vue';
import MessageBox from '@/components/chat/MessageBox.vue';

</script>

<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

   <ChatMessages />
   
    <MessageBox />
  </div>
</template>
~~~

- Si hay warnings en la consola, estos se quedan porque Vite lo que hace es el reemplazo de módulos en caliente, no hace un full reload, no significa que no se haya solucionado

## Diseño de mensajes

- Creamos un nuevo componente para manejar las burbujas de los mensajes
- Pego los mensajes dentro de ChatMessages.vue
- ChatBubble.vue

~~~vue
<template>
    <div class="flex justify-end">
          <div class="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
            Hey, how's your day going?
          </div>
        </div>

        <!-- Example Received Message -->
        <div class="flex">
          <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
            Not too bad, just a bit busy. How about you?
          </div>
        </div>
</template>
~~~

- Renderizo ChatBubble en ChatMessages.vue
- Voy a recibir unas props en este ChatBubble.vue

~~~vue
<script lang="ts" setup>
    interface Props{
        message: string;
        itsMine: boolean; //si el mensaje es mio
        image?: string
    }
    defineProps<Props>(); //importante definir las props para pasárselas al componente
</script>
~~~

- Mediante el itsMine (que identifica si el mensaje es mio o no) va a tener unas características de tailwind distintas, ya que si es mio el mensaje se sitúa a la derecha, y los de mi esposa a la izquierda (básicamente si es mio tiene la clase de tailwind justify-end)
- Puedo usar **:class** y hacer un ternario
- Pero en este caso es más sencillo usar un v-if y un v-else. Si tiene el itsMine en true irá a la derecha

~~~vue
<template>
    <div v-if="itsMine" class="flex justify-end">
          <div class="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
            {{ message }}
          </div>
        </div>

        <!-- Example Received Message -->
        <div v-else class="flex">
          <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
            {{ message }}
          </div>
        </div>
</template>
~~~

- Se podría hacer en un único componente y usar :class, usar ternarios para colocar el css, etc
- Debo pasarle el itsMine al componente que renderizo en ChatMessages
- Para mandar el true (y no un string) debo usar el v-bind (versión abreviada :)
- El message lo paso como string si no le paso el v-bind
- Para que lo pase como string lo pongo con comilla sencilla dentro de las comillas dobles

~~~vue
<ChatBubble :its-mine="true" :message="'Hola Mundo'"/>
~~~

- También podría pasarse así al ser un booleano en true y el message un string

~~~vue
<ChatBubble its-mine message="Hola Mundo"/>
~~~

- Copio la linea y le pongo el its-mine en false para tener la respuesta del mensaje de mi esposa a la izquierda

~~~vue
<ChatBubble :its-mine="true" :message="'Hola Mundo'"/>
<ChatBubble :its-mine="false" :message="'Hola Mundo'"/>
~~~



- Arreglamos el mensaje de mi esposa para lo que será la respuestsa de la API (con un YES o NO y una imagen)
- Como la imagen puede venir o no, usamos un v-if

~~~js
<div v-else class="flex">
  <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
    <span class="capitalize">{{ message }}</span>
    <img v-if="image" :src="image" alt="YesNoImage" class="w-52 h-52 object-cover rounded-md">
  </div>
</div>
~~~

- La API es yesno.wtf/#
- La url de la imagen desde la página de la API no funciona

~~~json
{
  "answer": "yes",
  "forced": false,
  "image": "https://yesno.wtf/assets/yes/2.gif" //no funciona
}
~~~

- Mejor usamos POSTMAN con la url del sitio (sin el numeral)

> https://yesno.wtf/api

- Esto devuelve

~~~json
{
    "answer": "yes",
    "forced": false,
    "image": "https://yesno.wtf/assets/yes/2-5df1b403f2654fa77559af1bf2332d7a.gif"
}
~~~

- Copiamos la url que devuelve POSTMAN y probamos la imagen para ver si queda bien

~~~vue
<ChatBubble :its-mine="false" :message="'yes'" image="https://yesno.wtf/assets/yes/2-5df1b403f2654fa77559af1bf2332d7a.gif"/>
~~~

- Vamos con la lógica

## Comunicación entre componentes

- Luego lo transformaremos un un composable
- La comunicación entre componentes es algo sumamente importante
- Creo una propiedad reactiva messages como un arreglo vacío en IndecisionView.vue
- Para tiparlo creo en src/interfaces/chat-message.interface.ts

~~~js
export interface ChatMessage{
    id: number;
    message: string;
    itsMine: boolean;
    image?: string;
}
~~~

- Ya puedo tipar el arreglo de mensajes
- Se lo paso a ChatMessages (que todavía no lo tiene implementado)
- IndecisionView.vue

~~~vue
<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

   <ChatMessages  :messages="messages"/>
   
    <MessageBox />
  </div>
</template>

<script setup lang="ts">
import ChatMessages from '@/components/chat/ChatMessages.vue';
import MessageBox from '@/components/chat/MessageBox.vue';
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import { ref } from 'vue';



const messages = ref<ChatMessage[]>([
  {
    id: new Date().getTime(), //debería ser un UUID
    message: "Hola mundo",
    itsMine: true
  },
  {
    id: new Date().getTime()+1, //debería ser un UUID
    message: "yes",
    itsMine: false,
    image: "https://yesno.wtf/assets/yes/2-5df1b403f2654fa77559af1bf2332d7a.gif"
  }

]);
</script>
~~~

- Lo implementamos en ChatMessages.vue
- Para recibir esa property uso defineProps
- Puedo usar estos mensajes con un v-for (me pide el key)

~~~vue
<template>
     <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="message in messages"
       :key="message.id" 
       :its-mine="message.itsMine" 
       :message="message.message"
       :image="message.image"
       />        
      </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import ChatBubble from './ChatBubble.vue';

interface Props{
  messages: ChatMessage[];
}

defineProps<Props>()
</script>
~~~

- Puedo desestructurar la data para no usar message. en todos lados

~~~vue
<template>
     <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="({id, itsMine,message,image}) in messages"
       :key="id" 
       :its-mine="itsMine" 
       :message="message"
       :image="image"
       />        
      </div>
    </div>
</template>
~~~

- Pero **aún hay una forma más corta**. Todas las propiedades de message ya las he definido en las props salvo el id
- Puedo usar el v-bind (que la forma corta es :) y pasarle el message

~~~vue
<template>
     <div class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="message in messages"
       :key="message.id" 
       v-bind="message"
       />        
      </div>
    </div>
</template>
~~~

- Esto hace el mapeo directamente. Las que no va a usar (como el id) simplemente son ignoradas
- Siguiente paso. El MessageBox. Lo que tiene que hacer es mandar llamar un evento (presionar el enter) que emita el valor de la caja de texto para renderizarlo como mensaje en pantalla y hacer el llamado a la API para obtener la respuesta y traer una imagen con un si o un no
- Este mensaje debe impactar de alguna manera este arreglo de mensajes que está en IndecisionView.vue
- Cuando esta propiedad reactiva cambie va a notificar a nuestro ChatMessages (que es donde está el v-for para renderizarlos en pantalla)

## Emitir Eventos - defineEmits

- Debo poder tocar el botón o presionar enter, y mandar el texto del input para crear un mensaje que se renderice al pasar a nuestro listado de mensajes
- Vamos a MessageBox
  - Tenemos el input y tenemos el botón con el svg dentro
  - Este es el input del cual necesitamos capturar su valor. Para ello creo una variable reactiva message
  - Al inciarlo como u string vacío TypeScript infiere el tipo string por nosotros
  - Para conectarlo al input usamos **v-model**
  - Para añadir la función uso @keypress.enter
  - Añado la función al button con @click

~~~vue
<template>
    <div class="bg-white p-4 flex items-center">
      <input
        type="text"
        placeholder="Type your message..."
        class="flex-1 border rounded-full px-4 py-2 focus:outline-none"
        v-model="message"
        @keypress.enter="sendMessage"
      />
      <button
        class="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none"
        @click="sendMessage"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#ffffff"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </button>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

  const message= ref("");
  const sendMessage=()=>{
    if(!message.value) return //no emitimos si no hay nada escrito
    //TODO: lógica
    message.value="" //una vez se manda limpio el valor
  }

</script>
~~~  

- **¿Cómo hago para llegar al componente padre (IndecisionView.vue) para llegar al arreglo de messages?**
- Necesitamos disparar un evento personalizado, algo así como agregarle al MessageBox un @on-message
- Para ello usaremos defineEmits trabajando con el Composition API
- Ejemplo: en este ejemplo tengo dos funciones, change y update, una emite un número y la otra un string

~~~js
const emit = defineEmits<{
  change: [id: number] 
  update: [value: string]
}>()
~~~

- En MessageBox.vue uso defineEmits y creo la función sendMessage que emite un testo (string)
- Guardo defineEmits en la constante emits
- Uso emits y entre paréntesis le paso la función que creé con defineEmits (sendMessage) y le paso el valor del text, que en este caso es message.value, el valor de la propiedad reactiva que enlacé al input con v-model (donde guardo el texto del input)

~~~vue
<script lang="ts" setup>
import { ref } from 'vue';

  const emits= defineEmits<{
    sendMessage: [text:string]
  }>();

  const message= ref("");
  const sendMessage=()=>{
    if(!message.value) return //no emitimos si no hay nada escrito
    emits('sendMessage', message.value) //le paso el message.value que es el valor de la propiedad reactiva
                                        //que tengo enlazada al input con v-model
    message.value="" //una vez se manda limpio el valor
  }
</script>
~~~

- Ahora, si voy al IndecisionView.vue donde está el componente MessageBox y añado @ veo que tengo disponible el evento send-message
- Puedo tomar el valor emitido (text que es message.value) con $event como parámetro de una función que creemos
- Creo la función onMessage y uso .push para agregar al final del arreglo el mensaje (que será si o si mio)

~~~vue
<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

   <ChatMessages  :messages="messages"/>
   
    <MessageBox @send-message="onMessage($event)"/>
  </div>
</template>

<script setup lang="ts">
import ChatMessages from '@/components/chat/ChatMessages.vue';
import MessageBox from '@/components/chat/MessageBox.vue';
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import { ref } from 'vue';



const messages = ref<ChatMessage[]>([
  {
    id: new Date().getTime(), //debería ser un UUID
    message: "Hola mundo",
    itsMine: true
  },
  {
    id: new Date().getTime()+1, //debería ser un UUID
    message: "yes",
    itsMine: false,
    image: "https://yesno.wtf/assets/yes/2-5df1b403f2654fa77559af1bf2332d7a.gif"
  }

]);

const onMessage=(text: string)=>{
  messages.value.push({
    id: new Date().getTime(),
    itsMine: true,
    message: text
  })
}
</script>
~~~

- La forma corta es como este @send-message está emitiendo un text y lo único que hago con $event es mandárselo como referencia a send-message (y onMessage también está esperando solo un text), puedo poner solo onMessage

~~~js
<MessageBox @send-message="onMessage"/>
~~~

- Hay varias formas de hacer el defineEmits
- Esta es una buena manera para trabajar con el script setup
- Cuando trabajamos con el defineComponent (y la función setup()) lo que haría sería declarar un objeto emits y definirlos

~~~js
import { defineComponent, defineEmits } from 'vue';

export default defineComponent({
  props: {
    value: { type: Number, required: true }
  },
  emits: ['sendMessage'], // Solo declaramos el evento que vamos a emitir
  setup(props) {
    // Tipamos el evento con defineEmits, indicando que 'sendMessage' espera un string
    const emit = defineEmits<{
      (event: 'sendMessage', message: string): void;
    }>();

    // Función que emite el evento 'sendMessage' con un mensaje de tipo string
    const sendMessage = (message: string) => {
      emit('sendMessage', message);
    };

    // Retornamos la función para que pueda ser usada en el template
    return {
      sendMessage
    };
  }
});
~~~

- Transformaremos el IndecisionView en un Composable para que quede más sencillo
- entonces, he creado un evento personalizado al que le paso la función que capta el valor emitido (text) que está guardado en la variable reactiva message, que he enlazado en el input con el v-model, y disparado usando @keypress.enter

## Pensemos en Composables

- Cuando un componente empieza a crecer con mucha lógica y queremos ir trabajando con el script setup se presta mucho a separar la lógica, no solo para reutilizarla, sino para manetener el estado de la aplicación o del componente
- De hecho con el composable podría evitar tener que mandar argumentos, pero el envío y emisión de eventos valía la pena entenderlo
- Creo useChat.ts, corto la lógica de IndecisionVue.vue y la pego en el useChat, retorno el arreglo y la función en un objeto

~~~js
import type { ChatMessage } from "@/interfaces/chat-message.interface";
import { ref } from "vue";

export const useChat=()=>{

    const messages = ref<ChatMessage[]>([
  {
    id: new Date().getTime(), //debería ser un UUID
    message: "Hola mundo",
    itsMine: true
  },
  {
    id: new Date().getTime()+1, //debería ser un UUID
    message: "yes",
    itsMine: false,
    image: "https://yesno.wtf/assets/yes/2-5df1b403f2654fa77559af1bf2332d7a.gif"
  }

]);

const onMessage=(text: string)=>{
  messages.value.push({
    id: new Date().getTime(),
    itsMine: true,
    message: text
  })
}

    return {
        messages,
        onMessage
    }
}
~~~

- Desestructuro el message y el onMessage de useChat en IndecisionView.vue

~~~vue
<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

   <ChatMessages  :messages="messages"/>
   
    <MessageBox @send-message="onMessage"/>
  </div>
</template>

<script setup lang="ts">
import ChatMessages from '@/components/chat/ChatMessages.vue';
import MessageBox from '@/components/chat/MessageBox.vue';
import { useChat } from '@/components/chat/useChat';

const {messages, onMessage} =useChat()
</script>
~~~

- Los mensajes del arreglo de mensajes ya **los podemos borrar**, eran solo de ejemplo

## Realizar petición HTTP

- Vamos a la lógica del useChat
- Hago unavalidación, si en text.length no hay nada return
- Si el mensaje no termina en ? return
- Entonces, si el mensaje acaba en ? hago la petición HTTP
  - Creo la función getHerResponse
  - Para tipar la respuesta cojo la respuesta que me devuelve POSTMAN, creo una nueva interfaz y uso paste json as code

~~~js
export interface YesNoResponse {
    answer: string;
    forced: boolean;
    image:  string;
}
~~~

- Puedo tipar la respuesta del fetch usando la interfaz (habría que envolverlo en un try catch porque la petición podría fallar)
- Hago el onMessage async para poder usar el await con getHerResponse y desestructuro el answer y la image
- Vuelvo a hacer un .push y coloco el itsMine en false para que coloque a la izquierda la imagen y la respuesta
- useChat.ts

~~~js
import type { ChatMessage } from "@/interfaces/chat-message.interface";
import type { YesNoResponse } from "@/interfaces/yes-no.response";
import { ref } from "vue";

export const useChat=()=>{

    const messages = ref<ChatMessage[]>([]);
    
    const getHerResponse =async()=>{
      const resp = await fetch("https://yesno.wtf/api")
      const data = (await resp.json()) as YesNoResponse

      return data
    }
    
const onMessage=async(text: string)=>{
  if(text.length === 0) return;

  messages.value.push({
    id: new Date().getTime(),
    itsMine: true,
    message: text
  })
  //evaluar si el mensaje termina con ?
  if(!text.endsWith('?')) return;
  const {answer, image}= await getHerResponse()

   messages.value.push({
    id: new Date().getTime(),
    itsMine: false,
    message: answer,
    image: image
    })
  }
    return {
        messages,
        onMessage,
    }
}
~~~

- Ahora, si le hago una pregunta desde el navegador, me devuelve una imagen con un yes o un no
- Pero hay un problema: cuando hacemos varias preguntas hay que hacer scroll para verlo
- De momento crearemos una función para simular un tiempo de espera para la respuesta (de mi esposa)
- Creo una carpeta src/helpers/sleep.ts

~~~js
export const sleep = (seconds: number = 1)=>{
 return new Promise(resolve =>{
    setTimeout(resolve, seconds*1000)
 })   
}
~~~

- Llamo a la función en useChat

~~~js
const onMessage=async(text: string)=>{
  if(text.length === 0) return;

  messages.value.push({
    id: new Date().getTime(),
    itsMine: true,
    message: text
  })

  if(!text.endsWith('?')) return;
  await sleep(1.5) //retraso 1.5 segundos la respuesta
  const {answer, image}= await getHerResponse()

   messages.value.push({
    id: new Date().getTime(),
    itsMine: false,
    message: answer,
    image: image
  })
}
~~~

- Hay que poner un scroll automático cuando recibimos mensajes

## Referencias a elementos HTML

- Una manera es hacer referencia al div de ChatMessages.vue y decirle que cuando haya un nuevo mensaje (cuando nuestra property de los messages cambia) quiero moverlo a la posición final
- Creo una variable reactiva con ref
- Si no le especifico un valor es undefined, por eso la inicializo con null
- Le paso la referencia chatRef al div

~~~vue
<template>
     <div ref="chatRef" class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="message in messages"
       :key="message.id" 
       v-bind="message"
       />        
      </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import ChatBubble from './ChatBubble.vue';
import { ref } from 'vue';

interface Props{
  messages: ChatMessage[];
}

defineProps<Props>()

  //arreglar scroll
const chatRef= ref<HTMLDivElement| null>(null)

console.log(chatRef.value) // devuelve null

</script>
~~~

- Si coloco el console.log dentro de un setTimeOut de un segundo, veré que ya tengo la referencia al div
- Esto deja claro que con el script setup, primero se ejecuta el código de TypeScript, y luego cuando se construye el HTML se asigna la referencia
- Hay funciones con el onMounted pero no es lo que me interesa
- Lo que me interesa es mover la pantalla cuando se recibe un nuevo mensaje
- Para estar pendiente de cuando recibo nuevos mensajes uso la función **watchEffect**
- watchEffect realiza la lógica del callback cada vez que hay un cambio en la reactividad del bloque
- Hay que darle un poco de tiempo a Vue para que le de tiempo de renderizar el elemento (si no el scroll no acaba de llegar al final)
- Para ello usamos nextTick, como necesita el await hago async el callback
- Usando scrollHeight como el valor de top en scrollTo, estás diciendo que el contenedor debe desplazarse hasta el final del contenido. - Esto lleva el scroll de tu contenedor hasta la parte más baja

~~~vue
<template>
     <div ref="chatRef" class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="message in messages"
       :key="message.id" 
       v-bind="message"
       />        
      </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import ChatBubble from './ChatBubble.vue';
import { nextTick, ref, watchEffect } from 'vue';

interface Props{
  messages: ChatMessage[];
}

defineProps<Props>()

//arreglar scroll
const chatRef= ref<HTMLDivElement| null>(null)

watchEffect(async () => {
    await nextTick();

    chatRef.value?.scrollTo({
        top: chatRef.value.scrollHeight,
        behavior: 'smooth',
    });
  
})

</script>
~~~

- Paso todos los componentes de la aplicación
- App.vue

~~~vue
<template>
 <IndecisionView />
</template>

<script lang="ts" setup>
import IndecisionView from './views/IndecisionView.vue';

</script>
~~~

- views/IndecisionView.vue

~~~vue
<!-- Fuente: https://tailwindcomponents.com/component/chat-layout -->
<template>
  <div class="bg-gray-100 h-screen flex flex-col max-w-lg mx-auto">
    <div class="bg-blue-500 p-4 text-white flex justify-between items-center">
      <span>Mi esposa</span>
    </div>

   <ChatMessages  :messages="messages"/>
   
    <MessageBox @send-message="onMessage"/>
  </div>
</template>

<script setup lang="ts">
import ChatMessages from '@/components/chat/ChatMessages.vue';
import MessageBox from '@/components/chat/MessageBox.vue';
import { useChat } from '@/components/chat/useChat';


const {messages, onMessage} =useChat()


</script>
~~~

- components/chat/ChatMessages.vue

~~~vue
<template>
     <div ref="chatRef" class="flex-1 overflow-y-auto p-4">
      <div class="flex flex-col space-y-2">
       <ChatBubble
       v-for="message in messages"
       :key="message.id" 
       v-bind="message"
       />        
      </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/interfaces/chat-message.interface';
import ChatBubble from './ChatBubble.vue';
import { nextTick, ref, watchEffect } from 'vue';

interface Props{
  messages: ChatMessage[];
}

defineProps<Props>()

//arreglar scroll
const chatRef= ref<HTMLDivElement| null>(null)

watchEffect(async () => {
    
    await nextTick();
    chatRef.value?.scrollTo({
        top: chatRef.value.scrollHeight,
        behavior: 'smooth',
    });
  
})

</script>
~~~

- components/chat/ChatBubble.vue

~~~vue
<template>
    <div v-if="itsMine" class="flex justify-end">
          <div class="bg-blue-200 text-black p-2 rounded-lg max-w-xs">
            {{ message }}
          </div>
        </div>

        <!-- Example Received Message -->
        <div v-else class="flex">
          <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">
            <span class="capitalize">{{ message }}</span>
            <img v-if="image" :src="image" alt="YesNoImage" class="w-52 h-52 object-cover rounded-md">
          </div>
        </div>
</template>


<script lang="ts" setup>
    interface Props{
        message: string;
        itsMine: boolean; //si el mensaje es mio
        image?: string
    }
    defineProps<Props>();
</script>
~~~

- components/chat/MessageBox.vue

~~~vue
<template>
    <div class="bg-white p-4 flex items-center">
      <input
        type="text"
        placeholder="Type your message..."
        class="flex-1 border rounded-full px-4 py-2 focus:outline-none"
        v-model="message"
        @keypress.enter="sendMessage"
      />
      <button
        class="bg-blue-500 text-white rounded-full p-2 ml-2 hover:bg-blue-600 focus:outline-none"
        @click="sendMessage"
      >
        <svg
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#ffffff"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
              stroke="#ffffff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </button>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

  const emits= defineEmits<{
    sendMessage: [text:string]
  }>();

  const message= ref("");
  const sendMessage=()=>{
    if(!message.value) return //no emitimos si no hay nada escrito
    emits('sendMessage', message.value)
    message.value="" //una vez se manda limpio el valor
  }
</script>
~~~

- helpers/useChat.ts

~~~js
import { sleep } from "@/helpers/sleep";
import type { ChatMessage } from "@/interfaces/chat-message.interface";
import type { YesNoResponse } from "@/interfaces/yes-no.response";
import { ref } from "vue";

export const useChat=()=>{

    const messages = ref<ChatMessage[]>([]);
    
    const getHerResponse =async()=>{
      const resp = await fetch("https://yesno.wtf/api")
      const data = (await resp.json()) as YesNoResponse

      return data
    }

const onMessage=async(text: string)=>{
  if(text.length === 0) return;

  messages.value.push({
    id: new Date().getTime(),
    itsMine: true,
    message: text
  })
  //evaluar si el mensaje termina con ?
  if(!text.endsWith('?')) return;
  await sleep(1.5)
  const {answer, image}= await getHerResponse()

   messages.value.push({
    id: new Date().getTime(),
    itsMine: false,
    message: answer,
    image: image
  })


}

    return {
        messages,
        onMessage,
    }
}
~~~
-------

