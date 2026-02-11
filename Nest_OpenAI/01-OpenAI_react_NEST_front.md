# 01 OPENAI + REACT + NEST 

- El cascarón del front no lo he documentado
- No voy a explcar lo básico de NEST
- Iré directo al caso de uso (el primero es el de ortografía)

## Backend sección 3

- Básicamente el proceso en todos los casos de uso va a ser el mismo
  - Crear el controlador respectivo
  - Crear el DTO
  - Llegar al caso de uso mediante el servicio
  - El caso de uso haga todo el trabajo
- En estas dos primeras secciones es donde está todo el contenido
- Las siguientes se centran solo en funciones

# NOTA: OPENAI ha sacod un nuevo modelo GPT-4o. La ventaja es que usaremos el sdk propio de OPENAI por lo que el código es el mismo
-----

## Inicio del proyecto

- En la carpeta de React creo el proyecto

> nest new nest-gpt

- Copio el package.json
  
~~~json
{
  "name": "nest-gpt",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.0.0",
    "@nestjs/mapped-types": "*",
    "@nestjs/platform-express": "^10.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "openai": "^4.23.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
~~~

- **Rutas y CORS**
- En el main escribo app.enableCors() donde puedo configurar el whitelist, blacklist
- Genero el recurso gpt con nest g gpt --> elijo REST API
- Creo el endpoints en el controller

~~~js
import { Body, Controller, Post } from '@nestjs/common';
import { GptService } from './gpt.service';
import { OrthographyDto } from './dtos';

@Controller('gpt')
export class GptController {

  constructor(private readonly gptService: GptService) {}


  @Post('orthography-check')
  orthographyCheck(
    @Body() orthographyDto: OrthographyDto,  //uso @Body para tomar lo que recibo del body
  ) {
    return this.gptService.orthographyCheck(orthographyDto);
  }
}
~~~

- Mi servicio solo va a llamar a los casos de uso

~~~js
import { Injectable } from '@nestjs/common';

import OpenAI from 'openai';

import { orthographyCheckUseCase } from './use-cases';
import { OrthographyDto } from './dtos';

@Injectable()
export class GptService {

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, //le paswo el APIKEY
  })


  // Solo va a llamar casos de uso

  async orthographyCheck(orthographyDto: OrthographyDto) {
                                        //le paso la instancia de openai al caso de uso
    return await orthographyCheckUseCase( this.openai, {
      prompt: orthographyDto.prompt // en el prompt le paso el contenido del body
    });
  }


}

~~~

- Para la variable de entorno instalo @nestjs/config y configuro el forRoot en app.module

~~~js
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GptModule } from './gpt/gpt.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    GptModule,
  ]
})
export class AppModule {}
~~~

- Coloco la API_KEY_OPENAI en el archivo .env en la raíz
- Este es el dto que le estoy pasando al caso de uso que valida el body desde el controller

~~~js
import { IsInt, IsOptional, IsString } from 'class-validator';



export class OrthographyDto {

  @IsString()
  readonly prompt: string //readonly porque no lo voy a modificar

  @IsInt()
  @IsOptional()
  readonly maxTokens?: number; //maxTokens


}
~~~

- Configuro el class-vaslidator en el main con globalpipes

~~~js
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
~~~

- El caso de uso (creo la carpeta use-cases dentro de src/gpt/)

~~~js
import OpenAI from 'openai';

//creo la interfaz de options 
interface Options {
  prompt: string;
}


export const orthographyCheckUseCase = async( openai: OpenAI,  options: Options ) => {

  const { prompt } = options;

  //envío el prompt a openAI
  const completion = await openai.chat.completions.create({
    messages: [
      { 
        role: "system", // el role de opeanAI, assistant es para desarrolladores, tengo tool, function, user
        //ern content me devolverá la respuesta
        content: `
        Te serán proveídos textos en español con posibles errores ortográficos y gramaticales,
        Las palabras usadas deben de existir en el diccionario de la Real Academia Española,
        Debes de responder en formato JSON, 
        tu tarea es corregirlos y retornar información soluciones, 
        también debes de dar un porcentaje de acierto por el usuario,
        

        Si no hay errores, debes de retornar un mensaje de felicitaciones.

        Ejemplo de salida:
        {
          userScore: number,
          errors: string[], // ['error -> solución']
          message: string, //  Usa emojis y texto para felicitar al usuario
        }
        
        
        `
      },
      //en un segundo objeto le paSO EL ROLE Y EL CONTENT
      {
        role: 'user', //role de usuario
        content: prompt, //le paso el prompt
      }
  ],
    //le paso el modelo y la config al objeto principal
    model: "gpt-4o",
    
    temperature: 0.3, //de 0 a 2, cuuanto valores más altos las respuestas serán más aleatorias
    max_tokens: 150, //número máximo de tokens que puede usar para la completación
    response_format: {
      type: 'json_object' //devuelvo la respuesta como un json, no todos losmodelos soportan este formato
    }
  });

  // console.log(completion);
  const jsonResp = JSON.parse(completion.choices[0].message.content); //parseo la respuesta para retornarla
                              //En el arreglo de choices, está en el content, dentro de messages

  return jsonResp;

}
~~~

- Más adelante veremos como podemos crear un thread para poder pasarle info a openai varias veces en un mismo contexto en diferentes consultas
- También se puede mostrar la respuesta que va generando con los streams de información
-----

## Consumo del caso de uso en el frontend

- Creo en src/core/use-cases/ortography.use-case.ts

~~~js
export const ortographyUseCase =async (prompt: string)=>{
    try {
                                    //la url del meu backend `http://localhost:3000/gpt/orthography-check`
        const resp = await fetch(`${import.meta.env.VITE_GPOT_API}/orthography-check`, {
            //como no es un get, es un POST, debo indicarlo
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({prompt}) //en el body de la petición le paso el prompt
        }) 

        if(!resp.ok) throw new Error ("No se pudo realizar la conexión")

            const data = await resp.json() //de esta manera la respuesta es de tipo any
            //hago una petición y uso paste code as JSON para sacar la interfaz
     
        
    } catch (error) {
        //tiparemos esta respuesta
        return{
            ok: false,
            userScore: 0,
            errors: [],
            mnessage: "NO SE PUDO REALIZAR LA CORRECCIÓN"
        }
    }
}
~~~

- Para tipar la respuesta de la petición fetch, hago una petición y uso pastre code as JSON y saco la interfaz
- La guardo en interfaces/orthography.response.ts

~~~js
export interface OrthographgyResponse{
    ok?: boolean
    useScore: number
    errors: []
    message: string
    
}
~~~

- Sigo con el caso de uso

~~~js
import { OrthographgyResponse } from "../../interfaces/orthography.response"

export const ortographyUseCase =async (prompt: string): Promise<OrthographgyResponse>=>{
    try {
                                    //la url del meu backend `http://localhost:3000/gpt/orthography-check`
        const resp = await fetch(`${import.meta.env.VITE_GPOT_API}/orthography-check`, {
            //como no es un get, es un POST, debo indicarlo
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({prompt}) //en el body de la petición le paso el prompt
        }) 

        if(!resp.ok) throw new Error ("No se pudo realizar la conexión")

            const data= await resp.json() as OrthographgyResponse

            return{
                ok: true, 
                ...data
            }
        
    } catch (error) {
        //tiparemos esta respuesta
        return{
            ok: false,
            useScore: 0,
            errors: [],
            message: "NO SE PUDO REALIZAR LA CORRECCIÓN"
        }
    }
}
~~~

- Exporto el caso de uso en el index de la carpèta use-cases

~~~js
export * from './orthography.use-case'
~~~

- Creo el archivo .env con parte de la url para comunicarme con el backend

~~~
VITE_GPT_API =http://localhost:3000/gpt
~~~


- En src/presentation/pages/orthography/OrthographyPage.ts

~~~js
import { useState } from 'react';
import { GptMessage, MyMessage, TextMessageBox, TypingLoader } from "../../components";
import { ortographyUseCase } from '../../../core/use-cases';

interface Message {
  text: string;
  isGpt: boolean;
}




export const OrthographyPage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([])


  const handlePost = async( text: string ) => {

    setIsLoading(true);
    setMessages( (prev) => [...prev, { text: text, isGpt: false }] );

    //UseCase
    const data = await ortographyUseCase(text)
    
    setIsLoading(false);

    // Todo: Añadir el mensaje de isGPT en true


  }



  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="Hola, puedes escribir tu texto en español, y te ayudo con las correcciones" />

          {
            messages.map( (message, index) => (
              message.isGpt
                ? (
                  <GptMessage key={ index } text="Esto es de OpenAI" />
                )
                : (
                  <MyMessage key={ index } text={ message.text } />
                )
                
            ))
          }

          
          {
            isLoading && (
              <div className="col-start-1 col-end-12 fade-in">
                <TypingLoader />
              </div>
            )
          }
          

        </div>
      </div>


      <TextMessageBox 
        onSendMessage={ handlePost }
        placeholder='Escribe aquí lo que deseas'
        disableCorrections
      />

    </div>
  );
};
~~~

## Mostrar en pantalla la info

- Añado info como opcional a la interfaz de Message (estoy en OrthographyPage)
- Envio los mensajes con setMessage, evalúo si viene unan respuesta, le paso la data

~~~js
import { useState } from 'react';
import { GptMessage, MyMessage, TextMessageBox, TypingLoader } from "../../components";
import { ortographyUseCase } from '../../../core/use-cases';

interface Message {
  text: string;
  isGpt: boolean;
  info?:{
    useScore: number,
    errors: string[],
    message: string
  }
}

export const OrthographyPage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([])


  const handlePost = async( text: string ) => {

    setIsLoading(true);
    setMessages( (prev) => [...prev, { text: text, isGpt: false }] );

    //UseCase
    const data = await ortographyUseCase(text) //puedo desestructurar de aquí el ok, useScore, message y errors
    //evaluamos si el ok está en true
    if(!data.ok){    //prev es para no perder los messages anteriores
      setMessages( (prev) => [...prev, { text: "No se pudo realizar la corrección", isGpt: false }] );

    }else{
      setMessages( (prev) => [...prev, 
      { text:data.message, 
        isGpt: false, 
        info:{
          errors: data.errors,
          useScore: data.useScore,
          message: data.message
        }
      }]);
    }
    
    setIsLoading(false);

    // Todo: Añadir el mensaje de isGPT en true


  }



  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="Hola, puedes escribir tu texto en español, y te ayudo con las correcciones" />

          {
            messages.map( (message, index) => (
              message.isGpt
                ? (
                  <GptMessage key={ index } text="Esto es de OpenAI" /> //me devuelve ESTO porque tengo la data en duro
                )
                : (
                  <MyMessage key={ index } text={ message.text } />
                )
                
            ))
          }

          
          {
            isLoading && (
              <div className="col-start-1 col-end-12 fade-in">
                <TypingLoader />
              </div>
            )
          }
          

        </div>
      </div>


      <TextMessageBox 
        onSendMessage={ handlePost }
        placeholder='Escribe aquí lo que deseas'
        disableCorrections
      />

    </div>
  );
};
~~~

- En poantalla me devuelve "Esto es de OpenAI" por que lo estoy mandando en duro en el messages.map
- Creemos un GptMessage que se encargue de recibir el objeto tal cual quiuero usarlo
- Hago una copia del GptMessage y lo llamo presentation/components/chat-bubbles/GptMessageOrthography

~~~js
import Markdown from "react-markdown";

interface Props {
  userScore: number
  errors: string[]
  message: string
}

export const GptOrthographyMessage = ({ userScore, message, errors}: Props) => {
  return (
    <div className="col-start-1 col-end-9 p-3 rounded-lg">
      <div className="flex flex-row items-start">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600 flex-shrink-0">
          G
        </div>
        <div className="relative ml-3 text-sm bg-black bg-opacity-25 pt-3 pb-2 px-4 shadow rounded-xl">
         <h3 className="text-3xl">Puntaje : {userScore}</h3>
         <p>{message}</p>
         {
          (errors.length === 0)
          ? <p>No se encontraron errores</p>
          : (
            <>
            <h3 className="text-2xl">Errores encontrados</h3>
            <ul>
              {
                errors.map((error, i)=>(
                  <li key={i}>
                      {error}
                  </li>
                ))
              }
            </ul>
            </>
          )
         }
        </div>
      </div>
    </div>
  );
};
~~~

- Lo uso para renderizar en OrthograpohyPage
- No es message.info?, nos hemos asegurado de que siempre lo vamos a tener, por eso lo marcamos como message.info!
- Puedo usar un spread del message.info!
~~~js
 return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="Hola, puedes escribir tu texto en español, y te ayudo con las correcciones" />

          {
            messages.map( (message, index) => (
              message.isGpt
                ? (
                  <GptOrthographyMessage key={index} 
                    errors= {message.info!.errors}
                    userScore={message.info!.userScore}
                    message={message.info!.message}
                    //o puedo poner solo {...message.info!}
                  />
                )
                : (
                  <MyMessage key={ index } text={ message.text } />
                )
                
            ))
          }

          
          {
            isLoading && (
              <div className="col-start-1 col-end-12 fade-in">
                <TypingLoader />
              </div>
            )
          }
          

        </div>
      </div>


      <TextMessageBox 
        onSendMessage={ handlePost }
        placeholder='Escribe aquí lo que deseas'
        disableCorrections
      />

    </div>
  );
~~~
