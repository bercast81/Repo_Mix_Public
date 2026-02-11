# 03 gRPC - Prisma y CockroachDB

- Definiremos la DB con prisma
- Creo la carpeta database en la raíz
- Creamos el proyecto con yarn init
- Instalamos prisma
  
> yarn add prisma -dev


- Añadimos dos scripts en el packaghe.json
- Para verificar todos los cambios entre la DB y el archivo .prisma para generar la migración y mantener la DB actualizada uso db:migrate
    - uso dev para migrar en modo desarrollo y definimos el schema pasaándole la ubi 
 
~~~json
"scripts": {
    "db:migrate": "npx prisma migrate dev --schema ./prisma/schema.prisma",
    "db:push": "npx prisma db push --schema ./prisma/schema.prisma"
  }
~~~

- Creo la carpeta prisma y creo el archivo schema.prisma
- Prisma puede generar el schema a raíz de una DB y al revés, generar una DB a través de un schema 

~~~prisma
//defino la conexión
datasource db {
  provider = "cockroachdb" //el tipo de db
  url      = env("DATABASE_URL") //la variable de entorno donde está la URL DE LA db
}

generator client {
  provider        = "prisma-client-js" //prisma generará una librería para acceder a nuestro proyecto dado un schema
}                                       //es decir, usaremos de forma nativa Prisma.loquesea para realizar als operaciones con la db

model Dock {
  id        Int      @id 
  maxBikes  Int      @default(5)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  bikes Bike[]  //la referencia está en Bike
  originRides Ride[] @relation("originDock") //relaciones con ride
  targetRides Ride[] @relation("targetDock") //relaciones con ride
}

model Bike {
  id        Int       @id 
  dockId    Int?       
  totalKm   Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  dock      Dock?     @relation(fields: [dockId], references: [id]) //referencia con el dock
  //rides     Ride[]    @relation("ride") 
}

model Ride {
  id            Int       @id @default(sequence())  
  km            Int      
  bikeId        Int
  originDockId  Int
  targetDockId  Int?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  //bike          Bike      @relation("ride", fields: [bikeId], references: [id]) //referencia con Bike
  originDock    Dock      @relation("originDock", fields: [originDockId], references: [id])
  targetDock    Dock?     @relation("targetDock", fields: [targetDockId], references: [id])
}
~~~

- Creo la variable de entorno en .env (en la raíz)
- CockroachDB usa postgres por debajo
- Deshabilito el password

~~~
DATABASE_URL="postgresql://root@localhost:26000/driveyourcity?sslmode=disable"
~~~

- Uso el comando migrate

> yarn run db:migrate

- Para conectarme puedo usar TablePlus
  - host: localhost
  - user: root
  - Port: 26000
  - Database: driveyourcity
  - SSLMode: disabled
- Si voy al UI de cockroach en  localhost:8080 puedo ver a driveyouircity y ya voy a poder ver la actividad SQL