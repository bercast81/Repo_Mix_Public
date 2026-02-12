# 02- PlatformIO - Comunicación


## Comunicación serial

- La comunicación serial es un protocolo común utiizado en la comunicación entre dispositivos
- Si quisieramos conectar dos ESP32 por serie
  - Conectar la Tx de uno con la Rx del otro
  - La Rx de uno con la Tx del otro
  - Y finalmente conectar la GND de uno con la GND del otro
  - Aquí solo veremos como comunicarnos con la compu a través de la consola del IDE
- Para leer a 115200 baudios debemos cambiar la velocidad de nuestro monitor serial
- Vamos a platformio.ini y agregamos esta linea

> monitor_baud= 115200

- Con valor = Serial.read() guardo en valor lo que sea que aprieto en consola, si aprieto una a me devuelve 97, que es su valor ASCII, lo imprimo con Serial.println(valor) para ver el caracter 
- Si quiero que el monitor serial lo envíe en crudo (binario) uso Serial.write(valor); 
- Serial.println( Serial.readString() ), el valor que llegue en bytes lo convierte a String
- main.cpp

~~~cpp
#include <Arduino.h>

int valor;

void setup() {

  /** La velocidad de comunicación serial se mide en bit por segundo o baudios,
   *  la velocidad típica es de 9600 baudios, existen mas velocidades como 
   *  300, 600, 1200, 4800, 9600, 14400, 19200, 28800, 38400, 57600 y 115200 
   */
  Serial.begin(115200);   // Los valores mas típicos son 9600 y 115200
 
  /* Serial.print */
  Serial.print("--- Serial.print --- ");
  Serial.print("--- Serial.print2 ---");

  /* Serial.println */
  Serial.println();
  Serial.println("--- Serial.println ---");

  Serial.println(117);
  Serial.println(123.123);
  Serial.println("E");
  Serial.println("Electronica117");

  /* Serial.println con segundo parametro */
  Serial.println("--- Serial.println con segundo parametro ---");

  Serial.println(117, DEC); //Decimal
  Serial.println(117, HEX); //Hexadecimal
  Serial.println(117, BIN);
  Serial.println(117, OCT);
  Serial.println(123.123, 0); //0 dígitos después del punto
  Serial.println(123.123, 3);

}

void loop() {

  while(Serial.available()){ // Serial.avalible retorna un valor booleano dependiendo si hay valores en el buffer del serial
    
    //valor = Serial.read();     // Con Serial.read leemos un byte del buffer y retorna su valor entero
    //Serial.println(valor);    //imprime el caracter que estoy captando desde el monitor con el teclado físico
    //Serial.write(valor);       //envía los bytes en crudo del caracter captado
    
    Serial.println( Serial.readString() ); //convierte el valor en bytes a string
  }

  delay(100);
}
~~~

## Serial Bluetooth

- Son los mismos métodos que en la lección anterior, solo que en lugar de Serial, es SerialBT
- En el setup inicializo la comunicación serial, uso pinMode para el LED e inicio la comunicación Bluetooth
  - Le paso el nombre del bluetooth (cómo es que va a aparecer en otro dispositivo)
- En el loop pregunto si hay datos en el buffer para entrar en el while y ejecutar el código
  - Si hay datos, los vamos a leer y los vamos a enviar al monitor serial
- Si no hay datos va a saltar al siguiente while, donde pregunto si hay datos en el buffer del puerto UART
  - Si hay datos los voy a leer y los voy a mandar por bluetooth con SerialBT.println(valor); SerialBT.write(valor);
- main.cpp

~~~cpp
#include <Arduino.h>
#include <BluetoothSerial.h>

#define PinLed 2
int valor;

BluetoothSerial SerialBT;               // Declaramos un objeto de tipo BluetoothSerial.

void setup() {

  Serial.begin(9600);                   // Inicializamos la comunicación serial.
  pinMode(PinLed, OUTPUT);              // Configuramos la terminal PinLed como salida.
  SerialBT.begin("Electronica117");     // Inicializamos la comunicación bluetooth serial. 
  
}

void loop() {
  
  while(SerialBT.available()){          // Checamos si el buffer del bluetooth serial tiene datos
    /* Si tiene datos entrara en el while */
    valor = SerialBT.read();            // Leemos únicamente 8bits y se almacena en “valor” 
    /* Enviamos el valor al monitor serial  */
    Serial.println(valor);   //imprime el caracter
    Serial.write(valor);     //imprime el valor en crudo (binario/hexadecimal, depende de la consola)
  }

  while(Serial.available()){            // Checamos si el buffer del serial tiene datos
    /* Si tiene datos entrara en el while */
    valor = Serial.read();              // Leemos únicamente 8bits y se almacena en “valor” 
    /* Enviamos el valor al monitor serial  */
    SerialBT.println(valor);
    SerialBT.write(valor);
  }

  /* El led en el ESP32 prende si el valor de “valor” es 1 */
  if(valor == '1'){ //si tiene el código ASCII de 1 enciendo el LED
    digitalWrite(PinLed, HIGH);
    Serial.println("LED on");
  }else if(valor == '2'){
    digitalWrite(PinLed, LOW);
    Serial.println("LED off");
  }

}
~~~

- Este código ocupa el 66% de la memoria FLASH (enorme!!)
- Lo que hay que hacer es reparticionar la memoria del ESP32
- En platformio.ini y añadimos esta linea

> board_build.partitions = huge_app.csv

- huge_app.csv es una tabla de particiones que le va a permitir tener más espacio en la FLASH
- Ahora el programa compilado ocupa solo el 27.7% de la FLASH
- Con la app Serial Bluetooth Terminal en el móvil voy a Devices y busco Electronica117, que es el nombre que le puse
- Clico, me conecto y le mando un 1 para encender el LED

## WIFI (STA)


- Todo lo hacemos en el setup porque solo nos queremos conectar a una red wifi
- Estación es cuando nos conectamos a una red, Punto de acceso es cuando generamos una red para que otros se conecten
- Con Wifi.begin el modo estación viene por defecto
- main.cpp

~~~cpp
#include <Arduino.h>
#include <WiFi.h>

#define SSID "Electronica117"     // A que red me quiero conectar
#define PASS "Electro117nica"     // password de la red

void InitWiFi();

void setup() {

  Serial.begin(9600);
  InitWiFi();

}

void loop() {
  
}


void InitWiFi(){
  
  WiFi.mode(WIFI_STA);                      // Estacion 
  //WiFi.mode(WIFI_AP);                     // Punto de Acceso 
  //WiFi.mode(WIFI_MODE_APSTA);             // Ambos 

  WiFi.begin(SSID, PASS);                   // Inicializamos el WiFi con nuestras credenciales.
  Serial.print("Conectando a ");
  Serial.print(SSID);

  while(WiFi.status() != WL_CONNECTED){   // bucle hasta que el estado del WiFi sea diferente a desconectado.
    Serial.print(".");
    delay(50);
  }

  if(WiFi.status() == WL_CONNECTED){        // Si el estado del WiFi es conectado entra al If
    Serial.println();
    Serial.println();
    Serial.println("Conxion exitosa!!!");
  }

  Serial.println("");
  Serial.print("Tu IP es: ");
  Serial.println(WiFi.localIP()); //imprimo la IP
}
~~~

## Formato JSON - Serialización


- A agrupar todas las variables en un formato JSON le llamaremos serialización
- Será muy útil en MQTT
- Para agregar la biblioteca ya lo vimos, voy al Home de PlatformIO, LIbarries, busco la biblioteca, la agrego al proyecto
- La forma mas sencilla de obtener el tamaño del JSON que vamos a usar es yendo a https://arduinojson.org/v6/assistant/
    - Seleccionamos ESP32, Serializar, salida: String
    - Le pasamos un ejemplo del JSON que queremos obtener al serializar. El que hay en el ejemplo comentado da 192
- main.cpp

~~~cpp
#include <Arduino.h>
#include <ArduinoJson.h>
/**
 * ArduinoJson by Benoit Blanchon
 */

StaticJsonDocument<192> myJson;  //creo el objeto, 192 es el tamaño que va a tener el JSON
/* https://arduinojson.org/v6/assistant/ */
String myJsonStr; //esta variable nos va a servir para almacenar nuestro JSON


int var1 = 117;
float var2 = 117.117;
boolean var3 = true;
String var4 = "Hola";

void setup() {
  
  Serial.begin(9600);

  /* Guardamos las 4 variables en myJson */
  myJson["var1"].set(var1);
  myJson["var2"].set(var2);
  myJson["var3"] = var3; //otra manera de hacerlo, con .set o =
  myJson["var4"] = var4;

  JsonObject myJsonAnidado = myJson.createNestedObject("Anidado");
  
  myJsonAnidado["v1Anidada"] = 123.123;
  myJsonAnidado["v2Anidada"] = "Electronica117";
  myJsonAnidado["v3Anidada"] = false;

  //serializeJson(myJson, myJsonStr);
  serializeJsonPretty(myJson, myJsonStr); //le pasamos el objetio JSON y la variable donde la vamos a guardar
                                          // con Pretty visualizamos el JSON con saltos de linea

  Serial.println(myJsonStr);

}

void loop() {
  
}

/*
{
  "var1": 117,
  "var2": 117.117,
  "var3": true,
  "var4": "Hola",
  "Anidado": {
    "v1Anidada": 123.123,
    "v2Anidada": "Electronica117",
    "v3Anidada": false
  }
}
*/
~~~

## Formato JSON - Deserialización

- Vamos a extraer de un JSON y guardar los valores en variables
- Voy a la web https://arduinojson.org/v6/assistant/ y cambio el modo a deserialzar, le paso el JSON, me da el tamaño
- Sería un JSON que nos llegaría por MQTT y lo guardo en una variable de tipo String myJsonStr
- main.cpp

~~~cpp
#include <Arduino.h>
#include <ArduinoJson.h>

/**
 * ArduinoJson by Benoit Blanchon
 */

StaticJsonDocument<256> myJson;
/* https://arduinojson.org/v6/assistant/ */
String myJsonStr = "{\"var1\":117,\"var2\":117.117,\"var3\":true,\"var4\":\"Hola\",\"Anidado\":{\"v1Anidada\":123.123,\"v2Anidada\":\"Electronica117\",\"v3Anidada\":false}}";
// {"var1":117,"var2":117.117,"var3":true,"var4":"Hola","Anidado":{"v1Anidada":123.123,"v2Anidada":"Electronica117","v3Anidada":false}}

int var1;
float var2;
boolean var3;
String var4;

float v1Anidada;
String v2Anidada;
boolean v3Anidada;

void setup() {
  
  Serial.begin(9600);

    //guardo el posible error y lo imprimo, primero le paso mi variable donde guardo el JSON y luego el JSON
  DeserializationError error = deserializeJson(myJson, myJsonStr);
  Serial.print("Error: "); Serial.println(error.c_str());

  if(error == DeserializationError::Ok){ //si me arroja un estado de OK

    if(myJson.containsKey("var1")){ // si el JSON contiene esta clave
      var1 = myJson["var1"].as<int>(); //guardo el valor en la variable, debo pasarle el tipo
    }
    
    if(myJson.containsKey("var2")){
      var2 = myJson["var2"].as<float>();
    }

    if(myJson.containsKey("var3")){
      var3 = myJson["var3"].as<boolean>();
    }

    if(myJson.containsKey("var4")){
      var4 = myJson["var4"].as<String>();
    }

    if(myJson.containsKey("Anidado")){
      JsonObject Anidado = myJson["Anidado"].as<JsonObject>();

      if(Anidado.containsKey("v1Anidada")){
        v1Anidada = Anidado["v1Anidada"].as<float>();
      }

      if(Anidado.containsKey("v2Anidada")){
        v2Anidada = Anidado["v2Anidada"].as<String>();
      }

      if(Anidado.containsKey("v3Anidada")){
        v3Anidada = Anidado["v3Anidada"].as<boolean>();
      }
    }

  }


  Serial.print("var1: "); Serial.println(var1);
  Serial.print("var2: "); Serial.println(var2);
  Serial.print("var3: "); Serial.println(var3);
  Serial.print("var4: "); Serial.println(var4);
  Serial.println();
  Serial.print("v1Anidada: "); Serial.println(v1Anidada);
  Serial.print("v2Anidada: "); Serial.println(v2Anidada);
  Serial.print("v3Anidada: "); Serial.println(v3Anidada);


}

void loop() {
  
}
~~~

- DeserializationError::Ok, estos :: significa que ok pertenece a DeserializationError
- Hay varios posibles
  - DeserializationError::Ok
  - DeserializationError::InvalidInput
  - DeserializationError::NoMemory
  - DeserializationError::IncompleteInput
- La biblioteca ArduinoJson, cuando escribo 

~~~cpp
myJson["Andidado"] //no es un float ni un JsonObject, es un JsonVariant
~~~

- Un JsonVariant puede ser int, float, bool, string, array, object
- El tipo no se fija hasta que llamas a 

~~~cpp
.as<T> // donde T es el tipo 
~~~
---------