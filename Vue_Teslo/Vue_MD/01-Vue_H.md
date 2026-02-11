# 01 Vue  Herrera - Basics

## Basics

- El primer ejemplo será con JS. Luego será todo con TypeScript
- Nos enfocaremos en el **Composition API**
    - Los componentes van a tener internamente una función setup donde va toda la lógica
    - En el ejemplo creo la variable reactiva que al retornarla puedo renderizarla en el template html

~~~vue
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">{{ message }}</div>

<script>
  const { createApp, ref } = Vue

  createApp({
    setup() {
      const message = ref('Hello vue!')
      return {
        message
      }
    }
  }).mount('#app')
</script>
~~~

- Esto no renderiza otros componentes cuando las variables reactivas cambian

## Hola mundo

- Para este ejemplo vamos a usar el CDN
- Creo un index.html, enlazo el cdn y el script app.js (que creo yo)

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola mundo en Vue</title>
</head>
<body>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- Para renderizar el contenido en el navegador con VSCode usar la extensión Live Server (si no hay que apretar Ctrl+R para refrescar el navegador y que renderice los cambios. Esto no pasa instalando Vue)
- Creo app.js (enlazado en el html)
- Puedo hacer un console.log(Vue) para ver todo el objeto de Vue
    - Puedo usar la desestructuración para tomar lo que me interesa del objeto Vue
    - **NOTA**: trabajando con el CDN no tenemos el intellisense
    - Uso el template para usar un template literal

~~~js
const {createApp, ref} = Vue


const app = createApp({
    template:`
    <h1>Hola mundo</h1>
    <p>Desde app.js</p>
     `
})
~~~

- ¿Dónde renderizo la aplicación?
- Creo un div con un id

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola mundo en Vue</title>
</head>
<body>
    <div id="MyApp"></div>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- Lo monto en el app.js con mount y el selector de css #

~~~js
const {createApp, ref} = Vue


const app = createApp({
    template:`
    <h1>Hola mundo</h1>
    <p>Desde app.js</p>
     `
})

app.mount("#MyApp")
~~~

- De esta manera puedo usar esta tecnología donde quiera, combinada con otras, destinando un espacio en el html para la aplicación creada con Vue

## Estado del componente - Variables reactivas

- Para usar la variable reactiva en el html (template literal en este caso) debo retornarla en el return
- Para poder modificar la constante message y transformarla en una variable reactiva usamos ref
- Sigo sin poder cambiar el valor de message, pero puedo usar message.value

~~~js
const {createApp, ref} = Vue


const app = createApp({
    template:`
    <h1>{{message}}</h1>
    <p>Desde app.js</p>
     `,

     setup(){
        
        const message =  ref("I'm Batman");

        setTimeout(()=>{
            message.value="Soy Goku";
        }, 1000)

        return{
            message
        }
     }
})

app.mount("#MyApp")
~~~

- Entonces, **ref me crea mi variable reactiva y con .value puedo cambiar su valor**
- **Debo retornarla en la función setup para poder renderizarla**
- **Uso doble llave para renderizarla en el html**
- Esta es una de las dos formas de hacer un cambio en una variable reactiva

~~~js
const {createApp, ref} = Vue


const app = createApp({
    template:`
    <h1>{{message}}</h1>
    <p>{{author}}</p>
     `,

     setup(){
        
        const message =  ref("I'm Batman");
        const author = ref("-Bruce Wayne")

        setTimeout(()=>{
            message.value="Hola, soy Goku";
            author.value="-Goku"
        }, 1000)

        return{
            message,
            author
        }
     }
})

app.mount("#MyApp")
~~~

## Separar HTML y eventos

- Supongamos que no queremos el html en el template sino que esté en el index.html
- En el div con id MyApp es donde Vue existe (es el id que usado con .mount para montar la app)
- Se puede "teletransportar" elementos de Vue fuera de este div, lo veremos más adelante

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola mundo en Vue</title>
</head>
<body>
    <div id="MyApp">
        <h3>{{message}}</h3> 
        <p>{{author}}</p>

    </div>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- Pongamos que en lugar de usar el setTimeOut quiero usar un botón para cambiar el contenido
- Para disparar eventos uso **v-on**
- **NOTA**: cuando usemos las herramientas de Vue y no el CDN tendremos el intellisense para ver todos los eventos disponibles
- Creo la función (dentro del setup) para usar en el v-on, en app.js
- La exporto en el return

~~~js
const {createApp, ref} = Vue


const app = createApp({
     setup(){
        
        const message =  ref("I'm Batman");
        const author = ref("-Bruce Wayne")

        const changeQuote=()=>{
            message.value="Hola, soy Goku",
            author.value="-Goku"
        }

        return{
            message,
            author,
            changeQuote
        }
     }
})

app.mount("#MyApp")
~~~

- Ahora solo tengo que usarla en el index.html
- La puedo mandar solo por referencia porque no tengo que pasarle ningún valor

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hola mundo en Vue</title>
</head>
<body>
    <div id="MyApp">
        <h3>{{message}}</h3>
        <p>{{author}}</p>

        <button v-on:click="changeQuote">Cambiar Mensaje</button>

    </div>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- Las variables reactivas va a cambiar en todos los lugares donde se haga referencia a ellas
- Tenemos variables reactivas que son propiedades computadas. Esa propiedad computada va a ser basada en otras variables reactivas
- **Todo lo que hemos hecho se puede simplificar muchísimo una vez trabajemos en una aplicación de Vue completa**

## v-for - Iterar elementos

- Nuevo ejercicio. Creo un nuevo index.html
- Volvemos a usar el CDN, un nuevo app.js,el div con #MyApp
- index.html

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

    <div id="MyApp">
        <h1>Batman Quotes</h1>
        <hr>
    </div>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- En el app.js desestructuro de Vue createApp y ref
- Uso createApp con la función setup y el return
- Monto la aplicación con .mount usando el id del div del html usando el selector # de CSS

~~~js
const {createApp, ref} = Vue


const app = createApp({
    setup(){


        return{

        }
    }
})

app.mount("#MyApp")
~~~

- v-for no solo va a permitir iterarlos, también desestructurarlos, usar índices, etc
- Usaremos estas quotes de Batman, las pego en app.js
- Aunque la constante esté declarada fuera del setup, tengo acceso porque JS tiene acceso a ella
- JS se antepone a cualquier cosa que haga Vue
- Entonces, puedo retornarla en el return de setup (no es un objeto reactivo, simplemente es un arreglo)

~~~js
const {createApp, ref} = Vue

const quotes = [
    { quote: 'The night is darkest just before the dawn. And I promise you, the dawn is coming.', author: 'Harvey Dent, The Dark Knight' },
    { quote: 'I believe what doesn’t kill you simply makes you, stranger.', author: 'The Joker, The Dark Knight' },
    { quote: 'Your anger gives you great power. But if you let it, it will destroy you… As it almost did me', author: 'Henri Ducard, Batman Begins' },
    { quote: 'You either die a hero or live long enough to see yourself become the villain.', author: 'Harvey Dent, The Dark Knight' },
    { quote: 'If you’re good at something, never do it for free.', author: 'The Joker, The Dark Knight' },
    { quote: 'Yes, father. I shall become a bat.', author: 'Bruce Wayne/Batman, Batman: Year One' },
]

const app = createApp({
    setup(){
        

        return{
            quotes
        }
    }
})

app.mount("#MyApp")
~~~

- El v-for es como trabajar con un for of (también hay un for-in)

~~~html
<div id="MyApp">
    <h1>Batman Quotes</h1>
    <hr>
    <ul>
        <li v-for="quote in quotes">
            {{quote.author}}
        </li>
    </ul>
</div>
~~~

- Puedo usar desestructuración

~~~html
<div id="MyApp">
    <h1>Batman Quotes</h1>
    <hr>
    <ul>
        <li v-for="({quote, author}) in quotes">
            <span>{{quote}}</span>
            <blockquote>{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~

- Para obtener el índices (bien podría usar ol, ordered list) pero si quiero controlarlos yo, uso index
- Uso index+1 porque los arreglos en JS empiezan en 0

~~~html
<div id="MyApp">
    <h1>Batman Quotes</h1>
    <hr>
    <ul>
        <li v-for="({quote, author}, index) in quotes">
            <span>{{index+1}}- {{quote}}</span>
            <blockquote>{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~

## v-if VS v-show

- Estas directivas nos van a permitir ocultar elementos
- Pongamos que quiero trabajar con una variable para mostrar el autor
- Como va a cambiar (va a ser reactiva) uso ref

~~~js
const {createApp, ref} = Vue

const quotes = [/*quotes de Batman*/]

const app = createApp({
    setup(){
        
        const showAuthor = ref(true);

         const showAuthorFunc=()=>{
            showAuthor.value= !showAuthor.value
        }

        return{
            quotes,
            showAuthor,
            showAuthorFunc
        }
    }
})

app.mount("#MyApp")
~~~

- Uso el v-if (si lo pongo en false no muestra el autor)
- En lugar del v-on puedo usar @

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

    <div id="MyApp">
        <h1>Batman Quotes</h1>
        <button @click="showAuthorFunc">Toggle Author</button>
        <hr>

        <ul>
            <li v-for="({quote, author}, index) in quotes">
                <span>{{index+1}}- {{quote}}</span>
                <blockquote v-if="showAuthor">{{author}}</blockquote>
            </li>
        </ul>
    </div>
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="./app.js"></script>
</body>
</html>
~~~

- En el lado del template no tengo que usar .value, porque Vue ya desenvuelve el valor para ser consumido
- Entonces también podría usarse directamente en el @click

~~~html
<div id="MyApp">
    <h1>Batman Quotes</h1>
    <button @click="showAuthor=!showAuthor">Toggle Author</button>
    <hr>
    <ul>
        <li v-for="({quote, author}, index) in quotes">
            <span>{{index+1}}- {{quote}}</span>
            <blockquote v-if="showAuthor">{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~

- En vez del v-if también tenemos el v-show
- El **v-show** lo que hace es **ponerle el display:none al elemento** (o quitárselo)
- Con el **v-if** **el elemento deja de existir en el html**
- El v-if dispara el ciclo de creación del componente una vez se vuelve a crear
- El v-show solo le agrega la clase de CSS display:none, por lo que no tiene que volver a cargar todo el componente cuando se le da al toggle

## Eventos y propiedades computadas

- Supongamos que tenemos un botón que añade una nueva frase
- Creo una función para añadir una nueva frase
- Uso unshift para añadir la frase al inicio del arreglo de quotes

~~~js
const app = createApp({
    setup(){
        
        const showAuthor = ref(true);

        const showAuthorFunc=()=>{
            showAuthor.value= !showAuthor.value
        }

        const addQuote=()=>{
            quotes.unshift({quote: 'Hola mundo', author: 'Manolo García'})
            console.log(quotes)
        }

        return{
            quotes,
            showAuthor,
            showAuthorFunc, 
            addQuote
        }
    }
})
~~~

- De esta manera, si toco el botón de AddQuote veo en el console.log que se agrega la frase pero no la renderiza
- Vue no sabe que eso es algo a lo que tiene que reaccionar
- Hay dos maneras de decirle a Vue de que esto tiene que ser una variable reactiva
- Hasta ahora solo hemos visto con ref
- quote.unshift no nos va a funcionar porque es algo que tenemos directamente en un arreglo, pero ya no es un arreglo, es una propiedad reactiva, por lo que tengo que apuntar a .value

~~~js
const {createApp, ref} = Vue

const originalQuotes = [
    { quote: 'The night is darkest just before the dawn. And I promise you, the dawn is coming.', author: 'Harvey Dent, The Dark Knight' },
    { quote: 'I believe what doesn’t kill you simply makes you, stranger.', author: 'The Joker, The Dark Knight' },
    { quote: 'Your anger gives you great power. But if you let it, it will destroy you… As it almost did me', author: 'Henri Ducard, Batman Begins' },
    { quote: 'You either die a hero or live long enough to see yourself become the villain.', author: 'Harvey Dent, The Dark Knight' },
    { quote: 'If you’re good at something, never do it for free.', author: 'The Joker, The Dark Knight' },
    { quote: 'Yes, father. I shall become a bat.', author: 'Bruce Wayne/Batman, Batman: Year One' },
]

const app = createApp({
    setup(){
        
        const showAuthor = ref(true);
        const quotes= ref(originalQuotes);

        const showAuthorFunc=()=>{
            showAuthor.value= !showAuthor.value
        }

        const addQuote=()=>{
            quotes.value.unshift({quote: 'Hola mundo', author: 'Manolo García'})
        }

        

        return{
            quotes,
            showAuthor,
            showAuthorFunc, 
            addQuote
        }
    }
})

app.mount("#MyApp")
~~~

- Podemos crear una propiedad computada que se llame totalQuotes
- Desestructuro de Vue computed

~~~js
const app = createApp({
    setup(){
        
        const showAuthor = ref(true);
        const quotes= ref(originalQuotes);
        const totalQuotes=computed(()=>{
            return quotes.value.length
        })

        const showAuthorFunc=()=>{
            showAuthor.value= !showAuthor.value
        }

        const addQuote=()=>{
            quotes.value.unshift({quote: 'Hola mundo', author: 'Manolo García'})
        }

        

        return{
            quotes,
            showAuthor,
            showAuthorFunc, 
            addQuote,
            totalQuotes
        }
    }
})
~~~

- Lo renderizo en el html

~~~html
<div id="MyApp">
    <h1>Batman Quotes - {{totalQuotes}}</h1>
    <button @click="showAuthor=!showAuthor">Toggle Author</button>
    <button @click="addQuote">Add Quote</button>
    <hr>

    <ul>
        <li v-for="({quote, author}, index) in quotes">
            <span>{{index+1}}- {{quote}}</span>
            <blockquote v-if="showAuthor">{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~

- Vue es lo suficientemente inteligente para determinar que dentro de computed, si estoy usando cualquier valor reactivo, se va a dar cuenta y no hay que defenir dependencias (como en el arreglo del useEffect) ni nada por el estilo
- Pongamos que colocamos un input y quiero que al apretar el enter introduzca la nueva frase
- Usaríamos el v-on, la forma corta es @

~~~html
 <input type="text" 
    placeholder="Add Quote"
    @keypress="addQuote"
    >
~~~

- Si lo pongo de esta manera, cada vez que presiono una tecla añade la frase
- Hago uso de un modificador para disparar la función

~~~html
<div id="MyApp">
    <h1>Batman Quotes - {{totalQuotes}}</h1>
    <input type="text" 
    placeholder="Add Quote"
    @keypress.enter="addQuote"
    >
    <button @click="showAuthor=!showAuthor">Toggle Author</button>
    <button @click="addQuote">Add Quote</button>
    <hr>

    <ul>
        <li v-for="({quote, author}, index) in quotes">
            <span>{{index+1}}- {{quote}}</span>
            <blockquote v-if="showAuthor">{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~

- **NOTA**:no añade la frase que escribo en el input. Al apretar enter en el input dispara la función addQuote, gracias al modificador .enter lo que añade la frase en duro que pusimos a la función que es Hola Mundo

## v-model

- Sirve para crear un 2 way data binding (un enlazado de dos lugares). Es decir, si cambia en el input html, que también cambie en el archivo de javascript y a la inversa
- Está limitado (según la documentación) a las etiquetas input, select, textarea y componentes personalizados
- Tiene ciertos modificadores: .lazy, .number y .trim
- Con el v-model en nuestro caso, tengo que apuntar a alguna variable
- La creo en app.js, newMessage. La puedo inicializar vacía
- Cambio de la función addQuote la quote en duro por newMessage.value
- Después la reseteo a un valor vacío para vaciar el input

~~~js
const app = createApp({
    setup(){
        
        const showAuthor = ref(true);
        const quotes= ref(originalQuotes);
        const totalQuotes=computed(()=>{
            return quotes.value.length;
        })
        const newMessage=ref('');

        const showAuthorFunc=()=>{
            showAuthor.value= !showAuthor.value;
        }

        const addQuote=()=>{
            quotes.value.unshift({quote: newMessage.value, author: 'Manolo García'});
            newMessage.value='';
        }

        

        return{
            quotes,
            showAuthor,
            showAuthorFunc, 
            addQuote,
            totalQuotes,
            newMessage
        }
    }
})
~~~

- En el html tengo la referencia a la variable

~~~html
<div id="MyApp">
    <h1>Batman Quotes - {{totalQuotes}}</h1>
    <input type="text" 
    placeholder="Add Quote"
    @keypress.enter="addQuote"
    v-model="newMessage"
    >
    <button @click="showAuthor=!showAuthor">Toggle Author</button>
    <button @click="addQuote">Add Quote</button>
    <hr>

    <ul>
        <li v-for="({quote, author}, index) in quotes">
            <span>{{index+1}}- {{quote}}</span>
            <blockquote v-if="showAuthor">{{author}}</blockquote>
        </li>
    </ul>
</div>
~~~
---------


