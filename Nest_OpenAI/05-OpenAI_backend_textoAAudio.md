# OpenAI Nest + React (backend) - Texto a Audio

- Aqui almacenaremos el archivo de audio en fileSystem pero en la vida real se haría en la nube
- controller.ts

~~~js
 @Get('text-to-audio/:fileId')
  async textToAudioGetter(
    @Res() res: Response,
    @Param('fileId') fileId: string,
  ) {
    const filePath = await this.gptService.textToAudioGetter(fileId);

    res.setHeader('Content-Type','audio/mp3');
    res.status(HttpStatus.OK);
    res.sendFile(filePath);

  }

  
  @Post('text-to-audio')
  async textToAudio(
    @Body() textToAudioDto: TextToAudioDto,
    @Res() res: Response,
  ) {
    const filePath = await this.gptService.textToAudio(textToAudioDto);

    res.setHeader('Content-Type','audio/mp3');
    res.status(HttpStatus.OK);
    res.sendFile(filePath);

  }
~~~

- El textToAudioDto

~~~js
import { IsOptional, IsString } from 'class-validator';

export class TextToAudioDto {
  
  @IsString()
  readonly prompt: string;

  @IsString()
  @IsOptional()
  readonly voice?: string; //modelo de voz a elegir
}
~~~

- En el service. hay que pasarlo a Buffer para poder escribirlo en sistema 

~~~js
async textToAudio({ prompt, voice }: TextToAudioDto) {
    return await textToAudioUseCase(this.openai, { prompt, voice });
  }

 //le paso el id (el nombre que generé al mp3) 
 async textToAudioGetter(fileId: string) {
   
   //resuelvo el path con un template string pasándole el nombre
   const filePath = path.resolve(
      __dirname,
      '../../generated/audios/',
      `${fileId}.mp3`,
    );

    //busco en el fileSystem que esté el archivo
    const wasFound = fs.existsSync(filePath);

  //si no está mando una excepción
    if (!wasFound) throw new NotFoundException(`File ${fileId} not found`);
  
  //si está lo retorno
    return filePath;
  }
~~~

- El useCase

~~~js
import * as path from 'path';
import * as fs from 'fs';

import OpenAI from 'openai';

interface Options {
  prompt: string;
  voice?: string; //voice opcional
}

//le paso el openAI y las options
export const textToAudioUseCase = async (
  openai: OpenAI,
  { prompt, voice }: Options,
) => {

  //tipos de voz
  const voices = {
    nova: 'nova',
    alloy: 'alloy',
    echo: 'echo',
    fable: 'fable',
    onyx: 'onyx',
    shimmer: 'shimmer',
  };

    //si no viene una voice en el body de la request, por defecto será nova
  const selectedVoice = voices[voice] ?? 'nova';

//indico el path donde se guardarán los archivos
  const folderPath = path.resolve(__dirname, '../../../generated/audios/');
  //creo el nombre que será la data en formato número.mp3
  const speechFile = path.resolve(`${folderPath}/${new Date().getTime()}.mp3`);

    //creo el directorio con la ruta
  fs.mkdirSync(folderPath, { recursive: true });

    //creo el mp3 usando OpneAI
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: selectedVoice, //le paso la voz
    input: prompt, //le paso el prompt
    response_format: 'mp3',
  });

    //tengo que pasarlo a Buffer para escribirlo en sistema
  const buffer = Buffer.from( await mp3.arrayBuffer() );
  fs.writeFileSync( speechFile, buffer );//le paso el nombre del archivo que he creado y el buffer


  return speechFile; //retorno la ruta con el nombre del archivo
};
~~~
-----

## Frontend

- Vamos a llamar al endpoint desde el frontend
- Está regresando un mp3, recibo un bloque de info (no un json)
- Debo colocarlo en un elemento de audio html para reproducirlo


~~~js


export const textToAudioUseCase = async (prompt: string, voice: string) => {
  try {
    const resp = await fetch(`${import.meta.env.VITE_GPT_API}/text-to-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, voice }),
    });

    if (!resp.ok)
      throw new Error("No se pudo realizar la generación del audio");

    const audioFile = await resp.blob(); //uso .blob porque retorna un mp3 (no tengo resp.json)
    const audioUrl = URL.createObjectURL(audioFile); //genero un URL que se pueda colocar en un audioTypeElement

    console.log({audioUrl});

    return { ok: true, message: prompt, audioUrl: audioUrl };

  } catch (error) {
    return {
      ok: false,
      message: "No se pudo realizar la generación del audio",
    };
  }
};
~~~

- TextToAudioPage

~~~js
import { useState } from "react";
import {
  GptMessage,
  MyMessage,
  TypingLoader,
  TextMessageBox,
  TextMessageBoxSelect,
  GptMessageAudio,
} from "../../components";
import { textToAudioUseCase } from "../../../core/use-cases";

const displaimer = `## ¿Qué audio quieres generar hoy?
* Todo el audio generado es por AI.
`;

const voices = [
  { id: "nova", text: "Nova" },
  { id: "alloy", text: "Alloy" },
  { id: "echo", text: "Echo" },
  { id: "fable", text: "Fable" },
  { id: "onyx", text: "Onyx" },
  { id: "shimmer", text: "Shimmer" },
];

interface TextMessage {
  text: string;
  isGpt: boolean;
  type: "text";
}

interface AudioMessage {
  text: string;
  isGpt: boolean;
  audio: string;
  type: "audio";
}

type Message = TextMessage | AudioMessage;

export const TextToAudioPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handlePost = async (text: string, selectedVoice: string) => {
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { text: text, isGpt: false, type: "text" },
    ]);

    //TODO: UseCase
    const { ok, message, audioUrl } = await textToAudioUseCase(
      text,
      selectedVoice
    );
    setIsLoading(false);

    if (!ok) return;

    setMessages((prev) => [
      ...prev,
      {
        text: `${selectedVoice} - ${message}`,
        isGpt: true,
        type: "audio",
        audio: audioUrl!,
      },
    ]);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <div className="grid grid-cols-12 gap-y-2">
          {/* Bienvenida */}
          <GptMessage text={displaimer} />

          {messages.map((message, index) =>
            message.isGpt ? (
              message.type === "audio" ? (
                <GptMessageAudio
                  key={index}
                  text={message.text}
                  audio={message.audio}
                />
              ) : (
                <GptMessage key={index} text={message.text} />
              )
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
        options={voices}
      />
    </div>
  );
};
~~~

- GptMessageAudio

~~~js
import Markdown from "react-markdown";

interface Props {
  text: string;
  audio: string;
}

export const GptMessageAudio = ({ text, audio }: Props) => {
  return (
    <div className="col-start-1 col-end-9 p-3 rounded-lg">
      <div className="flex flex-row items-start">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600 flex-shrink-0">
          G
        </div>
        <div className="relative ml-3 text-sm bg-black bg-opacity-25 pt-3 pb-2 px-4 shadow rounded-xl">
          <Markdown>{text}</Markdown>
          <audio 
            controls
            src={ audio }
            className="w-full"
            autoPlay
          />
        </div>
      </div>
    </div>
  );
};
~~~
