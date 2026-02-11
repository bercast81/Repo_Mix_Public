# OpenAI Nest + React - Traduccio0n (backend y frontend)

- gpt.controller

~~~js
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { GptService } from './gpt.service';
import { OrthographyDto, ProsConsDiscusserDto, TranslateDto } from './dtos';

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
    @Res() res: Response,
  ) {
     const stream = await this.gptService.prosConsDicusserStream(prosConsDiscusserDto);

  
    res.setHeader('Content-Type', 'application/json');
    res.status( HttpStatus.OK );

    for await( const chunk of stream ) {
      const piece = chunk.choices[0].delta.content || '';
      // console.log(piece);
      res.write(piece);
    }

    res.end();

  }

  //endpoint translate
  @Post('translate')
  translateText(
    @Body() translateDto: TranslateDto,
  ) {
    return this.gptService.translateText(translateDto);
  }


}
~~~

- El translateDto

~~~js
import { IsString } from 'class-validator';

export class TranslateDto {
  @IsString()
  readonly prompt: string;

  @IsString()
  readonly lang: string;
}
~~~

- En el gpt.service

~~~js
 async translateText({ prompt, lang }: TranslateDto ) {
    return await translateUseCase(this.openai, { prompt, lang });
  }
~~~

- El caso de uso

~~~js
import OpenAI from 'openai';

interface Options {
  prompt: string;
  lang: string;
}



export const translateUseCase = async (openai: OpenAI, { prompt, lang }: Options) => {

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Traduce el siguiente texto al idioma ${lang}:${ prompt }`
      },
    ],
    temperature: 0.2,
    // max_tokens: 500
  })



  return { message: response.choices[0].message.content }
}
~~~

- Para el frontend copio el chatTemplate
- presentation/pages/translate/TranslatePage

~~~js
import { useState } from "react";
import { GptMessage, MyMessage, TypingLoader, TextMessageBoxSelect } from '../../components';
import { translateTextUseCase } from '../../../core/use-cases';

interface Message {
  text: string;
  isGpt: boolean;
}

const languages = [
  { id: "alemán", text: "Alemán" },
  { id: "árabe", text: "Árabe" },
  { id: "bengalí", text: "Bengalí" },
  { id: "francés", text: "Francés" },
  { id: "hindi", text: "Hindi" },
  { id: "inglés", text: "Inglés" },
  { id: "japonés", text: "Japonés" },
  { id: "mandarín", text: "Mandarín" },
  { id: "portugués", text: "Portugués" },
  { id: "ruso", text: "Ruso" },
];

export const TranslatePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handlePost = async (text: string, selectedOption: string) => {
    setIsLoading(true);

    const newMessage = `Traduce: "${ text }" al idioma ${ selectedOption }`
    setMessages((prev) => [...prev, { text: newMessage, isGpt: false }]);

    const { ok, message } = await translateTextUseCase( text, selectedOption )
    setIsLoading(false);
    if ( !ok ) { //si no tengo el ok, lanzo una alerta
      return alert(message);
    }

    setMessages((prev) => [...prev, { text: message, isGpt: true }]); //ai tengo el ok le paso todos los mensajes anteriores con el spread y mando el message al state
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text="¿Qué quieres que traduzca hoy?" />

          {messages.map((message, index) =>
            message.isGpt ? (
              <GptMessage key={index} text={ message.text } />
            ) : (
              <MyMessage key={index} text={message.text} />
            )
          )}

          {isLoading && (
            <div className="col-start-1 col-end-12 fade-in">
              <TypingLoader />
            </div>
          )}
        </div>
      </div>

      <TextMessageBoxSelect
        onSendMessage={handlePost}
        placeholder="Escribe aquí lo que deseas"
        options={ languages }
      />
    </div>
  );
};
~~~

- components/chat-bubbles/GPTMessage

~~~js
import Markdown from "react-markdown";

interface Props {
  text: string;
}

export const GptMessage = ({ text }: Props) => {
  return (
    <div className="col-start-1 col-end-9 p-3 rounded-lg">
      <div className="flex flex-row items-start">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600 flex-shrink-0">
          G
        </div>
        <div className="relative ml-3 text-sm bg-black bg-opacity-25 pt-3 pb-2 px-4 shadow rounded-xl">
          <Markdown>{text}</Markdown>
        </div>
      </div>
    </div>
  );
};
~~~

- MyMessage

~~~js
interface Props {
  text: string;
}

export const MyMessage = ({ text }: Props) => {
  return (
    <div className="col-start-6 col-end-13 p-3 rounded-lg">
      <div className="flex items-center justify-start flex-row-reverse">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
          F
        </div>
        <div className="relative mr-3 text-sm bg-indigo-700 py-2 px-4 shadow rounded-xl">
          <div>{ text }</div>
        </div>
      </div>
    </div>
  );
};
~~~



