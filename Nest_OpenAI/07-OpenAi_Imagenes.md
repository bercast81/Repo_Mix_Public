# OpenAI Nest + react - Generación de imágenes

- En el controller

~~~js
@Post('image-generation')
  async imageGeneration(@Body() imageGenerationDto: ImageGenerationDto) {
    return await this.gptService.imageGeneration(imageGenerationDto);
  }

  @Get('image-generation/:filename')
  async getGenerated(@Res() res: Response, @Param('filename') fileName: string) {
    const filePath = this.gptService.getGeneratedImage(fileName);
    res.status(HttpStatus.OK);
    res.sendFile(filePath);
  }

   @Post('image-variation')
  async imageVariation(@Body() imageVariationDto: ImageVariationDto) {
    return await this.gptService.geneateImageVariation(imageVariationDto);
  }

~~~

- Dto
- image-generation
~~~js
import { IsOptional, IsString } from 'class-validator';


export class ImageGenerationDto {

  @IsString()
  readonly prompt: string;


  @IsString()
  @IsOptional()
  readonly originalImage?: string;

  @IsString()
  @IsOptional()
  readonly maskImage?: string;


}
~~~

- image-variation

~~~js
import { IsString } from 'class-validator';



export class ImageVariationDto {

  @IsString()
  readonly baseImage: string;

}
~~~

- use-case/image-generation
- Necesito poder mandar el originalImage y el maskImage desde el frontend para poder generar la edición de la foto
- Para decirle que trabaje sobre, por ejemplo, cambiarle un ojo al personaje generado, le quitaré el ojo con GIMP (o Adobe) y dejaré visible la máscara que hay detrás
- Debemos mandarle el png con esa transparencia (canal ALPHA)
- Lo hago en el método download image as png
- Entonces si viene una imagen y una máscara lo que quiere es la edición
- La edición solo funcioan con Dall-e-2 por el momento
- Como digo, necesito borrar el contorno y mandarle las dos imágenes (la original y la imagen con la zona recortada dónde quiero la variación)
- Si no recibo la maskImage ni la originalImage, creo una imagen nueva con el prompt (que si es obligatorio desde la interface)
- 
~~~js
import * as fs from 'fs';
import * as path from 'path';

import OpenAI from 'openai';
import { downloadBase64ImageAsPng, downloadImageAsPng } from 'src/helpers';

interface Options {
  prompt: string;
  originalImage?: string;
  maskImage?: string;
}

export const imageGenerationUseCase = async (
  openai: OpenAI,
  options: Options,
) => {
  const { prompt, originalImage, maskImage } = options;

  // Si el originalImage o el maskInage no vienen ejecuto el generate
  if (!originalImage || !maskImage) {
    const response = await openai.images.generate({
      prompt: prompt,
      model: 'dall-e-3',
      n: 1, //número de imágenes, dall-e-3 solo soporta 1
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    // Guardo en el FS
    const fileName = await downloadImageAsPng(response.data[0].url); //el url que me devuele OPneAi de la imagen generada
    const url = `${process.env.SERVER_URL}/gpt/image-generation/${fileName}`;

    return {
      url: url,
      openAIUrl: response.data[0].url,
      revised_prompt: response.data[0].revised_prompt,
    };
  }

    //Si llego hasta aqui es que si tengo la originalImage y la maskImage
  // originalImage=http://localhost:3000/gpt/image-generation/1703770602518.png
   //la imagen en formato base64 será algo así
  // maskImage=Base64;ASDKJhaskljdasdlfkjhasdkjlHLKJDASKLJdashlkdjAHSKLJDhALSKJD

  const pngImagePath = await downloadImageAsPng(originalImage, true ); //obtengo la imagen de mi backend
  const maskPath = await downloadBase64ImageAsPng(maskImage, true ); //obtengo la máscara de mi backend

  const response = await openai.images.edit({
    model: 'dall-e-2',
    prompt: prompt,
    image: fs.createReadStream(pngImagePath), //le paso la imagen original
    mask: fs.createReadStream(maskPath), //la máscara
    n: 1, //solo devuelve una imagen
    size: '1024x1024',
    response_format: 'url',
  });

  const fileName = await downloadImageAsPng(response.data[0].url);
  const url = `${process.env.SERVER_URL}/gpt/image-generation/${fileName}`;

  return {
    url: url,
    openAIUrl: response.data[0].url,
    revised_prompt: response.data[0].revised_prompt,
  };
};
~~~

- use-cases/image-variation

~~~js
import * as fs from 'fs';

import OpenAI from 'openai';
import { downloadImageAsPng } from 'src/helpers';

interface Options {
  baseImage: string;
}

export const imageVariationUseCase = async (
  openai: OpenAI,
  options: Options,
) => {
  const { baseImage } = options; //baseImage viene a 
  
  const pngImagePath = await downloadImageAsPng( baseImage, true ); //obtengo la imagen de mi backend

  // const response = await openai.images.createVariation({
  //   model: 'dall-e-2',
  //   image: fs.createReadStream(pngImagePath),
  //   n: 1,
  //   size: '1024x1024',
  //   response_format: 'url'
  // });
  const response = await openai.images.createVariation({
    model: 'dall-e-2',
    image: fs.createReadStream(pngImagePath),
    n: 1,
    size: '1024x1024',
    response_format: 'url'
  });

  const fileName = await downloadImageAsPng( response.data[0].url );
  const url = `${ process.env.SERVER_URL }/gpt/image-generation/${ fileName }`


  return {
    url: url, 
    openAIUrl: response.data[0].url,
    revised_prompt: response.data[0].revised_prompt,
  }
};
~~~

- helpers/download-image-as-png
- instalo sharp con npm i sharp

~~~js
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

import { InternalServerErrorException } from '@nestjs/common';

export const downloadImageAsPng = async (
  url: string,
  fullPath: boolean = false,
) => {
  const response = await fetch(url); //obtengo la imagen

  if (!response.ok) {
    throw new InternalServerErrorException('Download image was not possible');
  }

  const folderPath = path.resolve('./', './generated/images/');
  fs.mkdirSync(folderPath, { recursive: true });

  const imageNamePng = `${new Date().getTime()}.png`;
  const buffer = Buffer.from(await response.arrayBuffer());

  // fs.writeFileSync( `${ folderPath }/${ imageNamePng }`, buffer );
  const completePath = path.join(folderPath, imageNamePng);

  await sharp(buffer).png().ensureAlpha().toFile(completePath); //nos aseguramos que sea un png y tenga el canal ALPHA!!

  return fullPath ? completePath : imageNamePng;
};

export const downloadBase64ImageAsPng = async (
  base64Image: string,
  fullPath: boolean = false,
) => {
  // Remover encabezado
  base64Image = base64Image.split(';base64,').pop();
  const imageBuffer = Buffer.from(base64Image, 'base64');

  const folderPath = path.resolve('./', './generated/images/');
  fs.mkdirSync(folderPath, { recursive: true });

  const imageNamePng = `${new Date().getTime()}-64.png`;

  const completePath = path.join(folderPath, imageNamePng);
  // Transformar a RGBA, png // Así lo espera OpenAI
  await sharp(imageBuffer).png().ensureAlpha().toFile(completePath);

  return fullPath ? completePath : imageNamePng;
};
~~~

- el servicio

~~~js
 async imageGeneration( imageGenerationDto: ImageGenerationDto ) {
    return await imageGenerationUseCase( this.openai, { ...imageGenerationDto } );
  }

  getGeneratedImage( fileName: string ) {

    const filePath = path.resolve('./','./generated/images/', fileName);
    const exists = fs.existsSync( filePath );
    

    if ( !exists ) {
      throw new NotFoundException('File not found');
    }

    return filePath;
  }

  async geneateImageVariation( { baseImage }: ImageVariationDto ) {
    return imageVariationUseCase( this.openai, { baseImage } );
  }
~~~
-----

# Frontend

