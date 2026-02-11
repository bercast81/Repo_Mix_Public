# 02 gRPC - Definir dominio en archivos .proto

- Tenemos el Dock, Bike y Ride
- En un dock pueden haber 0 o muchas bicis
- Una bici puede estar en 1 Dock (ranura de estacionamiento)
- Una bici hace un viaje
- En un viaje hay un dock de origen y un dock de destino
- Creo la carpeta proto en la raíz con Entities.proto
- Primero siempre defino la siuntaxis y el nombre del paquete

~~~proto
syntax = "proto3";

package DriveYourCity;

message Bike {
    int32   id = 1;
    int32   totalKm = 2;
    Dock    dock = 3; 
}

message Dock {
    int32       id = 1;
    int32       maxBikes = 2;
    repeated    Bike bikes = 3; //arreglo repetido de bicis
}

message Ride {
    int32   id = 1;    
    int32   km = 2;
    Bike    bike = 3;
    Dock    originDock = 4;
    Dock    targetDock = 5;    
}
~~~

- Ahora definiremos los proto de los 3 microservicios
- Se puede construir de varias formas. En este caso vamos a dividir las interfaces en archivos diferentes, ya que es más claro
- Creo Dock.proto
- Como siempre, declaro la sintaxis, el paquete y en este caso importo lel .proto de entidades

~~~proto
syntax = "proto3";

package DriveYourCity;

import "Entities.proto";

service IDockService {
  rpc CreateDock (CreateDockRequest) returns (DockResponse);
  //es una response de stream pq no queremos enviar un objeto gigante con todos los docks
  //enviaremos unbo tras otro
  rpc GetAllDocks (GetAllDocks) returns (stream DockResponse); 
  rpc GetDockById (GetDockByIdRequest) returns (DockResponse);
  rpc IsDockAvailable(IsDockAvailableRequest) returns (IsDockAvailableResponse);
}

// Communication Entities - Requests
message CreateDockRequest {
  Dock dock = 1;
}
message GetAllDocks {

}
message GetDockByIdRequest {
  int32 dockId = 1;
}
message IsDockAvailableRequest {
  int32 dockId = 1;
}

// Communication Entities - Responses
message DockResponse {
  Dock dock = 1;
}
message IsDockAvailableResponse {
  bool isAvalable = 1;
}
~~~

- Seguimos con las bicicletas
- Debemos poder obtener una bici por el id, crear una bici y añadir o quitar una bici de un dock

~~~proto
syntax = "proto3";

package DriveYourCity;

import "Entities.proto";

service IBikeService {
    rpc GetBikeById (GetBikeByIdRequest) returns (BikeResponse);
    rpc CreateBike (BikeRequest) returns (BikeResponse);
    rpc AttachBikeToDock (AttachBikeToDockRequest) returns (BikeResponse);
    rpc UnAttachBikeFromDock (UnAttachBikeFromDockRequest) returns (BikeResponse);
}

// Communication Entities - Requests
message GetBikeByIdRequest {
  int32 bikeId = 1;
}
message BikeRequest {
  Bike bike = 1;
}

message AttachBikeToDockRequest {
  int32 bikeId = 1;
  int32 dockId = 2;
  int32 totalKms = 3; //queremos el número de km antes de ser añadida al nuevoi dock
}

message UnAttachBikeFromDockRequest {
  int32 bikeId = 1;  //solo necesito el bikeId si ya está en un dock 
}

// Communication Entities - Responses
message BikeResponse {
  Bike bike = 1;
}
~~~

- Vamos con ride
- Voy a tener que comprobar que esa bicileta esté disponible en un dock, que se pueda desacoplar del dock y actualizar la instancia de la bicileta y el dock en la base de datos para generar consistencia
- El objetivo de esta prueba de concepto es ir actualizando la información de kilometraje de la bicicleta

~~~proto
syntax = "proto3";

package DriveYourCity;

import "Entities.proto";

service IRideService {
    rpc StartRide (StartRideRequest) returns (RideResponse);
    rpc UpdateRide (stream UpdateRideRequest) returns (stream RideResponse); //actualizaremos la distancia recorrida cada x por stream bidireccional
    //necesito manteener este canal TCP abierto para enviar y recibir de forma continua la información
    rpc EndRide (EndRideRequest) returns (stream EndRideResponse); //endRide es un stream porque enviaremos diferente información
}

// Communication Entities - Requests
message StartRideRequest {
    int32 bikeId = 1;    //con qué bicicleta voy as inicar el viaje
}

message UpdateRideRequest {
    int32 rideId    = 1;
    int32 newKms    = 2;
}

message EndRideRequest {
    int32 rideId = 1; //necesito el id del ride
    int32 dockId = 2; //necesito el dock de destino
}

// Communication Entities - Responses
message RideResponse {
    Ride ride = 1;    
}

message EndRideResponse {
    string info = 1;
}
~~~

- Con esto tenemos definido el contexto de dominio del proyecto
- Tenemos las entidades y los servicios
- **BikeIoT** se va a conectar **solamente a los servicios de ride**
- Bike y dock se comunicarán entre ellos
- Ride se comunicará con dock también (para verificar si un dock está disponible antes de terminar un viaje)
- Vamos a tener todo en un mismo repositorio
- Como compartir las definiciones de .proto
  - Un repo para los archivos .proto: 
    - Están todas las definiciones en un mismo lugar. 
    - Muchas dependencias. 
    - Si ese repo se rompe los demás van a tenr problemas
  - Separados en repositorios por cada servicio: 
    - Un repo por cada subdominio. 
    - Separamos mejor las responsabilidades.
    - Muchos pequeños repos
    - Va a tocar construir un pipeline para cada repo para generar el código fuente
  - Copiar y pegar
    - Muy válida y bastante usada
    - Sencilla de usar
    - Todos los repo van a tener una copia del modelo de dominio
    - No creo dependencias a dominios externos ni divido en pequeños subdominios
    - Vamos a tener muchas versiones que pueden desactualizarse
    - Puede volverse poco claro (qué controla, qué maneja, puesto que está todo copiado)
  - gRPC server reflection protocol 
- Aquí lo manejaremos todo en la carpeta raíz

