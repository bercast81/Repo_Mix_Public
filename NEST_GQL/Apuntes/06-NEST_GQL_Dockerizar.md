# 06- NEST GRAPHQL - DOCKERIZAR

## NOTA

- Hay que desinstalar bcrypt y @types/bcrypt e instalar **bcryptjs** y sus tipos
- Me da error en auth.service y user.service, corrijo las importaciones
- El objetivo de dockerizar la aplicación es tener la imagen lista para correr como si estuviera instalada
- Se puede hacer mediante un docker-compose.yml o un Dockerfile
- Vamos a tomar un linux, instalar Linux, instalar los paquetes de la aplicación, el build...
- Vamos a usar un gist de Fernando dónde tiene lo necesario para construir imágenes de Node
- docker-compose.prod.yml

~~~yml
version: '3'

services:
    db: 
      image: postgres:14.4
      restart: always
      ports:
        - "${DB_PORT}:${DB_PORT}"
      environment:
        POSTGRES_PASSWORD: ${DB_PASSWORD}
        POSTGRES_DB: ${DB_NAME}
      container_name: anylistDB
      volumes:
        - ./postgres:/var/lib/postgresql/data
    anylistapp:
      depends_on:
        - db
      build:
        context: .
        dockerfile: Dockerfile # le indico el Dockerfile para el build
      image: nest-graphql
      container_name: AnylistApp
      restart: always # reiniciar el contenedor si se detiene
      ports:
        - "${PORT}:${PORT}"

      environment:
        DB_PASSWORD: ${DB_PASSWORD}
        DB_NAME: ${DB_NAME}
        DB_HOST: ${DB_HOST}
        DB_PORT: ${DB_PORT}
        DB_USERNAME: ${DB_USERNAME}
        JWT_SECRET: ${JWT_SECRET}
        PORT: ${PORT}
~~~

- DockerFile

~~~Dockerfile
# Install dependencies only when needed
# usamos la imagen de node de 5MB y le ponemos el nombre de deps
FROM node:18-alpine3.15 AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why

libc6-compat might be needed.

# libc6-compat es para ciertos paquetes/procedimientos internos (opcional)
RUN apk add --no-cache libc6-compat
# trabajaremos en este directorio . Cualquier path relativo va a ser en este directorio
WORKDIR /app
# copiamos el json de nuestro proyecto
COPY package.json yarn.lock ./
# congelamos el yarn-lock
RUN yarn install --frozen-lockfile

# Build the app with cache dependencies contenedor solo para construir laaplicación
# otro FROm es otra etapa
FROM node:18-alpine3.15 AS builder
# trabajamos en /app
WORKDIR /app
# desde deps instalamos en el path app/node_modules los node-modules
COPY --from=deps /app/node_modules ./node_modules
# una vez copiados los modulos de node, le digo que copie todo lo que se encuentraen nuestro proyecto
# hay que hacer algo para evitar que copie literalmente todo lo que hay en elproyecto, porque eso no me interesa
# nop quiero que copie dist, los módulos de node por lo que creo un .dockerignore
COPY . .
# ejecuto el build
RUN yarn build

# Production image, copy all the files and run next
# usamos una nueva imagen de node limpia
FROM node:18-alpine3.15 AS runner
# Set working directory
# le indico el directorio
WORKDIR /usr/src/app
# copio el pckage.json y el yarn.lock y lo pegamos en el working directory
COPY package.json yarn.lock ./
# ejecuto el yarn install
RUN yarn install --prod
# copio desde la imagen builder (anterior) el /app/dist en el directorio ./dist
COPY --from=builder /app/dist ./dist
# el comando para levantarlo (tambien se podria usar nest start)
CMD [ "node","dist/main" ]
~~~

- .dockerignore

~~~
dist/
node_modules/

Nest_GraphQL_ALL.md 2024-06-18

postgres/
.git/
~~~

- Usaremos libc6-compat como librería para Node
- El Dockerfile esta dividido en tres etapas
- Instalación de dependencias
- Un contenedor solamente para construir la aplicación
- El runner que hará correr la aplicación que es lo que terminamos ejecutando
- De esta manera, si no tenemos cambios en nuestras dependencias es una construcción mucho más rápida
- Para construir uso el markdown de BUILD
- Build

> docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build

- Run

> docker-compose -f docker-compose.prod.yml --env-file .env.prod up

- Nota: por defecto, docker-compose usa el archivo .env, por lo que si tienen el archivo .env y lo configuran con sus variables de entorno de producción, bastaría con

> docker-compose -f docker-compose.prod.yml up --build

Cambiar nombre

> docker tag <nombre app> <usuario docker hub>/<nombre repositorio>

- Ingresar a Docker Hub

> docker login

- Subir imagen

> docker push <usuario docker hub>/<nombre repositorio>


- Ya puedo usar la imagen con docker-compose
- Si quiero cambiar las variables de entorno lo hago desde el archivo docker-compose.prod.yml
- Si elimino la imagen de postgres del docker-compose.prod.yml saltará un error como "no encryption..."
- Digital Ocean está esperando una conexión SSL como definimos en app.module
- En app.module

~~~js
({{...}
[TypeOrmModule.forRoot({
type: 'postgres',
ssl:(process.env.STATE === 'prod')
?{
rejectUnauthorized: false,
sslmode: 'require'
}
: false as any,
host: process.env.DB_HOST,
port: +process.env.DB_PORT,
username: process.env.DB_USERNAME,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
synchronize: true,
autoLoadEntities: true,
}),
ItemsModule,
UsersModule,
AuthModule,
SeedModule,
CommonModule,
ListsModule,
ListItemModule,
],
controllers: [],

providers: [],
})
export class AppModule {}
~~~

Debo colocar la variable STATE en el docker-compose.prod.yml

~~~yml
environment:
    STATE: ${STATE}
    DB_PASSWORD: ${DB_PASSWORD}
    DB_NAME: ${DB_NAME}
    DB_HOST: ${DB_HOST}
    DB_PORT: ${DB_PORT}
    DB_USERNAME: ${DB_USERNAME}
    JWT_SECRET: ${JWT_SECRET}
    PORT: ${PORT}
~~~

- Ahora tenemos una imagen creada

### Usar la imagen y regenrarla sin compose

- No tengo porqué desplegar la imagen en DockerHub
- Para hacer el build, puedo renombrarla a nest-graphql-prod

> docker build -t nest-grapql-prod docker run nest-graphql-prod

- El comando docker compose establece las variables de entorno, docker build no
- Puedo usar -e

> docker run -e DB_PORT=5300 nest-graphql-prod

- Para no especificar una por una, también mapear el puerto 8080 de mi computadora con el 4000 del contenedor

> docker run --env-file=.env.prod -p 8080:4000 nest-graphql-prod

- En la consola dirá que corre en el puerto 4000 pewro para mi será el 8080
- En mi navegador apuntaré a localhost:8080
- Si quiero subir la imagen en dockerHub creo un repositorio y subo la imagen