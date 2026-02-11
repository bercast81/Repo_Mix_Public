# 04- PlatformIO - Firebase

- Firebase ofrece una DB en tiempo real
- Inicio sesión con mi cuenta de gmail y voy a la consola
- Creo un proyecto
- Vamos a Firebase Database en el menú lateral izquierdo
- Creo la DB en Realtime Database en modo de prueba 
- La URL que usaremos en el proyecto es la que hay en la parte superior de la consola

> https://esp32-77cc5-default-rtdb.firebaseio.com/

- En configuración (menú lateral)/ Cuentas de servicio /Secretos de la Base de datos

> 3Mh5VZnh95KzaBjT9W2k4w4XIB82eRpalZL497UC

## Escritura en la DB de firebase

- Debemos descargar la biblioteca de Firebase en el proyecto
- En VScode, PioHome/Libraries/ busco firebase esp32  (busco Firebase ESP32 Client)
- Para conectarnos a la DB de Firebase

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

#define SSID  "Enterprise"
#define PASS "0123456WiFi"
#define DB_URL "esp32-77cc5-default-rtdb.firebaseio.com"
#define SECRET_KEY "3Mh5VZnh95KzaBjT9W2k4w4XIB82eRpalZL497UC"


FirebaseData myFirebaseData; //para escribir data en la DB
FirebaseAuth auth;
FirebaseConfig config;
int i = 0; //variable que pasarle a la DB

void InitWiFi();

void setup(){
  Serial.begin(9600);
  InitWiFi();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); //ya estamos conectados a la DB de Firebase!!
}

void loop(){

}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() == WL_DISCONNECTED){
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

- Uso la variable i que vamos a estar mandando a la DB

~~~cpp
void loop(){
  //debo pasarle el objeto FirebaseData, el string (path), el valor
  Firebase.set(myFirebaseData, "test", i);

  i++;

  if(i>10){
    i=0;
  }
  delay(1000);
}
~~~

## Lectura en la DB de Firebase

- Escribo unos valores desde la consola de la DB en Firebase
- a: 13, b: 0.15, c: true, d: "Hola"
- Debo declarar las variables en mi script para poder guardar el valor con su tipo correcto

~~~cpp
int a;
float b;
bool c;
String d;
~~~

- Uso Firebase.get

~~~cpp
void loop(){
  Firebase.get(myFirebaseData, "/a");
  a= myFirebaseData.intData();
  Firebase.get(myFirebaseData, "/b");
  b = myFirebaseData.floatData();
  Firebase.get(myFirebaseData, "/c");
  c= myFirebaseData.boolData();
  Firebase.get(myFirebaseData, "/d");
  d= myFirebaseData.stringData();

  Serial.println(a);
  Serial.println(b);
  Serial.println(c);
  Serial.println(d);
}
~~~

- **NOTA:** Hay un problema y es que el ESP32 necesita sincronizar la hora para que el SSL de Firebase acepte la conexión
- Añade este código 

~~~cpp
#include <time.h>
~~~

- Y crea esta función

~~~cpp
void initTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Sincronizando hora");
  time_t now = time(nullptr);

  while (now < 8 * 3600 * 2) {   // espera a que la hora sea válida
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println("\nHora sincronizada");
}
~~~

- Llama a initTime antes de a Firebase

~~~cpp
void setup(){
  Serial.begin(9600);
  InitWiFi();

  initTime();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); //ya estamos conectados a la DB de Firebase!!
}
~~~

Perfecto, esta es **una muy buena pregunta** 👌
Vamos a destripar esa función con calma y sin humo.

---

## 🧠 El problema de fondo (1 minuto de contexto)

El ESP32 **no tiene reloj interno con batería**.
Cada vez que arranca:

* Fecha = **1 de enero de 1970**
* Hora = **00:00**
* SSL dice: *“este certificado no es válido en 1970”*
* Firebase corta la conexión ❌

👉 Por eso **hay que pedir la hora a Internet** usando **NTP**.

---

## 🔧 `configTime()` — qué es y para qué sirve

```cpp
configTime(gmtOffset_sec, daylightOffset_sec, server1, server2, server3);
```

Esta función:

* Contacta servidores **NTP**
* Ajusta la hora del sistema del ESP32
* La guarda internamente para que SSL la use

---

## 🧩 Parámetro por parámetro

### 1️⃣ `gmtOffset_sec`

```cpp
gmtOffset_sec = 0
```

📌 **Desplazamiento respecto a UTC**, en segundos.

Ejemplos:

* España invierno → `3600`
* España verano → `7200`
* Argentina → `-10800`
* México → `-21600`

En nuestro ejemplo usamos `0` porque:

* SSL solo necesita una hora válida
* La zona horaria no importa para certificados

---

### 2️⃣ `daylightOffset_sec`

```cpp
daylightOffset_sec = 0
```

📌 Compensación por **horario de verano**, también en segundos.

* 1 hora = `3600`
* Si tu país no usa DST → `0`

De nuevo: **no es crítico para SSL**.

---

### 3️⃣ `server1`, `server2`, `server3`

```cpp
"pool.ntp.org"
"time.nist.gov"
```

📌 Servidores **NTP** (Network Time Protocol)

* Son relojes atómicos públicos
* Responden con fecha y hora exactas
* Puedes poner hasta 3 por redundancia

Ejemplos comunes:

* `"pool.ntp.org"`
* `"time.google.com"`
* `"time.nist.gov"`

Si uno falla → prueba el siguiente 👍

---

## 🧪 Nuestra función completa, línea por línea

```cpp
void initTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
```

👉 Arranca el cliente NTP y pide la hora.

---

```cpp
  Serial.print("Sincronizando hora");
```

Solo feedback visual, nada mágico.

---

```cpp
  time_t now = time(nullptr);
```

* `time_t` = tipo que guarda segundos desde 1970
* `time(nullptr)` devuelve la hora actual del sistema

Al inicio esto vale ≈ **0**.

---

```cpp
  while (now < 8 * 3600 * 2) {
```

📌 Truco importante.

* `8 * 3600 * 2 = 57600` segundos
* ≈ 16 horas después de 1970

👉 Si `now` es menor, **la hora aún no se ha sincronizado**.

---

```cpp
    delay(500);
    Serial.print(".");
    now = time(nullptr);
```

* Espera medio segundo
* Vuelve a consultar la hora
* Sale del bucle cuando NTP respondió

---

```cpp
  Serial.println("\nHora sincronizada");
}
```

✅ A partir de aquí:

* SSL funciona
* Firebase puede validar certificados
* HTTPS ya no falla

---

## 🟢 ¿Por qué esto arregla Firebase?

Firebase usa HTTPS → HTTPS usa TLS → TLS valida certificados →
los certificados tienen:

```text
Válido desde: 2024
Válido hasta: 2026
```

## 🧠 Tip PRO (opcional)

Si quieres **ver la hora real** en el ESP32:

```cpp
struct tm timeinfo;
getLocalTime(&timeinfo);

Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
```

---

## 🧾 Resumen ultra claro

* `configTime()` → pide la hora a Internet
* Los números son segundos de offset
* Los strings son servidores NTP
* SSL **no funciona sin hora válida**
* Firebase depende de SSL
* Por eso **SIEMPRE** va antes de `Firebase.begin()`

- El código

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h>


#define SSID  "" //poner nombre de tu red
#define PASS "" //poner tu password
#define DB_URL "esp32-77cc5-default-rtdb.firebaseio.com"
#define SECRET_KEY "3Mh5VZnh95KzaBjT9W2k4w4XIB82eRpalZL497UC"


FirebaseData myFirebaseData;
FirebaseAuth auth;
FirebaseConfig config;

int a;
float b;
bool c;
String d;

void InitWiFi();
void initTime();

void setup(){
  Serial.begin(9600);
  InitWiFi();

  initTime();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); //ya estamos conectados a la DB de Firebase!!
}

void loop(){
  Firebase.get(myFirebaseData, "/a");
  a= myFirebaseData.intData();
  Firebase.get(myFirebaseData, "/b");
  b = myFirebaseData.floatData();
  Firebase.get(myFirebaseData, "/c");
  c= myFirebaseData.boolData();
  Firebase.get(myFirebaseData, "/d");
  d= myFirebaseData.stringData();

  Serial.println(a);
  Serial.println(b);
  Serial.println(c);
  Serial.println(d);
}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() == WL_DISCONNECTED){
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

void initTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Sincronizando hora");
  time_t now = time(nullptr);

  while (now < 8 * 3600 * 2) {   // espera a que la hora sea válida
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println("\nHora sincronizada");
}
~~~

## JSON en Firebase - Serialización

- Subiremos un JSON así

~~~json
{
  "temperatura": 22,
  "humedad": 27,
  "msg": "Hola Internet",
  "MPU":{
    "Ac":{ //Acelerómetro
      "x":123,
      "y":123,
      "z":123
    },
    "Gi":{  //Giroscopio
      "x":123,
      "y":123,
      "z":123
    }
  }
}
~~~

- Vamos a tenr que crear cuatro objetos tipo FirebaseJson: el principal, el MPU, el Ac y el Gi

~~~cpp
FirebaseJson Medidas, MPU, Ac, Gi;
~~~

- Tenemos que llenar estos objetos con .set
- Uso toString para imprimir el JSON en consola, le paso el objeto JSON (el buffer donde lo va a almacenar) y le digo true al prettier para que se vea bonito
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h>


#define SSID  "" //poner nombre de tu red
#define PASS "" //poner tu password
#define DB_URL "esp32-77cc5-default-rtdb.firebaseio.com"
#define SECRET_KEY "3Mh5VZnh95KzaBjT9W2k4w4XIB82eRpalZL497UC"


FirebaseData myFirebaseData; //sirve para ller y escribir en la DB
FirebaseAuth auth;
FirebaseConfig config;

FirebaseJson Medidas, MPU, Ac, Gi;
String myJsonStr;
int i=0;

int a;
float b;
bool c;
String d;

void InitWiFi();
void initTime();

void setup(){
  Serial.begin(9600);
  InitWiFi();

  initTime();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); //ya estamos conectados a la DB de Firebase!!
}

void loop(){
  //Giroscopio
  Gi.set("x", i);
  Gi.set("y", i+1);
  Gi.set("z", i+2);
  //Acelerómetro
  Ac.set("x", i);
  Ac.set("y", i+1);
  Ac.set("z", i+2);

  MPU.set("Ac", Ac);
  MPU.set("Gi", Gi);

  Medidas.set("temperatura", 22+1);
  Medidas.set("humedad", 10+1);
  Medidas.set("msg", "Hola ESP32");
  Medidas.set("MPU", MPU);

  //le paso el buffer, le digo que true al prettier  
  Medidas.toString(myJsonStr, true);
  //imprimo el JSON en consola
  Serial.println(myJsonStr);  
  i++;

  //le paso el objeto Firebase, el path, y el objeto en si a subir
  Firebase.set(myFirebaseData, "medidas", Medidas);
  
  if(i>15){
    i=0;
  }

  delay(1000);
}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() == WL_DISCONNECTED){
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

void initTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Sincronizando hora");
  time_t now = time(nullptr);

  while (now < 8 * 3600 * 2) {   // espera a que la hora sea válida
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println("\nHora sincronizada");
}
~~~

## JSON en Firebase - Deserialización

- Para hacer la lectura ya no es solo el objeto tipo FirebaseData
  - Usaremos FirebaseJson, FirebaseJsonData y una variable de tipo String
  - Haremos un .get y toda la info irá al FirebaseData
  - Para poder visualizarlo en la terminal lo pasaremos a String
  - Desde esta variable lo setearemos al FirebaseJson
  - Para acceder a los dfatas usaremos el FirebaseJsonData
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h>


#define SSID  "" //poner nombre de tu red
#define PASS "" //poner tu password
#define DB_URL "esp32-77cc5-default-rtdb.firebaseio.com"
#define SECRET_KEY "3Mh5VZnh95KzaBjT9W2k4w4XIB82eRpalZL497UC"

//Para la conexión con Firebase
FirebaseAuth auth;
FirebaseConfig config;

//Para la deserialización 
FirebaseData myFirebaseData;
FirebaseJson myJson;
FirebaseJsonData myJsonData;
String myJsonStr;

//variables para almacenar la data extraida de la DB
int humedad;
int temperatura;
String msg;
int Acx, Acy, Acz, Gix, Giy, Giz;


void InitWiFi();
void initTime();

void setup(){
  Serial.begin(9600);
  InitWiFi();

  initTime();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); //ya estamos conectados a la DB de Firebase!!
}

void loop(){

  Firebase.get(myFirebaseData,"/medidas"); //obtengo el JSON de la DB
  myJsonStr = myFirebaseData.jsonString(); //lo formateo a String para imprimir
  Serial.println(myJsonStr);

  myJson.setJsonData(myJsonStr);//formateo a FirebaseJson
  
  myJson.get(myJsonData, "/medidas"); //solicito todo mi JSON
  myJsonStr = myFirebaseData.jsonString(); //lo convierto a String
  Serial.println(myJsonStr);

  myJson.get(myJsonData, "/temperatura"); //le paso el JsonData y el path del valor que quiero
  temperatura = myJsonData.intValue; //accedo al valor y la guardo 
  
  myJson.get(myJsonData, "/humedad");
  humedad = myJsonData.intValue;
  
  myJson.get(myJsonData, "/msg");
  msg = myJsonData.stringValue;

  myJson.get(myJsonData,"/MPU/Ac/x");
  Acx = myJsonData.intValue;
                            
  myJson.get(myJsonData,"/MPU/Ac/y");
  Acy = myJsonData.intValue;
                            
  myJson.get(myJsonData,"/MPU/Ac/z");
  Acz = myJsonData.intValue;
                            
  myJson.get(myJsonData,"/MPU/Gi/x");
  Gix = myJsonData.intValue;
                            
  myJson.get(myJsonData,"/MPU/Gi/y");
  Giy = myJsonData.intValue;
                            
  myJson.get(myJsonData,"/MPU/Gi/z");
  Giz = myJsonData.intValue;
              
  //imprimir valores
  Serial.println("Valores: ");
  Serial.println("Humedad: "); Serial.println(humedad);
  Serial.println("Temperatura: "); Serial.println(temperatura);
  Serial.println("Mensaje: "); Serial.println(msg);
  Serial.println("Valores Acelerómetro: "); 
  Serial.println("x: "); Serial.println(Acx);
  Serial.println("y: "); Serial.println(Acy);
  Serial.println("z: "); Serial.println(Acz);
  Serial.println("Valores Giroscopio: "); 
  Serial.println("x: "); Serial.println(Gix);
  Serial.println("y: "); Serial.println(Giy);
  Serial.println("z: "); Serial.println(Giz);

  delay(1000);
}


void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() == WL_DISCONNECTED){
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

void initTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Sincronizando hora");
  time_t now = time(nullptr);

  while (now < 8 * 3600 * 2) {   // espera a que la hora sea válida
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println("\nHora sincronizada");
}
~~~

## Callback Firebase

- Vamos a detectar cuando cambia la base de datos, para eso vamos a usar una función callback
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>

#define SSID "Discovery117"
#define PASS "0112358Pardas"
void InitWiFi();

#define DB_URL "callback-a7ce8-default-rtdb.firebaseio.com"       // URL de la base de datos.
#define SECRET_KEY "tBGOeVXX1OC5V8qJ6ZrroCN0KlrT8KK6JzrYf7jH"     // Secreto de la base de datos.

FirebaseData myFirebaseData;
FirebaseAuth auth;
FirebaseConfig config;

//variables
int valor;
boolean movimiento;
String namePath;

void firebaseCallback(StreamData); //se ejecuta cuando ocurra un cambio en la DB
void timeoutCallback(bool);        //nos dirá si excede o no el tiempo de espera
String path = "ESP32/medidas";     //nuestro path base


void setup() {
  Serial.begin(9600);
  InitWiFi();

  config.database_url = DB_URL;
  config.signer.tokens.legacy_token = SECRET_KEY;
  Firebase.begin(&config, &auth);  // Inicializamos la conexión a Firebase
  Firebase.reconnectWiFi(true);  //reestablezca la conexión

  if(Firebase.beginStream(myFirebaseData, path)){    //a la escucha de lo que ocurra en el path ESP32/medidas
//si se logra la conexió, le paso el FirebaseData, la función que se ejecutará cuando haya un cambio, y el timeout
    Firebase.setStreamCallback(myFirebaseData, firebaseCallback, timeoutCallback);  
  }else{
    Serial.println("No se puede establecer conexión con la base de datos.");
    Serial.println("Error: " + myFirebaseData.errorReason());
  }

}

void loop() {
  
}
                      //nos llega la data de tipo StreamData
void firebaseCallback(StreamData data){
  Serial.println("Cambios en la base de datos");
  Serial.println(data.dataType());   // Que tipo de dato esta llegando
  
  // Tipos: int, float, string, boolean, null
  if(data.dataType().equals("int")){
    valor = myFirebaseData.intData();
    namePath = myFirebaseData.dataPath(); //guardo el path
    Serial.println(namePath + ": " + valor);

      if(namePath.equals("/DHT11/humedad")){ //path completo ESP32/medidas/DHT11/humedad
      Serial.print("Humedad: ");
      Serial.println(valor);
    }
      if(namePath.equals("/DHT11/temperatura")){
      Serial.print("Temperatura: ");
      Serial.println(valor);
    }
  }

  if(data.dataType().equals("boolean")){
    movimiento = myFirebaseData.boolData();
    namePath = myFirebaseData.dataPath();
    Serial.println(namePath + ": " + movimiento);
    movimiento==true?Serial.println("Movimiento detectado"):Serial.println("");
  }

}

void timeoutCallback(bool timeCallback){
  if(timeCallback){ //si está en true es que se ha excedido el límite de tiempo
    Serial.println("Tiempo de espera excedido");
  }
}

void InitWiFi(){
  WiFi.begin(SSID, PASS);
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() != WL_CONNECTED){
    Serial.print(".");
    delay(100);
  }

  if(WiFi.status() == WL_CONNECTED){
    Serial.println("");
    Serial.println("");
    Serial.println("Conexion exitosa!!!");
    Serial.println("");
    Serial.print("Tu IP es: ");
    Serial.println(WiFi.localIP());
  }else{
    Serial.println("Fallo en conexion a internet");
  }
}
~~~

- Si cambio un valor desde la DB me imprime en consola el nuevo valor
- El tipo de valor que lee al inicio en un JSON (medidas es un JSON)
- Al hacerlo por cambio en el path nos evitamos latencia, cosa que si sucedería si tuvieramos que borrar y reescribir todo el JSON para que detecte que el cambio es un JSON y no solo un valor
- Cuando modificamos el JSON desde la DB detecta el cambio, no se modificó todo el JSON, solo el valor que haya modificado
- Es recomendable esta estrategia


