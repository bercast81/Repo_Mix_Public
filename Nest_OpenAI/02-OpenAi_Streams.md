# 02 OpenAI Backend- ProsCons Discusser - Streams (backend)

## ProsCons Discusser - controllers, service y use-case

- ProsCons Discusser es un asistente que analiza los pros y los contras de algo
- gpt.controller

~~~js
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { GptService } from './gpt.service';
import { OrthographyDto, ProsConsDiscusserDto } from './dtos';

@Controller('gpt')
export class GptController {

  constructor(private readonly gptService: GptService) {}


  @Post('orthography-check')
  orthographyCheck(
    @Body() orthographyDto: OrthographyDto,
  ) {
    return this.gptService.orthographyCheck(orthographyDto);
  }


  @Post('pros-cons-discusser')
  prosConsDicusser(
    @Body() prosConsDiscusserDto: ProsConsDiscusserDto,
  ) {
    return this.gptService.prosConsDicusser(prosConsDiscusserDto);
  }

  @Post('pros-cons-discusser-stream')
  async prosConsDicusserStream(
    @Body() prosConsDiscusserDto: ProsConsDiscusserDto,
    @Res() res: Response, //cuando capto la response con @Res en NEST debo crear la respuesta que voy a emitir. Un return no funcionará
  ) {
     const stream = await this.gptService.prosConsDicusserStream(prosConsDiscusserDto); //obtengo el stream

    //creo la respuesta que voy a emitir
    res.setHeader('Content-Type', 'application/json'); //seteo los headers, voy a regresar un json
    res.status( HttpStatus.OK ); //Status nativo de NEST

    //uso el awaait en el for para recorrer los chunks de manera asíncrona
    for await( const chunk of stream ) {
      const piece = chunk.choices[0].delta.content || '';
      // console.log(piece); van apareciendo fragmentos de la respuesta en consola
      res.write(piece); //escribo en la response cada chunk de la respuesta de OpenAI
    }

    res.end(); //cierro la conexión

  }


}
~~~

- ProsConsDiscusserDto

~~~js
import { IsString } from 'class-validator';

export class ProsConsDiscusserDto {

  @IsString()
  readonly prompt: string;
  
}
~~~

- gpt.service

~~~js
import { Injectable } from '@nestjs/common';

import OpenAI from 'openai';

import { orthographyCheckUseCase, prosConsDicusserStreamUseCase, prosConsDicusserUseCase } from './use-cases';
import { OrthographyDto, ProsConsDiscusserDto } from './dtos';

@Injectable()
export class GptService {

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })


  // Solo va a llamar casos de uso

  async orthographyCheck(orthographyDto: OrthographyDto) {
    return await orthographyCheckUseCase( this.openai, {
      prompt: orthographyDto.prompt
    });
  }

  async prosConsDicusser({ prompt }: ProsConsDiscusserDto ) {
    return await prosConsDicusserUseCase(this.openai, { prompt });
  }

  async prosConsDicusserStream({ prompt }: ProsConsDiscusserDto ) {
    return await prosConsDicusserStreamUseCase(this.openai, { prompt });
  }



}
~~~

- pros-cons-discusser.use-case

~~~js
import OpenAI from 'openai';

interface Options {
  prompt: string;
}


//le indico que me devuelva la respuesta en formato markdown en el prompt
export const prosConsDicusserUseCase = async (openai: OpenAI, { prompt }: Options) => {

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `
          Se te dará una pregunta y tu tarea es dar una respuesta con pros y contras,
          la respuesta debe de ser en formato markdown,
          los pros y contras deben de estar en una lista,
        `
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8, //0.8 es un poco aleatoria
    max_tokens: 500 //puede ser que la respuesta salga cortada porque limito tokens para una respuesta que puede ser extensa
  })



  return response.choices[0].message; //puedo poner .content para que lo que devuelva sea un string en lugar de un JSON
        //response.choices[0].message.content --> devuelve un string
}
~~~

- ProsConsDiscusserStreamUseCase
- Simplemente coloco **el stream en true**

~~~js
import OpenAI from 'openai';

interface Options {
  prompt: string;
}



export const prosConsDicusserStreamUseCase = async (openai: OpenAI, { prompt }: Options) => {

  //retorno el stream
  return await openai.chat.completions.create({
    stream: true, 
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `
          Se te dará una pregunta y tu tarea es dar una respuesta con pros y contras,
          la respuesta debe de ser en formato markdown,
          los pros y contras deben de estar en una lista,
        `
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 500
  })

}
~~~