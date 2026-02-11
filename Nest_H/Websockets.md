# NEST HERRERA - WEBSOCKETS

## Introducción

- Crearemos una pequeña aplicación con Vite dónde introduciendo mi JsonWebToken me proporciona mi socket_id (identificación de la conexión) y nos conectaremos en tiempo real los dos backends
- Crearemos dos usuarios para las pruebas en la DB
- Los websockets no trabajan exactamente igual que la REST API
- Estamos sirviendo contenido estático en la carpeta public
- app.module.ts

~~~js
{...imports}
import {ServeStaticModule} from '@nestjs/serve-static'
import { join } from 'path';


@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true
    }),
    ProductsModule,
    CommonModule,
    SeedModule,
    FileModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public')
    })

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
~~~

- Conviene crear un index.html en public
- Guardo las imágenes en public/products
- Hay que habilitar el CORS para conectar el frontend
- Al estar el frontend dentro de la app en public no hay porqué habilitarlo
- Si tuviera que habilitarlo sería algo así
- main.ts

~~~js
app.enableCors(options) //options es opcional
~~~

## Websocket Gateways

- Usaremos socket.io
- Los websockets se implementan con necesidades específicas
- Permiten al servidor hablar de manera activa
    - Puede mandar la info tanto cliente-servidor como servidor cliente **sin que el cliente lo solicite**
    - Los dos están hablando y escuchándose
- El **@WebSocketGateway()** es **muy parecido al controlador**, hace una implementación que envuelve **socket.io o ws** (websocket)
- Funciona como un controlador, admite inyección de dependencias

> nest g res messagesWs --no-spec

- Elijo Websockets! No hacen falta los endpoints (aunque se puede hacer un CRUD con websockets)

> npm i @nestjs/websockets @nestjs/platform-socket.io

- Coloco el cors en true en el WebSocketGateway
- messages-ws.gateway.ts

~~~js
import { WebSocketGateway} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';


@WebSocketGateway({cors: true})
export class MessagesWsGateway {
  constructor(private readonly messagesWsService: MessagesWsService) {}

}
~~~

- Si hago una petición GET a 

> localhost:3000/socket.io/socket.io.js

- Obtengo una respuesta muuuy larga de Socket.io 

~~~json
/*!
 * Socket.IO v4.8.1
 * (c) 2014-2024 Guillermo Rauch
 * Released under the MIT License.
 */

 {...code}
~~~

- Este es el url que va a necesitar el cliente para conectarse

## Server - Escuchar conexiones y desconexiones

- El servidor va a ser nuestra app de Nest
- El cliente va a ser una app web que se conecta al server
- La documentación de sockets está en socket.io
- El **namespace** podría verse como una sala de chat

~~~js
@WebSocketGateway(80,{namespace: 'events'})
~~~

- Si no se especifica se apunta al namespace root '/'
- Cuando ingreso en el namespace tengo un nombre (que se puede repetir) y un id único
- Cada cliente se conecta a dos namespaces
    - El primero es como entrar en la casa, conectar con el server
    - También se conecta al namespace como una sala de chat que tiene el id de ese socket (único y volátil)
        - Cambia cada vez que el usuario se desconecta o se refresca el navegador
        - Me va a permitir mandarle un mensaje a esa persona si así lo deseo
- Cuando un cliente se conecta puedo reaccionar, quiero saber el id de ese cliente
- También quiero saber cuando un cliente se desconecta su id
- Para ello hay que **implementar 2 interfaces**
- Una vez indicadas me sitúo con el cursor encima de la clase y con **Ctrl .** las implemento
- Instalo socket.io para tener la interfaz de Socket

~~~js

import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Socket } from 'socket.io';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{
  
  constructor(private readonly messagesWsService: MessagesWsService) {}
  
handleConnection(client: Socket) {
    console.log('Cliente conectado', client.id); //este id es bien volátil
  }
  
  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado', client.id)
  }
}
~~~

- Haremos una app puro Vanilla (sin framework)
- Hay cursos de React con socket.io

## Cliente - Vite Vanilla Javascript

- Fuera de teslo-websockets, en la carpeta que lo alberga creo el proyecto con **npm create vite**
- Lo nombro ws-client, selecciono Vanilla - Typescript
- En ws-client hago un **npm i**
- Para correrlo 

> npm run dev

- En el main está toda la mandanga
- Lo borro todo y dejo solo un div con un h1
- main.ts

~~~js
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span><offline/span>
  </div>
`
~~~

- Necesito la url que mencioné anteriormente de socket.io para conectarme al servidor

> localhost:3000/socket.io/socket.io.js

- Creo un archivo dentro de src llamado socket-client.ts
- Para conectarme necesito instalar

> npm i socket.io-client

- socket.io-client debe hacer match o ser similar al socet.io de la respuesta del endpoint
- A este!

~~~json
/*!
 * Socket.IO v4.8.1
 * (c) 2014-2024 Guillermo Rauch
 * Released under the MIT License.
 */
~~~

- Usualmente son las mismas
- Vamos con la conexión
- socket-client.ts

~~~js
import {Manager} from 'socket.io-client'

export const connectToServer = ()=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js')

    const socket = manager.socket('/') //conexión al namespace, esto es lo que conecta al cliente

    //puedo usar un console.log para ver más info del socket
     console.log({socket})
}
~~~

- El cliente se conecta a través del Manager porque implementamos las dos interfaces en el Gateway
- Todos los clientes están conectados al servidor y es el servidor quien decide a quien le llega el mensaje
- No me conecto con otro cliente directamente

- Llamo a la función en el main.ts (estamos en el cliente)

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span>offline</span>

  </div>
`
connectToServer() //AQUI!
~~~

- Si voy al cliente (al navegador) y refresco varias veces la pantalla me indica Cliente conectado: "id"",Cliente desconectado: "id" en la consola del server que está corriendo
- Necesito saber los clientes conectados

## Server - Mantener identificados los clientes

- Cuando el cliente se conecta voy a llamar a ConnectedClients con el id apuntando al socket (client)
- Creo un getter en el servicio para obtener el número de clientes conectados
- messages-ws.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface ConnectedClients{
    [id: string]: Socket
}


@Injectable()
export class MessagesWsService {
     private connectedClients: ConnectedClients = {}

     handleConnection(client: Socket){
        this.connectedClients[client.id] = client

        console.log({conectados: this.getConnectedClients()})
     }

     handleDisconnect(clientId: string){
        delete this.connectedClients[clientId]
     }

     getConnectedClients(): number{
        return Object.keys(this.connectedClients).length
     }

}
~~~

- En el Gateway llamo al servicio

~~~js

import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Socket } from 'socket.io';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{
  
  constructor(private readonly messagesWsService: MessagesWsService) {}
  
handleConnection(client: Socket) {
  this.messagesWsService.handleConnection(client)
}
  
  handleDisconnect(client: Socket) {
    this.messagesWsService.handleDisconnect(client.id)
  }
}
~~~

- Creo un getter en el servicio para obtener el número de clientes conectados

~~~js
getConnectedClients(): number{
      return Object.keys(this.connectedClients).length
    }
~~~

- Si inicio el cliente, lo abro en el navegador y miro la consola del server corriendo aparece **{conectados: 1}**

## Cliente - Detectar conexión y desconexión

- En el main.ts del cliente creo un id para el span, para podere acceder a él fácilmente

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span id="server-status">offline</span>

  </div>
`
connectToServer()
~~~

- Para saber si estoy conectado o no me valgo de unos eventos del mismo socket
  - Si quiero escuchar uso .on
  - Si quiero hablar con el servidor uso .emit
- En socket-client.ts (del cliente)

~~~js
import {Manager, Socket} from 'socket.io-client'

export const connectToServer = ()=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js')

    const socket = manager.socket('/') //conexión al namespace

    addListeners(socket)
}


const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

}
~~~

## Cliente - Clientes conectados

- Añado un order list en el cliente para mostrar todos los clientes conectados
- En el main.ts

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span id="server-status">offline</span>

    <ul id='clients-ul'>
      <li> ID_CLIENTE </li>
    </ul>

  </div>
`
connectToServer()
~~~

- En el server, cuando un cliente se conecta quiero mandar una notificación a todos los clientes, que un nuevo cliente se conectó
- Para eso necesito la instancia del WebSocketServer, la obtengo con el decorador @WebSocketServer
- Este WebSocketServer tiene la info de todos los clientes conectados
- Uso .emit, le paso el nombre del evento (que puede ser cualquiera) y el Payload que puede ser un objeto, un boolean, puede ser cualquier cosa
- También queremos saber cuando algún cliente se desconecta
- message-ws.gateway.ts

~~~js

import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server
  
 constructor(private readonly messagesWsService: MessagesWsService) {}
  
handleConnection(client: Socket) {
  this.messagesWsService.handleConnection(client)

  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
  
  handleDisconnect(client: Socket) {
    this.messagesWsService.handleDisconnect(client.id)
    this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
  }
}
~~~

- Solo quiero los ids de los clientes conectados, basado en el método que creeé en el messages-ws.service
- messages-ws.service.ts

~~~js
getConnectedClients(): string[]{
      return Object.keys(this.connectedClients)
    }
~~~

- En los listeners del cliente (en socket-client.ts)ç

~~~js
const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        console.log({clients})
    })
}
~~~

- En la consola del navegador veo Array(n) con los ids de los clientes conectados
- En el socket-client.ts obtengo el ul y le paso los ids conectados

~~~js
import {Manager, Socket} from 'socket.io-client'

export const connectToServer = ()=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js')

    const socket = manager.socket('/') //conexión al namespace

    addListeners(socket)
}


const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

}
~~~

- Ahora en pantalla aparecen los ids conectados

## Emitir Cliente - Escuchar Servidor (chat)


- Quiero enviar un mensaje desde el cliente y que lo escuchen los demás
- Creo un formulario en el HTML del main.ts del cliente

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span id="server-status">offline</span>

    <ul id='clients-ul'>
      <li> ID_CLIENTE </li>
    </ul>

    <form id="message-form">
      <input placeholder="message" id="message-input" />
    </form>

  </div>
`
connectToServer()
~~~

- En socket-client.ts capturo el form y el message a través del id

~~~js
import {Manager, Socket} from 'socket.io-client'

export const connectToServer = ()=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js')

    const socket = manager.socket('/') //conexión al namespace

    addListeners(socket)
}


const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!
    const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
    const messageInput = document.querySelector<HTMLInputElement>('#message-input')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

    //voy a estar escuchando el evento submit del formulario (cuando alguien le de al intro)
    messageForm.addEventListener('submit', (event)=>{
        event.preventDefault()
        if(messageInput.value.trim().length <= 0) return 

        console.log({id: "YO!", message: messageInput.value})//este objeto es el que quiero mandarle al servidor
    })
}
~~~

- Agrego unos estilos al input en el styles.css

~~~js
input{
  padding: 10px 20px;
}
~~~

- Emito para el server el evento message-from-client

~~~js
messageForm.addEventListener('submit', (event)=>{
    event.preventDefault()
    if(messageInput.value.trim().length <= 0) return 

    socket.emit('message-from-client', {
        id: 'YO!',
        message: messageInput.value
    })

    messageInput.value =''
})
~~~

- Hay que poner el server a escuchar a este evento
- Nest ofrece una forma genial con el decorador **@SubscribeMessage**. Estoy en el server, en el messages-ws.gateway
- Usando este decorador siempre voy a tener disponible el cliente y el payload
- messages-ws.gateway.ts

~~~js
 @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: any){

  }
~~~

- Creo un dto messages-ws/dtos/new-message.dto.ts. Pongamos que solo me interesa el message, descarto el id

~~~js
import { IsString, MinLength } from "class-validator";

export class NewMessageDto{
    @IsString()
    @MinLength(1)
    message: string
}
~~~

- Lo uso en el gateway, ahora puedo tipar el payload
- messages-ws.gateway.ts

~~~js
@SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){
    console.log(client.id, payload)
  }
~~~

- Me devuelve esto por consola (del server)

> 730gRc8H8VUqzROgAAAB { id: 'YO!', message: 'oihoij' }

- El string del SubscribeMessage debe de ser único, si no ejecutará el primero que encuentre

## Formas de emitir desde el servidor

- Los clientes están emitiendo pero no pasa nada
- Pongamos que queremos imprimir en pantalla los mensajes de los clientes conectados
- En el main.ts del cliente creo otro ul

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>WebSocket Client</h1>

    <span id="server-status">offline</span>

    <ul id='clients-ul'>
      <li> ID_CLIENTE </li>
    </ul>

    <form id="message-form">
      <input placeholder="message" id="message-input" />
    </form>

    <h3>Messages</h3>
    <ul id="messages-ul"></ul>

  </div>
`
connectToServer()
~~~

- En el socket-client.ts capturo el message-ul y pongo a escuchar el server con el texto message-from-server

~~~js
const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!
    const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
    const messageInput = document.querySelector<HTMLInputElement>('#message-input')!
    const messageUl = document.querySelector<HTMLUListElement>('#messages-ul')! //capturo el message-ul

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

    //voy a estar escuchando el evento submit del formulario (cuando alguien le de al intro)
    messageForm.addEventListener('submit', (event)=>{
        event.preventDefault()
        if(messageInput.value.trim().length <= 0) return 

        socket.emit('message-from-client', {
            id: 'YO!',
            message: messageInput.value
        })

        messageInput.value =''
    })

    //Llamo al evento message-from-server
    socket.on('message-from-server', (payload: {fullName: string, message: string})=>{
        console.log(payload)
    })
}
~~~

- Pongamos que solo quiero emitir a la persona que mandó el mensaje
- messages-ws.gateway.ts

~~~js
@SubscribeMessage('message-from-client')
onMessageFromClient(client: Socket, payload: NewMessageDto){
  
  //emite únicamente al cliente que mandó el mensaje, no a todos
  client.emit('message-from-server', {
    fullName: 'Soy yo!',
    message: payload.message || 'no hay mensaje'
  })
}
~~~

- De esta manera solo el cliente que envió el mensaje recibe el mensaje que envió
- Si quiero emitir a todos menos al cliente que emite el mensaje (que es el client:Socket que recibe como parámetro el método)

~~~js
@SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){
    
    //client.emit('message-from-server', {
      //fullName: 'Soy yo!',
      //message: payload.message || 'no hay mensaje'
    //})

    //Emitir a todos menos al cliente que emitió 
    client.broadcast.emit('message-from-server', {
      fullName: 'Soy yo!',
      message: payload.message || 'no hay mensaje'
    })
  }
~~~

- Para mandar un mensaje inlcusive al que emitió el mensaje uso el WebSocketServer con this.wss.emit

~~~js
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server
  
 constructor(private readonly messagesWsService: MessagesWsService) {}
  
handleConnection(client: Socket) {
  this.messagesWsService.handleConnection(client)

  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
  
 handleDisconnect(client: Socket) {
    this.messagesWsService.handleDisconnect(client.id)

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients())
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){
    
    //client.emit('message-from-server', {
      //fullName: 'Soy yo!',
      //message: payload.message || 'no hay mensaje'
    //})

    //Emitir a todos menos al cliente que emitió 
    //client.broadcast.emit('message-from-server', {
      //fullName: 'Soy yo!',
      //message: payload.message || 'no hay mensaje'
    //})

    //Mensaje a todos inlcuyendo al que emitió el mensaje
    this.wss.emit('message-from-server', {
      fullName: 'Soy yo!',
      message: payload.message || 'no hay mensaje'
    })
  }
}
~~~

- También tengo el this.wss.to al que le puedo pasar una sala (un ClientId)
- Con client.join() puedo añadir al usuario a una sala
- Todos los clientes están conectados a una sala que es su client.id
- Puedo usar el email como identificador de sala con client.join(user.email)
- Si quiero emitir a todos los clientes que estén en la sala de ventas

> this.wss.to('ventas').emit('lo que sea')

- Para mostrar en pantalla el mensaje voy al socket-client.ts

~~~js
const addListeners = (socket: Socket) =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!
    const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
    const messageInput = document.querySelector<HTMLInputElement>('#message-input')!
    const messageUl = document.querySelector<HTMLUListElement>('#messages-ul')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

    //voy a estar escuchando el evento submit del formulario (cuando alguien le de al intro)
    messageForm.addEventListener('submit', (event)=>{
        event.preventDefault()
        if(messageInput.value.trim().length <= 0) return 

        socket.emit('message-from-client', {
            id: 'YO!',
            message: messageInput.value
        })

        messageInput.value =''
    })

    socket.on('message-from-server', (payload: {fullName: string, message: string})=>{
        
        const newMessage = `
            <li>
                <strong>${payload.fullName}</strong>
                <span>${payload.message}</span>
            </li>
        `
        const li = document.createElement('li') //creo el elemento
        li.innerHTML = newMessage //relleno el elemento

        messageUl.append(li) //agrego el elemento
    })
}
~~~


## Preparar cliente para enviar JWT

- Quiero usar mi sistema de autenticación con JWT para evaluar si el cliente tiene o no la autenticación que yo espero
- Si no la tiene no le voy a dejar conectarse a mi servicio de webSockets (ws)
- Usaremos el mismo jwt de una petición POST hacia su endpoint, regresa el jwt, lo alamacena en el localstorage/sessionStorage a la hora de conectarnos
- En lugar de manejarlo con el localStorage, para que no de problemas con las diferentes instancias de Chrome usaremos un inputen el HTML que va aser el usuario que se está autenticando ahi
- Creo un input y un botón
- main.ts

~~~js
import { connectToServer } from './socket-client'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h2>WebSocket Client</h2>

    <input  id="jwt-token" placeholder="Json Web Token"/>
    <button id="btn-connect">Connect</button>

    <br/>
    <span id="server-status">offline</span>

    <ul id='clients-ul'>
      <li> ID_CLIENTE </li>
    </ul>

    <form id="message-form">
      <input placeholder="message" id="message-input" />
    </form>

    <h3>Messages</h3>
    <ul id="messages-ul"></ul>

  </div>
`
const jwtToken = document.querySelector<HTMLInputElement>('#jwt-token')!
const btnConnect = document.querySelector<HTMLButtonElement>('#btn-connect')!

btnConnect.addEventListener('click', ()=>{
  connectToServer()
})
~~~

- De esta manera estoy llamando a la conexión manualmente
- Ahora tomaré el jwt y validaré que venga antes de conectarme
- Se podría usar una expresión regular para asegurarme que es un jwt, ya que de esta manera solo evalúa si hay algo en el input
- main.ts

~~~js
const jwtToken = document.querySelector<HTMLInputElement>('#jwt-token')!
const btnConnect = document.querySelector<HTMLButtonElement>('#btn-connect')!

btnConnect.addEventListener('click', ()=>{

  if(jwtToken.value.trim().length <= 0) return alert('Enter a valid JWT')
  connectToServer(jwtToken.value.trim())
})
~~~

- connectToServer ahora recibe el jwt
- Puedo añadir cierta info adicional al manager
- socket-client.ts

~~~js
import {Manager, Socket} from 'socket.io-client'

export const connectToServer = (token: string)=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js', {
        extraHeaders:{
            authentication: token 
        }
    })

    const socket = manager.socket('/') //conexión al namespace

    addListeners(socket)
}

const addListeners = {...code}
~~~

- En el server añado un console.log con el cliente en handleConnection
- message-ws.gateway.ts

~~~js
handleConnection(client: Socket) {
  console.log(client)
  this.messagesWsService.handleConnection(client)

  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
~~~

- Me devuelve un objeto enorme en la consola del server
- En la parte del handshake encontramos los headers el host, el tipo de conexión y tenemos el authentication, que es el extraHeader que yo añadí
- Si yo quisiera obtener el authentication y mostrarlo en consola haríamos algo así

~~~js
handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  console.log({token})
  this.messagesWsService.handleConnection(client)

  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
~~~

## Validar JWT del Handshake

- Hay que verificar que el jwt sea mio, que esté firmado por mi, etc
- Para crear el jwt en Nest usábamos el JwtService
- Necesitamos el .verify (.verifyAsync) del servicio
- Inyecto el JwtService en el Gateway (podría inyectarlo en el servicio)
- messages-ws.gateway.ts

~~~js
@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server
  
 constructor(
  private readonly messagesWsService: MessagesWsService,
  private readonly jwtService: JwtService
) {}

{...code}
}
~~~

- Debo importar el AuthModule (en el que exporto el JwtModule junto con el TypeOrmModule y otros) en el messages-ws.module
- Esto me servirá para usar la entidad de User pronto

~~~js
import { Module } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service';
import { MessagesWsGateway } from './messages-ws.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [AuthModule],
  providers: [MessagesWsGateway, MessagesWsService],
})
export class MessagesWsModule {}
~~~

- En el gateway verifico el token en un try catch
- En lugar de usar HttpException se usa **throw new WsException()**
- En lugar de usar la excepción desconectaré al cliente directamente en el catch
- messages-ws.gateway.ts

~~~js
handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  
  let payload : JwtPayloadInterface = {id: ''}

  try {
    payload = this.jwtService.verify(token)
    
  } catch (error) {
    client.disconnect()
  }
  console.log({payload})

  this.messagesWsService.handleConnection(client)

  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
~~~

- En la consola del server aparece esto

~~~js
{
  payload: {
    id: 'bcb907c1-74e2-4e28-9300-5aa4cf580fd3',
    iat: 1748900331,
    exp: 1748907531
  }
}
~~~

## Enlazar Socket con usuario

- Queremos mostrar en pantalla el usuario que escribe el mensaje
- Le paso el id del cliente que viene en el payload a **registerClient**

~~~js
handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  
  let payload : JwtPayloadInterface = {id: ''}

  try {
    payload = this.jwtService.verify(token)
    this.messagesWsService.handleConnection(client, payload.id) 
    
  } catch (error) {
    client.disconnect()
  }
  


  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
~~~

- **NOTA:** cambio los nombres de los métodos del servicio de messages-ws
  - handleConnection ahora se llama **registerClient**
  - handleDisconnect ahora se llama **removeClient**

- Para pasarle el usuario a connectedClients, puedo decir en la interfaz que el id del Socket apunte a un objeto con el socket y un user de tipo User
- messages-ws.service.ts

~~~js
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

interface ConnectedClients{
    [id: string]:{
      socket: Socket,
      user: User 
    }
}


@Injectable()
export class MessagesWsService {

   constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>
   ){}


     private connectedClients: ConnectedClients = {}

     async registerClient(client: Socket, userId: string ){

      const user = await this.userRepository.findOneBy({id: userId})
      
      if(!user) throw new Error('User not found')
      if(!user.isActive) throw new Error('User not active')

        this.connectedClients[client.id] = {
         socket: client,
         user
        }
        
     }

     removeClient(clientId: string){
        delete this.connectedClients[clientId]
     }

     getConnectedClients(): string[]{
        return Object.keys(this.connectedClients)
     }

}
~~~

- Debo colocar el async y await al handleConnection del gateway

~~~js
async handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  
  let payload : JwtPayloadInterface = {id: ''}

  try {
    payload = this.jwtService.verify(token)
    await this.messagesWsService.registerClient(client, payload.id) 
    
  } catch (error) {
    client.disconnect()
  }
  
  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
~~~

- Vamos a mostrar el usuario en cada mensaje que escriba
- El Soy yo! que se está mostrando está en el gateway, al final

~~~js

import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server
  
 constructor(
  private readonly messagesWsService: MessagesWsService,
  private readonly jwtService: JwtService
) {}
  
async handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  
  let payload : JwtPayloadInterface = {id: ''}

  try {
    payload = this.jwtService.verify(token)
    await this.messagesWsService.registerClient(client, payload.id) 
    
  } catch (error) {
    client.disconnect()
  }
  


  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
  
 handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id)

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients())
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){
    
    //client.emit('message-from-server', {
      //fullName: 'Soy yo!',
      //message: payload.message || 'no hay mensaje'
    //})

    //Emitir a todos menos al cliente que emitió 
    //client.broadcast.emit('message-from-server', {
      //fullName: 'Soy yo!',
      //message: payload.message || 'no hay mensaje'
    //})

    //Mensaje a todos incluyendo al que emitió el mensaje
    this.wss.emit('message-from-server', {
      fullName: 'Soy yo!', //AQUI!<------------------------------------------
      message: payload.message || 'no hay mensaje'
    })
  }
}
~~~

- Creo un método en el messages-ws.service

~~~js
getUserFullNameBySocketId(socketId: string){
      return this.connectedClients[socketId].user.fullName
     }
~~~

- Uso el servicio en el @SubscribeMessage del messages-ws.gateway

~~~js
@SubscribeMessage('message-from-client')
onMessageFromClient(client: Socket, payload: NewMessageDto){

  //Mensaje a todos incluyendo al que emitió el mensaje
  this.wss.emit('message-from-server', {
    fullName: this.messagesWsService.getUserFullNameBySocketId(client.id),
    message: payload.message || 'no hay mensaje'
  })
}
~~~

- No estamos cerrando la conexión, por lo que si me conecto varias veces con el mismo token aparecen varias conexiones
- Debo evaluar que si existe un usuario conectado no se vuelva a conectar

## Desconectar usuarios duplicados

- Puede ser que yo quiera que el comportamiento sea que un mismo usuario pueda crear varias conexiones activas
- Pero vamos a hacer que solo un usuario pueda tener una conexión activa
- Podría usar booleanos como desktop y mobile para permitir conexión desde escritorio y movil

~~~js
interface ConnectedClients{
    [id: string]:{
      socket: Socket,
      user: User,
      desktop: boolean,
      mobile: boolean 
    }
}
~~~

- Pero vamos a hacer que un usuario solo pueda tener una conexión activa
- Creo un método en el messages-ws.service.ts

~~~js
checkUserConnection(user: User){
    for(const clientId of Object.keys(this.connectedClients)){
        const connectedClient = this.connectedClients[clientId]

        if(connectedClient.user.id === user.id){
          //desconecto el socket anterior
          connectedClient.socket.disconnect()
          break;
        }
    }
    }
~~~

- Llamo a checkUserConnection antes de realizar la conexión con registerClient en el service

~~~js
async registerClient(client: Socket, userId: string ){

      const user = await this.userRepository.findOneBy({id: userId})
      
      if(!user) throw new Error('User not found')
      if(!user.isActive) throw new Error('User not active')

         this.checkUserConnection(user)

        this.connectedClients[client.id] = {
         socket: client,
         user
        }
        
     }
~~~

- Ahora funciona pero en pantalla al intentar conectar con el mismo token solo tengo una conexión activa pero pone discconect
- Algo está mal en el front
- Cada vez que toco el botón estoy creando un nuevo socket y crea nuevos listeners pero todos los listeners anteriores siguen existiendo
- Estamos creando listeners por todos lados
- Puedo usar **socket.removeAllListeners()**
- Pero esto no resuelve el problema, el socket anterior sigue en memoria y no lo estoy limpiando
- Por eso declaro socket fuera de la función
- Cada vez que mandaba a llamar a connectToServer creaba nuevos listeners, y los anteriores no eran eliminados
- socket-client.ts

~~~js
import {Manager, Socket} from 'socket.io-client'

let socket: Socket

export const connectToServer = (token: string)=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js', {
        extraHeaders:{
            authentication: token 
        }
    })

    socket?.removeAllListeners()
    socket = manager.socket('/') //conexión al namespace

    addListeners(socket)
}
~~~

- Ahora hace bien lo de que cuando me vuelvo a conectar aparece connected y el nuevo id pero no los mensajes que escribo
- Es porque cuando estamos emitiendo usa el Socket que encontró en el contexto de addListeners, que es el viejo socket
- Ya no hace falta que le pase el socket a addListeners porque usamos el socket que está de manera global

~~~js
import {Manager, Socket} from 'socket.io-client'

let socket: Socket

export const connectToServer = (token: string)=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js', {
        extraHeaders:{
            authentication: token 
        }
    })

    socket?.removeAllListeners()
    socket = manager.socket('/') //conexión al namespace

    addListeners()
}


const addListeners = () =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!
    const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
    const messageInput = document.querySelector<HTMLInputElement>('#message-input')!
    const messageUl = document.querySelector<HTMLUListElement>('#messages-ul')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

    //voy a estar escuchando el evento submit del formulario (cuando alguien le de al intro)
    messageForm.addEventListener('submit', (event)=>{
        event.preventDefault()
        if(messageInput.value.trim().length <= 0) return 

        socket.emit('message-from-client', {
            id: 'YO!',
            message: messageInput.value
        })

        messageInput.value =''
    })

    socket.on('message-from-server', (payload: {fullName: string, message: string})=>{
        const newMessage = `
            <li>
                <strong>${payload.fullName}</strong>
                <span>${payload.message}</span>
            </li>
        `
        const li = document.createElement('li')
        li.innerHTML = newMessage

        messageUl.append(li)
    })
}
~~~