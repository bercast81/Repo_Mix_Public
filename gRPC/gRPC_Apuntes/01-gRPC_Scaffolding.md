# 01 gRPC - Scaffolding

## Drive Your City

- Aplicación de microservicios para uso de bicicletas en la ciudad
- Tenemos un dock con varias bicis aparcadas, con la aplicación podemos desbloquear la bici y desplazarnos
- Se contará el número de km
- Como podemos estar hablando de miles de bicicletas necesitamos un gran desempeño que sea escalable, y con baja latencia
----

## Arquitectura

- Capa más externa:
  - Cliente: 
    - BikeIoT: se comunica con el servidor
- Siguiente capa: 
  - Microservicios: (responsabilidad única, CRUD)
    - RideService: para controlar mis viajes. Comenzar un viaje requiere una orquestación de varios eventos.
      - Requiere verificar que la bici este disponible, que la persona tenga una cuenta habilitada, etc
    - DockService: crear un dock donde aparcar la bici, etc
    - BikeService: para controlar las bicis. Añadir o retirar una bici a un dock
- Capa más interna: usaremos CockroachDB (altamente escalable)
  - Load Balancer:  
    - DB-1
      - DB-2
      - DB-3
- Podemos pensar que el microservicio de dock lo usaremos pocas veces a lo largo del día (crear, eliminar, actualizar un dock)
- Sin embargo ride requiere una escalabilidad alta, ya que en hora punta puede tener una alta demanda
- gRPC es adecuado por los requerimientos de calidad
- Usaremos gRPC para comunicarnos entre microservicios
- Vamos a tener un cliente en ride que se va a comunicar con el dock, dock se comunicará con bike y así
------

## Scaffolding y Docker

- Crearemos las carpetas que usaremos a lo largo de todo el trabajo
- Instanciarermos la DB y el balanceador de carga
- El proyecto se llama DriveYourCity
- Creamos en la raíz docker-compose.yml

~~~yml
version: '3.9'

services:

  roach-0:
    container_name: roach-0
    hostname: roach-0
    image:  cockroachdb/cockroach-unstable:v23.2.0-beta.1  
    # --insecure porque no nos complicaremos con autenticación
    # al crear un cluster nos uniremos a varias instancias, para ello uso join
    # establezco el puerto 26257 y también el de advertise que necesita cockroachDB
    # limito la cantidad de memoria que van a usar nuestros componentes y el caché  
    command: start --insecure --join=roach-0,roach-1,roach-2 --listen-addr=roach-0:26257 --advertise-addr=roach-0:26257 --max-sql-memory=.25 --cache=.25
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes' # le permito conectarse sin password

  roach-1:
    container_name: roach-1
    hostname: roach-1
    image:  cockroachdb/cockroach-unstable:v23.2.0-beta.1
    command: start  --insecure --join=roach-0,roach-1,roach-2 --listen-addr=roach-1:26257 --advertise-addr=roach-1:26257 --max-sql-memory=.25 --cache=.25
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'

  roach-2:
    container_name: roach-2
    hostname: roach-2
    image:  cockroachdb/cockroach-unstable:v23.2.0-beta.1
    command: start  --insecure --join=roach-0,roach-1,roach-2 --listen-addr=roach-2:26257 --advertise-addr=roach-2:26257 --max-sql-memory=.25 --cache=.25
    environment:
      - 'ALLOW_EMPTY_PASSWORD=yes'

  init: # con init nos aseguraremos de que todo esté inicializado
    container_name: init
    image:  cockroachdb/cockroach-unstable:v23.2.0-beta.1 # uso la misma imagen de cockroach para inicializar este container
    command: init --host=roach-0 --insecure # para inicializar el cluster completo basta con incializar uno de los nodos que ya está estable
    depends_on:
      - roach-0

  lb: # balanceador de carga para acceder a estas instancias
    container_name: lb
    hostname: lb
    build: haproxy # este balanceador se llama haproxy
    ports:  # usa 3 puertos
      - "26000:26000" # conecta a todo el cluster
      - "8080:8080" # cockroachDB ofrece una interfaz en el 8080
      - "8081:8081" # para que los nodos entre diferentes instancias de cockroachDB estén actualizados usamos 8081
    depends_on: # dependerá de que estas instancias estén inicializadas, por ello crearé init para asegurarme de ello
      - roach-0
      - roach-1
      - roach-2

  client: # para poder ejecutar comandos al cluster creamos un cliente
    container_name: client
    hostname: client
    image:  cockroachdb/cockroach-unstable:v23.2.0-beta.1
    entrypoint: ["/usr/bin/tail", "-f", "/dev/null"] # ubicación del comando que nos va a permitir acceder a esta instancia de cockroachDB, ver logs, etc

~~~

- Para crear el container de haproxy creo una nueva carpeta en la raíz del proyecto llamada haproxy
- Creo el Dockerfile donde defino el contenedor del balanceador de carga

~~~js
FROM haproxy:lts-bullseye // usamos esta imagen

LABEL maintainer="artemervits at gmail dot com" // nos permitirá identificar este container (asigno valor por defecto)

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg // copiaremos nuestro archivo de configuración haproxy.cfg en la ubicación del container /usr/...

// expongo los tres puertos que necesito (que ya he definido antes)
EXPOSE 26257
EXPOSE 8080
EXPOSE 8081
~~~

- Dentro de la misma carpeta haproxy creo haproxy.cfg copn el código por defecto

~~~cfg
global
    log stdout format raw local0 info
    maxconn 20000

defaults
    log                 global
    timeout connect     10m
    timeout client      30m
    timeout server      30m
    option              clitcpka
    option              tcplog

listen cockroach-jdbc
    bind :26000    ---> vamos a hacer un bind de todas las instancias que están en roach-0, roach-1, roach-2 del puerto 26257 al 26000
    mode tcp
    balance leastconn
    option httpchk GET /health?ready=1
    server roach-0 roach-0:26257 check port 8080   ---> corriendo en el 26257 (puerto por defecto de cockroachDB) 
    server roach-1 roach-1:26257 check port 8080   
    server roach-2 roach-2:26257 check port 8080

listen cockroach-ui
    bind :8080   ---> lo mismo con el 8080
    mode tcp
    balance leastconn
    option httpchk GET /health
    server roach-0 roach-0:8080 check port 8080
    server roach-1 roach-1:8080 check port 8080
    server roach-2 roach-2:8080 check port 8080

listen stats
    bind :8081  ---> podremos acceder al balanceador de carga a través del 8081
    mode http
    stats enable
    stats hide-version
    stats realm Haproxy\ Statistics
    stats uri /
~~~

- docker compose up no nos sirve porque tenemos que construir primero el contenedor de haproxy
- Uso -f para indicar que es el archivo de la raíz  con -d build porquye tenemos dependencias con todos aquellos contenedores que necesiten ser construidos 

> docker compose -f docker-compose.yml up -d --build

- En localhost:8081 puedo vere el balanceador de carga
- En localhost:8080 tengo la UI de cockroachDB
  - Tiene las DB defaultdb, postgres y system que trae por defecto
  