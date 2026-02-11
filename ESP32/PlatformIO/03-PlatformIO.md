# 03- PlatformIO - Servidor Web

## Servidor Web 1

- ESPAsyncWebServer habrá que agregarla desde Pio.home (Libarries/buecar la librería/agregar al proyecto)
- Tenemos que poner el ESP32 en modo punto de acceso
- SoftAP devuelve un booelan cuando se haya creado correctamente la red
- Con SoftAPIP obtenemos la dirección IP
  - Le realizaremos unapetición a esa IP y nos devolverá la página web, para eso es la biblioteca SPIFFS
  - Nos permite almacenar ciertos archivos en la FLASH del ESP32
  - Tiene que ser en la carpeta data, a la altura de src
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <ESPAsyncWebServer.h>
/**
 * ESPAsyncWebServer-esphome by Hristo Gochkov
 */

void initWiFiAP(); //configuramos el ESP32 como punto de acceso
AsyncWebServer server(80); //creo el server

void setup() {

  Serial.begin(9600);

  SPIFFS.begin(); 

  initWiFiAP(); //genero la red
  
  //cuando se haga una petición a la raíz le devolveremos index.html
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html"); 

	server.onNotFound([](AsyncWebServerRequest *request) { //cuando la página no se encuentra
		request->send(400, "text/plain", "Not found");
	});

	server.begin(); //inicializo el servidor asíncrono

  Serial.println("Servidor iniciado");

}

void loop(){
   
}


void initWiFiAP(){
  WiFi.mode(WIFI_AP); //modo punto de acceso
  while(!WiFi.softAP("Electronica117", "password")){//sin password crea una red abierta
    Serial.println(".");
    delay(100);
  }
  Serial.print("Direccion IP: ");
  Serial.println(WiFi.softAPIP());
}
~~~

- /data/index.html

~~~html
<!doctype html>
<html lang="es">
 
   <head>
      <title>ESP32</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
   </head>
 
   <body>

   <p>Hola Mundo desde el ESP32</p>
 
   </body>

</html>
~~~

- Para cargar esto voy al icono de PlatformIO en el lateral izquierdo del VSCode
  - En Platform->Build Filesystem Image para crear una imagen de los archivos en /data/
  - Upload Filesystem Image
  - El index.html ya está en la FLASH, ahora hay que cargar el programa
- Me conecto a la IP desde mi ordenador, me dice sin Internet (es correcto, ya que solo me he conectado al ESP32)
- Pego la IP en el navegador y me devuelve el "Hola Mundo desde el ESP32"

## Servidor Web II

- Veamos como enviarle información desde la web al ESP32 y manipularlo
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

void initWiFiAP();
void NotFound(AsyncWebServerRequest *request);
void LED(AsyncWebServerRequest *request);
#define Led 2  //terminal LED

AsyncWebServer server(80);

void setup() {

  Serial.begin(9600);
  SPIFFS.begin();
  initWiFiAP();
  pinMode(Led, OUTPUT); //LED como salida
  
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  
  server.onNotFound(NotFound);
  server.on("/LED", HTTP_GET, LED); //cuando se haga una petición GET a /LED ejecutará la función LED

	server.begin(); //inicio server
  Serial.println("Servidor iniciado");
}

void loop(){
}

void LED(AsyncWebServerRequest *request){

  if(request->hasParam("led")){
    Serial.print("Led: ");
    Serial.println(request->arg("led"));

    request->arg("led").equals("ON")?digitalWrite(Led, HIGH):digitalWrite(Led, LOW);

  }

  if(request->hasParam("texto")){
    Serial.print("Texto: ");
    Serial.println(request->arg("texto"));
  }
    
  request->redirect("/");  // Redirecciona a la pagina principal
}

void NotFound(AsyncWebServerRequest *request){
  request->send(SPIFFS, "/indexNotFound.html"); //envio el archivo indexNotFound
}

void initWiFiAP(){
  WiFi.mode(WIFI_AP);
  while(!WiFi.softAP("Electroncia117")){
    Serial.println(".");
    delay(100);  
  }
  Serial.print("Direccion IP: ");
  Serial.println(WiFi.softAPIP());
}
~~~

- En el index creo un form que dispare  una petición a /LED con el metodo GET
- El input en el name tiene "led", y en el value "on", el OFF tiene value "off"
- El id es simplemente para enlazar la etiqueta con el input
- Lo que nos interesa es el **name** y el **value**
- En el input del texto no hay la etiqueta value, porque el valor es lo que escribamos en el input
- index.html

~~~html
<!doctype html>
<html lang="es">
 
   <head>
      <title>ESP32 Servidor Web</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <link rel="stylesheet" href="./assets/style.css">
   </head>
 
   <body>

      <form id="form" action="/LED" method="get">
         <img id="logo" src="./Electronica117_Logo.png">

         <h2>Led</h2>
         <div>
            <input type="radio" id="ledOn" name="led" value="ON" checked>
            <label for="ledOn">ON</label>
            <input type="radio" id="ledOff" name="led" value="OFF">
            <label for="ledOff">OFF</label>
         </div>

         <h2>Texto</h2>
         <input type="text" name="texto">

         <button class="myButton" type="submit">Enviar</button>  
         <button class="myButton" type="button" onclick="myFunction()">Alerta</button>   
      </form> 
 
   </body>

   <script type="text/javascript" src="./assets/scripts.js"></script>

</html>
~~~

- Esta parte del código del index.html está relacionada con esta parte del main.cpp

~~~js
    //dispara una petición GET a /LED
<form id="form" action="/LED" method="get">
    <img id="logo" src="./Electronica117_Logo.png">

        <h2>Led</h2>
    <div>
        <input type="radio" id="ledOn" name="led" value="ON" checked>
        <label for="ledOn">ON</label>
        <input type="radio" id="ledOff" name="led" value="OFF">
        <label for="ledOff">OFF</label>
    </div>

    <h2>Texto</h2>
    <input type="text" name="texto">

    <button class="myButton" type="submit">Enviar</button>  
~~~

- main.cpp

~~~cpp
//cuando haya una petición a /LED (action="/LED" method="get" del form al darle a Enviar type submit)
server.on("/LED", HTTP_GET, LED); //disparo la función
//
void LED(AsyncWebServerRequest *request){

  if(request->hasParam("led")){ //si recibo el param led de la etiqueta name en la URL
    Serial.print("Led: ");
    Serial.println(request->arg("led")); //obtengo el valor del parámetro (ON/OFF)

    //ternario con el valor de la etiqueta value del input del html
    request->arg("led").equals("ON")?digitalWrite(Led, HIGH):digitalWrite(Led, LOW);

  }
    //si hay texto en el input y doy a enviar lo imprimo en consola del ESP32
  if(request->hasParam("texto")){
    Serial.print("Texto: ");
    Serial.println(request->arg("texto"));//obtengo el valor
  }
  
  //al ser una petición GET tenemos que responder con algo
  request->redirect("/");  // Redirecciona a la pagina principal
}
~~~

- Si cheko el ON, le escribo en el input HOLA y le doy a enviar, en la URL aparece

> file://C:/LED?led=ON&texto=HOLA

- Así es como estamos mandando información al ESP32

- styles.css

~~~css
body{
    background: linear-gradient(#ff414d, #FFFFFF);
}
.myButton {
    width: 100px;
	box-shadow: 0px 10px 14px -7px #545454;
	background-color:#ff5252;
	border-radius:8px;
	display:inline-block;
	cursor:pointer;
	color:#ffffff;
	font-family:Arial;
	font-size:18px;
	font-weight:bold;
	padding:5px 10px;
	text-decoration:none;
    margin: 20px;
}
.myButton:hover {
	background-color:#45d65d;
}
.myButton:active {
	position:relative;
	top:3px;
}

#form{
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
	justify-content: center;
}

#logo{
    width: 5cm;
    height: 5cm;
}

#PageNotFound{
	font-family: Arial;
	font-size: xx-large;
}
~~~

- Con el script de javascript disparo la alerta al presionar el botón de alerta
- scripts.js

~~~js
function myFunction() {
    alert("Hola Mundo desde el ESP32!!!");
}
~~~

- Si la página no existe devuelve esto
- indexNotFound.html

~~~html
<!doctype html>
<html lang="es"> 
 
   <head>
      <title>ESP32 Servidor Web</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <link rel="stylesheet" href="./assets/style.css">
   </head>
 
   <body>

   <div id="form">
      <img id="logo" src="./Electronica117_Logo.png">

      <p id="PageNotFound">No se encontro la pagina que buscas</p>

      <form action="index.html"> 
         <button class="myButton" type="submit">Regresar</button>
      </form>
      
   </div>
 
   </body>

   <script type="text/javascript" src="./assets/scripts.js"></script>

</html>
~~~

## Servidor Web III

- Vamos a solicitar información al ESP32
- Vamos a hacer una lectura, y cuando le demos al botón Mensaje nos va a mostrar un mensaje del ESP32
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <ESPAsyncWebServer.h>

void initWiFiAP();
void NotFound(AsyncWebServerRequest *request);
void ADC(AsyncWebServerRequest *request); 
void Mensaje(AsyncWebServerRequest *request);

AsyncWebServer server(80);

#define PinADC 34  //terminal para la lectura analógica
String mensaje = "Hola Mundo!!!"; //el mensaje que enviaremos

void setup() {

  Serial.begin(9600);
  SPIFFS.begin();

  initWiFiAP(); 

  //establecemos la página principal
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html"); 
  server.onNotFound(NotFound); //establecemos la página de notFound

  
  server.on("/ADC", HTTP_GET, ADC); //disparo la ADC
  server.on("/mensaje", HTTP_GET, Mensaje); //disparo mensaje
  

	server.begin();
  Serial.println("Servidor iniciado");

}

void loop(){
  
}

void ADC(AsyncWebServerRequest *request){
  request->send(200, "text/plain", String(analogRead(34)).c_str()); //parseamos a string la lectura
                                                                    //le pido su apuntador con c_str()
}

void Mensaje(AsyncWebServerRequest *request){
  //procurar no añadir muchas lineas de código aquí
  //y mandar rápido la respuesta
  request->send(200, "text/plain", mensaje.c_str()); //el mensaje ya es un string
}

void NotFound(AsyncWebServerRequest *request){
  request->send(SPIFFS, "/indexNotFound.html");
}

void initWiFiAP(){
  WiFi.mode(WIFI_AP);
  while(!WiFi.softAP("Electroncia117")){
    Serial.println(".");
    delay(100);  
  }
  Serial.print("Direccion IP AP: ");
  Serial.println(WiFi.softAPIP());
}

~~~

- Ya no tenemos formulario, porque lo que vamos a hacer es solicitar info a nuestro ESP32
- Tenemos dos divs
- El span donde va la lectura tiene el id "ADC" y el span de mensaje tiene el id "mensaje"
- Los usaremos para renderizar el string de información del ESP32 dentro del span
- Se ejecutará cuando le demos al botón Mensaje que tiene por @click myFunction del scripts.js
- data/index.html

~~~html
<!doctype html>
<html lang="es">
 
   <head>
      <title>ESP32 Servidor Web</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <link rel="stylesheet" href="./assets/style.css">
   </head>
 
   <body>

   <div id="contenedor">
      <img id="logo" src="./Electronica117_Logo.png">

      <div id="contenedor2">
         <span>Lectura analogica:</span>
         <span id="ADC">~Lectura~</span>
      </div>

      <div id="contenedor2">
         <span>Mensaje:</span>
         <span id="mensaje">~Mensaje~</span>
      </div>

      <button class="myButton" onclick="myFunction()">Mensaje</button>
   </div> 
 
   </body>

   <script type="text/javascript" src="./assets/scripts.js"></script>

</html>
~~~

- La petición es asíncrona, cuando llega pregunta si todo está correcto en el if
- Si todo está correcto, selecciona por id el elemento del index.html y renderiza el responseText con innerHTML
- scripts.js

~~~js
function myFunction() {

    var xhttp = new XMLHttpRequest(); //creamos una petición 
    xhttp.open("GET", "/mensaje", true); //hacemos la petición a mensaje con el método GET
    xhttp.send();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
                                                       //actualizo el span con el valor que recibo
        document.getElementById("mensaje").innerHTML = this.responseText;

      }
    };
}

//Esta función se va a estar ejecutando cada 300 milisegundos
//no podemos demorarnos mucho
setInterval(function ( ) {

  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/ADC", true);
  xhttp.send();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      document.getElementById("ADC").innerHTML = this.responseText;

    }
  };

}, 300);
~~~

## Escaneo de redes

- Vamos a realizar una búsqueda de redes con el ESP32
- Crearemos un portal donde podamos buscar redes que detecte el ESP32, seleccionar una de esas redes y conectarnos a esa red
- Configuramos el escaneo de esta forma con scanNetworks porque tendremos una página, la cual se va a encargar de buscar redes y conectarnos. Tendremos un botoncito con el cual realizaremos una petición, y con esa petición vamos a llamar a esta función BuscarRedes
- Recuerda que en estas peticiones no podemos tardar mucho, si hacemos un scaneo demasiado largo hace que  se dispare el watchDog que evita que el ESP32 entre en ciclos infinitos
- Debemos demorarnos lo menos posible, por eso va a ser un escaneo asíncrono
- Se va a topar con el while, que evalúa el scanComplete
  - scanComplete devuelve tres valores: el resultado del escaneo o el -1 (no ha terminado) o -2 (no se ha lanzado correctamente el escaneo)
  - Me interesa un valor mayor a 0 ya que ese será el número de redes que encontró
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>

String BuscarRedes();

StaticJsonDocument<1024> myJson; //aquí vamos a tener todo el arreglo de redes
String myJsonStr;
StaticJsonDocument<150> obj; //lo usaremos para crear nuestro JsonObject Red vacío
JsonObject Red = obj.to<JsonObject>(); //así creamos un objeto vacío

void setup() {

  Serial.begin(115200); //puede estar a 9600 sin problema

  Serial.println("Buscando redes...");
  Serial.println(BuscarRedes()); //lammamos a la función e imprimimos el resultado
}

void loop(){
  
}


String BuscarRedes(){
  WiFi.mode(WIFI_STA); //lo configuramos como estación

  //parámetros: busqueda asíncrona, no incluir redes ocultas, busqueda pasiva (canal por canal)
                                          //al ser pasiva puedo indicarle el timepo dedicado a cada canal (100) 
  WiFi.scanNetworks(true, false, true, 100);  

  while(WiFi.scanComplete()<0); //scanComplete devuelve el número de redes o -1 o -2

  Serial.println();

  int numeroDeRedes = WiFi.scanComplete(); //asigno el número de redes a la variable
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  Serial.println();
  
  if (numeroDeRedes > 0) {
    //si el número de redes es mayor que cero uso un for para enumerarlas
    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1); //solo para mostrar un 1 en pantalla y no un 0 en la lista
      Serial.print(": ");
      Serial.print(WiFi.SSID(i)); //el nombre de la red
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i)); //la potencia
      Serial.print("dBm ");
      //determinamos si necesitamos password o no
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    Serial.println();

    //empiezo a formar mi JSON
    JsonArray Redes = myJson.createNestedArray("Redes");
    for (int i = 0; i < numeroDeRedes; i++) {
      //le asigno los valores al JSON
      Red["SSID"] = WiFi.SSID(i); //Red es el objeto JSON vacío que creamos con obj.to<JsonObject>()
      Red["RSSI"] = WiFi.RSSI(i);
      Red["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";

      Redes.add(Red); //lo agregamos al arreglo
    }
    
    //otra manera de hacerlo, pero no se ve tan bien
    /*for (int i = 0; i < numeroDeRedes; i++) {
      Redes[i]["SSID"] = WiFi.SSID(i);
      Redes[i]["RSSI"] = WiFi.RSSI(i);
      Redes[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }*/


    myJsonStr = ""; //inicializo como string 
    serializeJson(myJson, myJsonStr); //convertimos nuestro JSON a un string
    
  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJsonStr; //retrono el JSON pasado a string
}
~~~

- Paso el main.cpp sin comentarios

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>

String BuscarRedes();

StaticJsonDocument<1024> myJson;
String myJsonStr;
/*StaticJsonDocument<150> obj;
JsonObject Red = obj.to<JsonObject>();*/

void setup() {

  Serial.begin(115200); 

  Serial.println("Buscando redes...");
  Serial.println(BuscarRedes());
}

void loop(){
  
}


String BuscarRedes(){
  WiFi.mode(WIFI_STA);

  WiFi.scanNetworks(true, false, true, 100);

  while(WiFi.scanComplete()<0);

  Serial.println();

  int numeroDeRedes = WiFi.scanComplete();
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  Serial.println();
  
  if (numeroDeRedes > 0) {

    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    Serial.println();

    
    JsonArray Redes = myJson.createNestedArray("Redes");
    /*for (int i = 0; i < numeroDeRedes; i++) {
      Red["SSID"] = WiFi.SSID(i);
      Red["RSSI"] = WiFi.RSSI(i);
      Red["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";

      Redes.add(Red);
    }*/
    
    for (int i = 0; i < numeroDeRedes; i++) {
      Redes[i]["SSID"] = WiFi.SSID(i);
      Redes[i]["RSSI"] = WiFi.RSSI(i);
      Redes[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }


    myJsonStr = "";
    serializeJson(myJson, myJsonStr); 
    
  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJsonStr;
}
~~~


## Preferences (almacenamiento en la memoria)

- Usaremos la biblioteca Preferences.h
- Nos ayudará a guardar información en la FLASH del ESP32 (es información no se va a perder aunque se apague)
- Debo crear un objeto de tipo Preferences
- El contador va a ir incrementando, cada incremento resetea el ESP32
- Como este valor lo vamos a ir almacenando en la memoria FLASH, después de cada reset el contador debe de tenr el valor anterior
- Con .begin creamos el archivo Pref (o el nombre que se le quiera dar)
- Con getFloat solicitamos el valor flotante, puede ser getInt, getString, getDouble, etc
  - Solicitamos la clave "contador". Como no existe todavía, la estamos creando, le agrega el valor de 0 por defecto
- Cerramos el archivo
- Vuelvo a abrir el archivo Pref en modo lectura y escritura
  - Le coloco el contador a la clave contador
  - Cierro el archivo
- Espero 2 segundos, reseteo el ESP32
- main.cpp

~~~cpp
#include <Arduino.h>
#include <Preferences.h>

Preferences preferences; //creo el objeto de tipo Preferences
float contador = 0; 

void setup() {
  Serial.begin(9600);

  preferences.begin("Pref", false);  // Nombre del archivo, false -> Lectura, escritura     true-> solo lectura
  contador = preferences.getFloat("contador", 0);   // Clave, valor por defecto 
  preferences.end();                                // Cerrar archivo 

  Serial.println();
  Serial.print("Valor del contador: ");
  Serial.println(contador);
  contador++; //incremento contador

  preferences.begin("Pref", false); //vuelvo a abrir el archivo en modo lectura y escritura
  preferences.putFloat("contador", contador);       // (Clave, valor) agrego el contador
  preferences.end(); //cierro el archivo


  delay(2000); //esperamos 2 segundos
  ESP.restart(); //reseteamos el ESP32

  // Borra todo lo contenido en preferences
  /*preferences.begin("Pref", false);
  preferences.clear();
  preferences.end();
  */

  // Borra solo la clave-valor 
  //preferences.remove("contador");

}

void loop() {
  
}
~~~

- Cuando reseteo vuelve al setup, pero para entonces ya existe el archivo Pref
  - Solicita el contador, ya no le va a pasar el 0 porque contador ya existe, le pasará el 1, se incerementa en 1, guardamos el 2 en la memoria FLASH y volvemos a resetear
- Incerementa y reseta

## Portal cautivo I (sin DNS)

- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <Preferences.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>


void initWiFiAP();
void InitWiFi();
void initServer();
void NotFound(AsyncWebServerRequest *request);
void RedesRequest(AsyncWebServerRequest *request); //botón Buscar
void ConectarWiFi(AsyncWebServerRequest *request); //botón Conectar
String BuscarRedes();

String SSID="", PASS=""; //variables para almacenar temoralmente el nombre de la red y el pass
Preferences preferences; //donde vamos a almacenar permanentemente el nombre de la red y el pass

StaticJsonDocument<1024> myJson; //inicializo JSON vacío donde guardaremos las redes
String myJsonStr;
long tiempoDeConexion;

AsyncWebServer server(80); //declaro el servidor en el puerto 80

void setup() {

  Serial.begin(115200);
  SPIFFS.begin(); 

  InitWiFi();

}

void loop(){
  
}

void NotFound(AsyncWebServerRequest *request){
  request->send(SPIFFS, "/indexNotFound.html");
}

void initWiFiAP(){
  WiFi.mode(WIFI_AP); //modo access point
  while(!WiFi.softAP("MiDispositivoIoT")){ //mi red se llama MiDispositivoIoT
    Serial.println(".");
    delay(100);  
  }
  Serial.print("Direccion IP AP: ");
  Serial.println(WiFi.softAPIP()); //pedimos la IP
  initServer(); //inicio el servidor para acceder a la página web
}

void RedesRequest(AsyncWebServerRequest *request){
 Serial.println("Peticion Redes");
              //status 200, texto plano, llamamos a BuscarRedes que regresa un JSON con todas las redes
 request->send(200, "text/plain", BuscarRedes().c_str()); //c_str() porque necesitamos el apuntador a ese string
}

//es la misma función que en la lección anterior
String BuscarRedes(){

  WiFi.scanNetworks(true, false, true, 100);

  while(WiFi.scanComplete()<0);
  Serial.println();

  int numeroDeRedes = WiFi.scanComplete();
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  
  if (numeroDeRedes > 0) {

    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    
    JsonArray Redes = myJson.createNestedArray("Redes");
    for (int i = 0; i < numeroDeRedes; i++) {
      Redes[i]["SSID"] = WiFi.SSID(i);
      Redes[i]["RSSI"] = WiFi.RSSI(i);
      Redes[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }

    myJsonStr = ""; //inicializo como string vacío
    serializeJson(myJson, myJsonStr); //le paso el objeto JSON a myJsonStr

  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJsonStr; //retrono el JSON con todas las redes
}

void ConectarWiFi(AsyncWebServerRequest *request){
 
  if(request->hasParam("SSID")){
    SSID = request->arg("SSID");
  }

  if(request->hasParam("PASS")){
    PASS = request->arg("PASS");
  }

  SSID.trim();
  PASS.trim();
  
  Serial.print("SSID: "); 
  Serial.println(SSID);
  Serial.print("PASS: ");
  Serial.println(PASS);

  preferences.begin("Red", false);
  preferences.putString("SSID", SSID);
  preferences.putString("PASS", PASS);
  preferences.end();
  
  request->send(SPIFFS, "/index.html"); 

  ESP.restart();
}

void InitWiFi(){

  preferences.begin("Red", false); //creamos el archivo red en modo lectura/escritura
  SSID = preferences.getString("SSID", ""); //le paso un string vacío por defecto si no tiene nada el archivo
  PASS = preferences.getString("PASS", "");
  //preferences.clear();
  preferences.end(); //cierro el archivo
  
  if(SSID.equals("") | PASS.equals("")){
    initWiFiAP();
  }else{ //si el SSID o el pass no están vacíos vamos a intentar conectarnos
    WiFi.mode(WIFI_STA);  //pongo al ESP32 en modo estación    
    // Inicializamos el WiFi con nuestras credenciales.
    Serial.print("Conectando a ");
    Serial.print(SSID);

    WiFi.begin(SSID.c_str(), PASS.c_str()); //iniciamos una conexión a esa red con ese pass
    
    tiempoDeConexion = millis(); //millis es el tiempo desde que el ESP32 se enciende
   // Se quedara en este bucle hasta que el estado del WiFi sea diferente a desconectado.
   while(WiFi.status() != WL_CONNECTED){ 
      Serial.print(".");
      delay(100);
      if(tiempoDeConexion+7000 < millis()){ //le daremos 7 segundos al ESP32 para que realice una conexión
        break; //rompe el while
      }
    }

    if(WiFi.status() == WL_CONNECTED){        // Si el estado del WiFi es conectado entra al If
      Serial.println();
      Serial.println();
      Serial.println("Conexion exitosa!!!");
      Serial.println("");
      Serial.print("Tu IP STA: ");
      Serial.println(WiFi.localIP());
    }

    if(WiFi.status() != WL_CONNECTED){
      Serial.println("");
      Serial.println("No se logro conexion");
      initWiFiAP();
    }
  }
}

void initServer(){
  //establezco la página principal
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  server.onNotFound(NotFound); //establezco la página notFound

  server.on("/Buscar", HTTP_GET, RedesRequest); //en la petición GET a /Buscar llamo a RedesRequest con el botón Buscar
  server.on("/ConectarWiFi", HTTP_GET, ConectarWiFi); //botón Conectar

	server.begin();
  Serial.println("Servidor iniciado");
}
~~~

- Con el botón buscar podremos listar las redes que detecte y seleccionarla para darle a conectar y conectar
- data/index.html

~~~html
<!doctype html>
<html lang="es">
 
   <head>
      <title>ESP32 Servidor Web</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="./assets/style.css">
   </head>
 
   <body>

   <form id="form" action="/ConectarWiFi" method="get">

      <img id="logo" src="./Electronica117_Logo.png">

      <p id="titulo">Redes disponibles</p>

      <select id="selector" name="SSID">
         <option value="Red1">Alguna Red</option>
      </select>

      <input type="text" name="PASS" value="Contraseña" class="css-input">

      <div>
         <button class="myButton" type="button" onclick="ObtenerRedes()">Buscar</button>
         <button class="myButton" type="submit">Conectar</button>
      </div>
   </form> 
   
 
   </body>

   <script type="text/javascript" src="./assets/scripts.js"></script>

</html>
~~~

- En el onClick del botón Buscar se llama ObtenerRedes()
- Esto llama a  server.on("/Buscar", HTTP_GET, RedesRequest) que está escuchando con server.on
- data/scripts.js

~~~js
function ObtenerRedes() {

    var xhttp = new XMLHttpRequest(); //creo la petición
    xhttp.open("GET", "/Buscar", true); //hago la peticiópn GET a /Buscar

    
    xhttp.send(); //envío la petición

    alert("Buscando Redes");

    //realiza la búsqueda
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) { //si todo está bien

        //deserializamos, le pasamos el texto que llegó con this.responseText
        //.Redes porque llamamos al nestedArray Redes, así lo declaramos con 
        //myJson.createNestedArray("Redes"), accedemos a la propiedad Redes del JSON
        var Redes = JSON.parse(this.responseText).Redes; 
       
        Selector = document.getElementById("selector"); //seleccionamos el selector del HTML
        for(var Red of Redes) {
          var nuevaOpcion = document.createElement("option"); //seleccionamos option con un for
          nuevaOpcion.value = Red.SSID; //le paso el value, es lo que tomará el botón de submit de Conectar
          nuevaOpcion.innerHTML = Red.SSID; //inserto el SSID para que sea visible en la web dentro del selector
          Selector.appendChild(nuevaOpcion); //le agregamos cada red al selector
        }  
        Selector.selectedIndex = "0"; //que seleccione el primer elemento (la primera opción que se visualice)      
      }
    };
}
~~~

- ObtenerRedes llama a RedesRequest para que devuelva el apuntador al string que es el JSON serializado de BuscarRedes
- main.cpp (extracto para el ejemplo)

~~~cpp
//Cuando iniciamos el servidor escuchamos a las peticiones GET /Buscar y /ConectarWifi
void initServer(){
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  server.onNotFound(NotFound); 

  //está escuchando la petición GET /Buscar desde ObtenerRedes en scripts.js 
  //(se dispara con botón Buscar en el HTML)
  server.on("/Buscar", HTTP_GET, RedesRequest); 
  //llama a RedesRequest que envía en la request el apuntador al JSON en string
  
  
  server.on("/ConectarWiFi", HTTP_GET, ConectarWiFi);

	server.begin();
  Serial.println("Servidor iniciado");
}


//envía en la request el JSON serializado a String que recoge ObtenerRedes() en el script.js
void RedesRequest(AsyncWebServerRequest *request){
 Serial.println("Peticion Redes");
              //status 200, texto plano, llamamos a BuscarRedes que regresa un JSON con todas las redes
 request->send(200, "text/plain", BuscarRedes().c_str()); //c_str() porque necesitamos el apuntador a ese string
}


//Buscar redes es la función de la lección anterior que devuelve un JSON serializado
String BuscarRedes(){

  WiFi.scanNetworks(true, false, true, 100);

  while(WiFi.scanComplete()<0);
  Serial.println();

  int numeroDeRedes = WiFi.scanComplete();
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  
  if (numeroDeRedes > 0) {

    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    
    JsonArray Redes = myJson.createNestedArray("Redes"); //LLAMAMOS AL ARRAY REDES
    for (int i = 0; i < numeroDeRedes; i++) {
      Redes[i]["SSID"] = WiFi.SSID(i);
      Redes[i]["RSSI"] = WiFi.RSSI(i);
      Redes[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }

    myJsonStr = ""; //inicializo como string vacío
    serializeJson(myJson, myJsonStr); //le paso el objeto JSON a myJsonStr

  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJsonStr; //retorno el JSON con todas las redes
}
~~~

- El botón de conectar es de tipo submit, va a tomar los valores del selector con el SSID y la contraseña
- Se las va a mandar al ESP32 a través de la URL 

> file:///C:/Conectarwifi?SSID=Red&PASS=password

- Estos valores van a llegar a /ConectarWifi que llamo a través del action del form, pasándole la SSID y el password a través del botón de submit de Conectar
- En conectarWifi disparo ConectarWifi a través de la escucha del servidor de la petición GET con server.on

~~~cpp
void initServer(){
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  server.onNotFound(NotFound); 
  server.on("/Buscar", HTTP_GET, RedesRequest); 
  server.on("/ConectarWiFi", HTTP_GET, ConectarWiFi); //<---AQUI!

	server.begin();
  Serial.println("Servidor iniciado");
}


void ConectarWiFi(AsyncWebServerRequest *request){
 
  if(request->hasParam("SSID")){ //si recibo el parámetro
    SSID = request->arg("SSID"); //solicito el valor de ese parametro y lo almaceno en SSID
  }

  if(request->hasParam("PASS")){
    PASS = request->arg("PASS");
  }

  SSID.trim(); //elimino espacios
  PASS.trim();
  
  Serial.print("SSID: "); 
  Serial.println(SSID);
  Serial.print("PASS: ");
  Serial.println(PASS);

  preferences.begin("Red", false); //abro el archivo donde no se borra la info en lectura/escritura
  preferences.putString("SSID", SSID); //le paso los valores
  preferences.putString("PASS", PASS);
  preferences.end();//cierro el archivo
  
  //una petición GET siempre tiene que responder
  //SPIFFS es el sistema de archivos del ESP32
  request->send(SPIFFS, "/index.html"); //redirecciono al index.html

  ESP.restart(); //reseteo el ESP32
}
~~~

- Reseteo el ESP32, con InitWifi abro el archivo Red con preferences, ya tengo valores en SSID y PASS, por lo que ya no le pasa un string vacío
- Me conecto a la red con Wifi.begin

~~~cpp
void setup() {

  Serial.begin(115200);
  SPIFFS.begin(); 

  InitWiFi();

}

void InitWiFi(){

  preferences.begin("Red", false); //creamos el archivo red en modo lectura/escritura
  SSID = preferences.getString("SSID", ""); //le paso un string vacío por defecto si no tiene nada el archivo
  PASS = preferences.getString("PASS", "");
  //preferences.clear();
  preferences.end(); //cierro el archivo
  
  if(SSID.equals("") | PASS.equals("")){
    initWiFiAP();
  }else{ //si el SSID o el pass no están vacíos vamos a intentar conectarnos
    WiFi.mode(WIFI_STA);  //pongo al ESP32 en modo estación    
    // Inicializamos el WiFi con nuestras credenciales.
    Serial.print("Conectando a ");
    Serial.print(SSID);

    WiFi.begin(SSID.c_str(), PASS.c_str()); //iniciamos una conexión a esa red con ese pass
    
    tiempoDeConexion = millis(); //millis es el tiempo desde que el ESP32 se enciende
   // Se quedara en este bucle hasta que el estado del WiFi sea diferente a desconectado.
   while(WiFi.status() != WL_CONNECTED){ 
      Serial.print(".");
      delay(100);
      if(tiempoDeConexion+7000 < millis()){ //le daremos 7 segundos al ESP32 para que realice una conexión
        break; //rompe el while
      }
    }

    if(WiFi.status() == WL_CONNECTED){        // Si el estado del WiFi es conectado entra al If
      Serial.println();
      Serial.println();
      Serial.println("Conexion exitosa!!!");
      Serial.println("");
      Serial.print("Tu IP STA: ");
      Serial.println(WiFi.localIP());
    }

    if(WiFi.status() != WL_CONNECTED){
      Serial.println("");
      Serial.println("No se logro conexion");
      initWiFiAP();
    }
  }
}
~~~

## Portal cautivo II - DNS server

- La forma de acceder a esta págnia es copiando la ip que nos aparece en el monitor serial y escribiendo la IP en el explorador
- Lo que vamos a hacer es que cuando hagamos conexión con la red que genere el ESP32, nos muestre la página principal
- Para eso agregamos la biblioteca DNSServer
- Si el destructor ~myHandler no fuera virtual, al borrarse la clase solo se llamaría al destructor de AsyncWebHandler y el de myHandler no se ejecutaría. Primero destruye myHandler y luego AsyncWebHandler
- canHandle y handleRequest no son virtual porque ya lo son en AsyncWebHandler
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <Preferences.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <DNSServer.h>


void initWiFiAP();
void InitWiFi();
void initServer();
void NotFound(AsyncWebServerRequest *request);
void RedesRequest(AsyncWebServerRequest *request);
void ConectarWiFi(AsyncWebServerRequest *request);
String BuscarRedes();

String SSID="", PASS="";
bool wifiIsConnected=false;
Preferences preferences;

StaticJsonDocument<1024> myJson;
String myJsonStr;
long tiempoDeConexion;

AsyncWebServer server(80);
DNSServer dnsServer;
                        //hereda de AsyncWebHandler
class myHandler : public AsyncWebHandler {
  public:
    myHandler() {} //constructor
    virtual ~myHandler() {} //destructor virtual con herencia segura

    bool canHandle(AsyncWebServerRequest *request){
      return true; //acepta todas las peticiones
    }
    
    //se ejecuta cuando canHandle devuelve true
    void handleRequest(AsyncWebServerRequest *request) {
      request->send(SPIFFS, "/index.html"); //redireccionamos a nuestra página principal
    }
};

void setup() {

  Serial.begin(115200);
  SPIFFS.begin();
 
  InitWiFi();

}

void loop(){
  if(WiFi.status() != WL_CONNECTED){//si el estado es no conectado
    dnsServer.processNextRequest(); //para mantener la escucha de todas las peticiones
  }
  
}

void NotFound(AsyncWebServerRequest *request){
  request->send(SPIFFS, "/indexNotFound.html");
}

void initWiFiAP(){
  WiFi.mode(WIFI_AP);
  while(!WiFi.softAP("MiDispositivoIoT")){
    Serial.println(".");
    delay(100);  
  }
  Serial.print("Direccion IP AP: ");
  Serial.println(WiFi.softAPIP());
  initServer();
}

void RedesRequest(AsyncWebServerRequest *request){
 Serial.println("Peticion Redes");
 request->send(200, "text/plain", BuscarRedes().c_str());
}

String BuscarRedes(){

  WiFi.scanNetworks(true, false, true, 100);

  while(WiFi.scanComplete()<0);
  Serial.println();

  int numeroDeRedes = WiFi.scanComplete();
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  
  if (numeroDeRedes > 0) {

    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    
    JsonArray Redes = myJson.createNestedArray("Redes");
    for (int i = 0; i < numeroDeRedes; i++) {
      Redes[i]["SSID"] = WiFi.SSID(i);
      Redes[i]["RSSI"] = WiFi.RSSI(i);
      Redes[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }

    myJsonStr = "";
    serializeJson(myJson, myJsonStr); 

  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJsonStr;
}


void ConectarWiFi(AsyncWebServerRequest *request){
 
  if(request->hasParam("SSID")){
    SSID = request->arg("SSID");
  }

  if(request->hasParam("PASS")){
    PASS = request->arg("PASS");
  }

  SSID.trim();
  PASS.trim();
  
  Serial.print("SSID: "); 
  Serial.println(SSID);
  Serial.print("PASS: ");
  Serial.println(PASS);

  preferences.begin("Red", false);
  preferences.putString("SSID", SSID);
  preferences.putString("PASS", PASS);
  preferences.end();
  
  request->send(SPIFFS, "/index.html"); 

  ESP.restart();
}

void InitWiFi(){

   preferences.begin("Red", false);
  SSID = preferences.getString("SSID", ""); 
  PASS = preferences.getString("PASS", "");
  //preferences.clear();
  preferences.end();
  
  if(SSID.equals("") | PASS.equals("")){
    initWiFiAP();
  }else{
    WiFi.mode(WIFI_STA);      
    // Inicializamos el WiFi con nuestras credenciales.
    Serial.print("Conectando a ");
    Serial.print(SSID);

    WiFi.begin(SSID.c_str(), PASS.c_str());
    
    tiempoDeConexion = millis();
    while(WiFi.status() != WL_CONNECTED){     // Se quedata en este bucle hasta que el estado del WiFi sea diferente a desconectado.
      Serial.print(".");
      delay(100);
      if(tiempoDeConexion+7000 < millis()){
        break;
      }
    }

    if(WiFi.status() == WL_CONNECTED){        // Si el estado del WiFi es conectado entra al If
      Serial.println();
      Serial.println();
      Serial.println("Conxion exitosa!!!");
      Serial.println("");
      Serial.print("Tu IP STA: ");
      Serial.println(WiFi.localIP());
    }

    if(WiFi.status() != WL_CONNECTED){
      Serial.println("");
      Serial.println("No se logro conexion");
      initWiFiAP();
    }
  }
}

void initServer(){
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  
  server.on("/Buscar", HTTP_GET, RedesRequest);
  server.on("/ConectarWiFi", HTTP_GET, ConectarWiFi);
  server.onNotFound(NotFound);

  dnsServer.start(53, "*", WiFi.softAPIP()); //iniciamos un server DNS escuchando por el puerto 53
                                             //le pasamos la IP de nuestro access point
                                            //todas las peticiones las va a redireccionar a la IP del access point
  //manejamos estas peticiones
                      //con setFilter preguntamos si las peticiones vienen de la IP de nuestro access point
  server.addHandler(new myHandler()).setFilter(ON_AP_FILTER);

	server.begin();
  Serial.println("Serveidor iniciado");
}
~~~

- ¡Con esto ya estaría!

## Portal cautivo III


- Hay mucho código solo para lo que es conectarse al ESP32
- Para ello hacemos esta biblioteca Electronica117.h
- Creo una instancia y tenemos tres métodos

~~~cpp
#include <Arduino.h>
#include <Electronica117.h>

Electronica117 myDevice;

void setup() {
  myDevice.nombreDeRedAP("MiRed");
  myDevice.initWiFi();
}

void loop() {
  myDevice.loop();
  
}
~~~

- La biblioteca

~~~cpp
/**
 * Electronica117
 * Edgar Antonio Domínguez Ramírez
 * 2021
 */

#include "Electronica117.h"

StaticJsonDocument<1024> Redes;
String myJson;
AsyncWebServer server(80);
String SSID="";
String PASS="";
Preferences preferences;
DNSServer dnsServer;
const char *_nombreDeRed = "MiDispositivoIoT";


class myHandler : public AsyncWebHandler {
public:
  myHandler() {}
  virtual ~myHandler() {}

  bool canHandle(AsyncWebServerRequest *request){
    return true;
  }
  
  void handleRequest(AsyncWebServerRequest *request) {
      request->send(SPIFFS, "/index.html"); 
    }
};

Electronica117::Electronica117(){
}

void Electronica117::nombreDeRedAP(String nombreDeRed){
  _nombreDeRed = nombreDeRed.c_str();
}

void Electronica117::loop(){
  if(WiFi.status() != WL_CONNECTED){
    dnsServer.processNextRequest();
  }
}


void Electronica117::initServer(){
  SPIFFS.begin();

  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
  server.onNotFound(NotFound);
  
  server.on("/Buscar", HTTP_GET, RedesRequest);
  server.on("/ConectarWiFi", HTTP_GET, ConectarWiFi);
  
  dnsServer.start(53, "*", WiFi.softAPIP());
  server.addHandler(new myHandler()).setFilter(ON_AP_FILTER);

	server.begin();
  Serial.println("Serveidor iniciado");
}

void Electronica117::ConectarWiFi(AsyncWebServerRequest *request){
 
  if(request->hasParam("SSID")){
    SSID = request->arg("SSID");
  }

  if(request->hasParam("PASS")){
    PASS = request->arg("PASS");
  }

  SSID.trim();
  PASS.trim();
  
  Serial.print("SSID: "); 
  Serial.println(SSID);
  Serial.print("PASS: ");
  Serial.println(PASS);

  preferences.begin("Red", false);
  preferences.putString("SSID", SSID);
  preferences.putString("PASS", PASS);
  preferences.end();
  
  request->send(SPIFFS, "/index.html"); 

  ESP.restart();
}

void Electronica117::NotFound(AsyncWebServerRequest *request){
  request->send(SPIFFS, "indexNotFound.html");
}

void Electronica117::RedesRequest(AsyncWebServerRequest *request){
 Serial.println("Peticion Redes");
 request->send(200, "text/plain", buscarRedes().c_str());
}

void Electronica117::borrarRed(){
  Serial.println();
  Serial.println("Red " + SSID + " borrada");
  preferences.begin("Red", false);
  preferences.clear();
  preferences.end();
}

void Electronica117::initWiFiAP(){
  WiFi.mode(WIFI_AP);
  while(!WiFi.softAP(_nombreDeRed)){
    Serial.println(".");
    delay(100);  
  }
  Serial.print("Direccion IP AP: ");
  Serial.println(WiFi.softAPIP());
  initServer();
}

bool Electronica117::initWiFi(){
  preferences.begin("Red", false);
  SSID = preferences.getString("SSID", ""); 
  PASS = preferences.getString("PASS", "");
  preferences.end();
  
  if(SSID.equals("") | PASS.equals("")){
    initWiFiAP();
    wifiIsConnected = false;
  }else{
    WiFi.mode(WIFI_STA);      
    // Inicializamos el WiFi con nuestras credenciales.
    Serial.print("Conectando a ");
    Serial.print(SSID);

    WiFi.begin(SSID.c_str(), PASS.c_str());
    int 
    tiempoDeConexion = millis();
    while(WiFi.status() != WL_CONNECTED){     // Se quedata en este bucle hasta que el estado del WiFi sea diferente a desconectado.
      Serial.print(".");
      delay(100);
      if(tiempoDeConexion+10000 < millis()){
        break;
      }
    }

    if(WiFi.status() == WL_CONNECTED){        // Si el estado del WiFi es conectado entra al If
      Serial.println();
      Serial.println();
      Serial.println("Conxion exitosa!!!");
      Serial.println("");
      Serial.print("Tu IP STA: ");
      Serial.println(WiFi.localIP());
      wifiIsConnected = true;
    }

    if(WiFi.status() != WL_CONNECTED){
      Serial.println("");
      Serial.println("No se logro conexion");
      initWiFiAP();
      wifiIsConnected = false;
    }
  }
 return wifiIsConnected;
}

String Electronica117::buscarRedes(){

  WiFi.scanNetworks(true, false, true, 100);
  // Escaneo todavía en progreso: -1
  // El escaneo no se ha activado: -2
  while(WiFi.scanComplete()<0);
  Serial.println();

  int numeroDeRedes = WiFi.scanComplete();
  Serial.print(numeroDeRedes);
  Serial.println(" redes encontradas");
  
  if (numeroDeRedes > 0) {

    for (int i = 0; i < numeroDeRedes; i++) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" "); 
      Serial.print(WiFi.RSSI(i));
      Serial.print("dBm ");
      Serial.println((WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada");
    }
    
    JsonArray Red = Redes.createNestedArray("Redes");
    for (int i = 0; i < numeroDeRedes; i++) {
      Red[i]["SSID"] = WiFi.SSID(i);
      Red[i]["RSSI"] = WiFi.RSSI(i);
      Red[i]["Estado"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)?"Abierta":"Cerrada";
    }


    myJson = "";
    serializeJson(Redes, myJson); 
    Serial.println(myJson);

  } else {
    Serial.println("No se encontraron redes :(");
  }

  return myJson;
 
}
~~~

- Debe existir la carpeta data con el index.html y el indexNotFound.html
- Para agregarla al proyecto en platform.ini agrego esta linea
 
~~~
lib_deps = https://github.com/Electronica117/ESP32-Curso.git
~~~

- La biblioteca incluye la carpeta includes con el archivo.h
- En src/ tenemos el Electronica117.cpp, que es el main.cpp que hemos visto antes
- Tenemos el keywords.txt que sirve para colorear nombres de variables, funciones...

~~~txt
#######################################
# Syntax Coloring Map For Electronica117
#######################################

#######################################
# Datatypes (KEYWORD1)
#######################################

Electronica117 	KEYWORD1

#######################################
# Methods and Functions (KEYWORD2)
#######################################

InitWiFi 	KEYWORD2
borrarRed   KEYWORD2
loop        KEYWORD2

#######################################
# Constants (LITERAL1)
#######################################
~~~

- Y tenemos el library.json con la metadata de la librería

~~~json
{
    "name": "Electronica117",
    "version": "1.0.0",
    "description": "Una biblioteca para facilitar el desarrollo en dispositivos IoT",
    "keywords": "esp32, electronica117, iot",
    "repository":
    {
      "type": "git",
      "url": "https://github.com/Electronica117/ESP32-Curso.git"
    },
    "authors":
    [
      {
        "name": "Edgar Domínguez",
        "email": "ragdedominguez8669@gmail.com",
        "url": "https://www.facebook.com/EdgarDominguez117/",
        "maintainer": true
      }
    ],
    "license": "Apache-2.0",
    "homepage": "https://www.electronica117.com/",
    "dependencies": {
      "ottowinter/ESPAsyncWebServer-esphome": "^1.2.7",
      "bblanchon/ArduinoJson": "^6.18.0"
    },
    "frameworks": "*",
    "platforms": "*"
  }
~~~

- Además tenemos un README, un LICENSE y un .gitattributes

~~~
# Auto detect text files and perform LF normalization
* text=auto
~~~






