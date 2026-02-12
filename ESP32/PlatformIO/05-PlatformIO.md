# PlatformIO - MQTT

- Tenemos un publicador que publica info en un tópico
- Esa info es recibida por un Broker (servidor MQTT) y la reenvía a quienes estén suscritos a ese tópico/tema
- Un suscriptor puede estar suscrito a más de un tópico y pueden existir n suscriptores
- El publicador puede publicar a más de un tópico y pueden existir n publicadores
  
## Servidor MQTT público

- Usaremos HiveMQ

> https://www.hivemq.com/mqtt/public-mqtt-broker/

- Vamos a Try Browser Client
- Agrego una nueva suscripición de Qos 2 de color naranja con el tópico prueba1/#
  - El hashtag después del / significa que todos los topics que vayan después de prueba1, quien esté suscrito a prueba1 los recibirá
- Vamos a tenr 2 ESP32, uno va a estar publicando y el otro va a estar suscrito al mismo tópico
- Creamos un topico más especifico ESP32/Udemy/Curso/Medidas
- Primero vamos a empezar con un ESP32 como publicador y en esta página nos vamos a suscribir al tópico en el que el ESP32 va a estar publicando
- Luego usaremos la página como un publicador y el ESP32 como un suscriptor

## MQTT - Publicación / Subscripción

- Las conexiones me las proporciona la web, el Host: broker.hivemq.com, el TCP Port: 1883, y el Websocket Port 8000
- Instalo la libreria PubSubClient y ArduinoJson
- Genero un id aleatorio para conectarme (útil para varios dispositivos)
- Si solo tengo un ESP32 no habría problema
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// RED
#define SSID "Enterprise" //Mi red
#define PASS "0112358Chino" //Mi password
void InitWiFi();

const char* MQTT_Server = {"broker.hivemq.com"}; //server
int Puerto = 1883; //puerto del server
String topico = "Udemy/ESP32/Curso/";
const char* topicoS = "Udemy/ESP32/test/#";
int i = 0;
String ClientId;
String mensaje;

WiFiClient wifiClient; //instancia de tipo WiFiClient
PubSubClient MQTTClient(wifiClient); //le paso la instancia de WiFiClient a una instancia de tipo PubSubClient

void ConnectMQTT();
void callback(char *topico, uint8_t *msg, unsigned int longitud);

void setup() {
  Serial.begin(9600);
  InitWiFi();
  MQTTClient.setServer(MQTT_Server, Puerto); //seteamos el server con el puerto
 
 //lo que tiene que hacer cuando llegue un mensaje al tópico que nos hemos suscrito
  MQTTClient.setCallback(callback); 
  
}

void loop() {
  
  ConnectMQTT(); //conexión al broker

  //publicamos, le paso el tópico y el i parseado a String y luego a apuntador de tipo char
  MQTTClient.publish(topico.c_str(), String(i).c_str());
  i = i>117?0:i;
  i++;
  delay(1000);
}

//callback debe tener estos argumentos (este tópico solo existe en esta función, NO ES Udemy/ESP32/Curso/)
void callback(char *topico, uint8_t *msg, unsigned int longitud){

  Serial.println(topico);
  Serial.println(longitud);

  for(int j=0; j<longitud; j++){ //recorro el mensaje, un apuntador lo puedo tratar como un arreglo
    mensaje += (char)msg[j]; //(char) para castear de números (código ASCII) a string
    //Serial.print(msg[j]);
    //Serial.print(": ");
    //Serial.print((char)msg[j]);
  }

  Serial.println(mensaje);
  mensaje = ""; //vacío mensaje para el próximo
  
}



void ConnectMQTT(){
  if(!MQTTClient.connected()){ //si no esta conectado genero el id aleatorio para conectarme
    ClientId = String(random(1000)); //genero un id aleatorio para conectarme
    if(MQTTClient.connect(ClientId.c_str())){ //si está conectado le paso el puntero char
          Serial.println("Conexion exitosa a broker");
          MQTTClient.subscribe(topicoS); //me subscribo a tópicos (recibiré mensajes MQTT)
      }else{
          Serial.println("Algo paso :(");
    }
  }
MQTTClient.loop(); //necesario para la subscripción. Está a la escucha
}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() != WL_CONNECTED){
    Serial.print(".");
    delay(50);
  }

  if(WiFi.status() == WL_CONNECTED){
    Serial.println("");
    Serial.println("");
    Serial.println("Conxion exitosa!!!");
  }

  Serial.println("");
  Serial.print("Tu IP es: ");
  Serial.println(WiFi.localIP());
}
~~~

## MQTT - Serialización / Deserialización

- Se que la medida del JSON es 480 porque le he pasado un JSON de ejemplo a la página 

> https://arduinojson.org/v6/assistant/

- La deserialización la hago dentro de la función callback, que es donde recibo el mensaje

- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// RED
#define SSID "Enterprise"
#define PASS "0112358Chino"
void InitWiFi();

const char* MQTT_Server = {"broker.hivemq.com"};
int Puerto = 1883;
String topico = "Udemy/ESP32/Curso/";
const char* topicoS = "Udemy/ESP32/test/#";
int i = 0;
String ClientId;
String mensaje;

WiFiClient wifiClient;
PubSubClient MQTTClient(wifiClient);

void ConnectMQTT();
void callback(char *topico, uint8_t *msg, unsigned int longitud);

String myJson; 
//El JSON principal tiene 4 propiedades, temperatura, led. msg, MPU 
//con un objeto anidado que tiene 2 propiedades (Ac, Gi)
//Ac y Gi son objetos que tienen 3 propiedades (x,y,z)
const int tam = JSON_OBJECT_SIZE(4) + JSON_OBJECT_SIZE(2) + 2*JSON_OBJECT_SIZE(3);
StaticJsonDocument<480> Medidas; //le paso el tamaño del JSON a mi JSON Medidas

//variables para la deserialización
float AcX, AcY, AcZ, GiX, GiY, GiZ;
int temperatura;
bool led;
String msgg;


void setup() {
  Serial.begin(9600);
  InitWiFi();
  MQTTClient.setServer(MQTT_Server, Puerto);
  MQTTClient.setCallback(callback);

  /******************************* Serializacion *****************************************/

  Medidas["temperatura"].set(22); //le paso 22 como valor
  Medidas["Led"] = true;
  Medidas["msg"] = "Hola";

  JsonObject MPU = Medidas.createNestedObject("MPU"); //anido dentro de Medidas
  JsonObject Ac = MPU.createNestedObject("Ac"); //anido dentro de MPU
  JsonObject Gi = MPU.createNestedObject("Gi");

  Ac["x"] = 123.123;
  Ac["y"] = 123.123;
  Ac["z"] = 123.123;

  Gi["x"] = 123.123;
  Gi["y"] = 123.123;
  Gi["z"] = 123.123;

  serializeJson(Medidas, myJson);

  /***************************************************************************************/

  Serial.println(myJson);

  
}

void loop() {
  
  ConnectMQTT();

  MQTTClient.publish(topico.c_str(), myJson.c_str()); //le mando el JSON
  
  delay(1000);
}

void callback(char *topico, uint8_t *msg, unsigned int longitud){

  for(int j=0; j<longitud; j++){ //recorro mensaje
    mensaje += (char)msg[j];
  }

  Serial.println(mensaje);
  // Codigo 

/********************************** Deserializacion ******************************************/
  //como 3er parámetro puedo pasarle DeserializationOption::NestingLimit(4) (max 4 niveles de anidación)
  DeserializationError error = deserializeJson(Medidas, mensaje); //guardo mensaje en Medidas
  Serial.print("Error: "); Serial.println(error.c_str());
  if(error == DeserializationError::Ok){ //si no hay error (status OK)

    if(Medidas.containsKey("temperatura")){ //me aseguro de que contenga temperatura
      temperatura = Medidas["temperatura"].as<int>(); //se la asigno a Medidas, le paso el tipo con .as
    }
    
    if(Medidas.containsKey("Led")){
      led = Medidas["Led"].as<bool>();
    }

    if(Medidas.containsKey("msg")){
      msgg = Medidas["msg"].as<String>();
    }

    if(Medidas.containsKey("MPU")){
      JsonObject MPU = Medidas["MPU"].as<JsonObject>(); //MPU es de tipo JsonObject

      //puedo hacerlo así
      AcX = MPU["Ac"]["x"].as<float>();
      AcY = MPU["Ac"]["y"].as<float>();
      AcZ = MPU["Ac"]["z"].as<float>();
    
      //también puedo hacerlo así, más segura
      if (MPU.containsKey("Gi")){
        JsonObject Gi = MPU["Gi"].as<JsonObject>();
        if(Gi.containsKey("x")){
          GiX = Gi["x"].as<float>();
        }
        if(Gi.containsKey("y")){
          GiY = Gi["y"].as<float>();
        }
        if(Gi.containsKey("z")){
          GiZ = Gi["z"].as<float>();
        }
      }
    }

    //imprimo los valores
    Serial.print("Temperatura: "); Serial.println(temperatura);
    Serial.print("Led: "); Serial.println(led);
    Serial.print("Mensaje: "); Serial.println(msgg);
    Serial.print("AcX: "); Serial.println(AcX);
    Serial.print("AcY: "); Serial.println(AcY);
    Serial.print("AcZ: "); Serial.println(AcZ);
    Serial.print("GiX: "); Serial.println(GiX);
    Serial.print("GiY: "); Serial.println(GiY);
    Serial.print("GiZ: "); Serial.println(GiZ);

  }

  // Borramos el contenido de la variable ‘mensaje’
  mensaje = "";
}



void ConnectMQTT(){
  if(!MQTTClient.connected()){
    ClientId = String(random(1000));
    if(MQTTClient.connect(ClientId.c_str())){
          Serial.println("Conexion exitosa a broker");
          MQTTClient.subscribe(topicoS);
      }else{
          Serial.println("Algo paso :(");
    }
  }
MQTTClient.loop(); // a la escucha
}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() != WL_CONNECTED){
    Serial.print(".");
    delay(50);
  }

  if(WiFi.status() == WL_CONNECTED){
    Serial.println("");
    Serial.println("");
    Serial.println("Conxion exitosa!!!");
  }

  Serial.println("");
  Serial.print("Tu IP es: ");
  Serial.println(WiFi.localIP());
}
~~~
-------

