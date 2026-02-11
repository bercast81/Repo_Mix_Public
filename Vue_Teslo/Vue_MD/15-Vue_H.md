# 15 Vue Herrera - Carga de archivos y posteo

- Veremos como manejar la data
- Crearemos una única acción que se encargue de crear y actualizar al mismo tiempo
    - Vamos a poder diferenciar si tenemos un id o no
    - Podemos crear una pantalla diferente para la creación y la actualización (no se hará aquí)
- Crearemos una vista previa de las imágenes antes de enviarlas al backend
- Para crear un nuevo producto le daremos al botón de New
- Usaremos useMutation para hacer la mutación
- Las credenciales para ingresar son email: test1@google.com, password: Abc123

## Acción - updateProduct

- El endpoint para la actualización es un PATCH a /api/products/:id
- Nos va a pedir que estemos autenticados, esto lo solucionamos con el interceptor de axios
- src/api/tesloApi.ts

~~~js
import axios from 'axios'


const tesloApi = axios.create({
    baseURL: import.meta.env.VITE_TESLO_API_URL
})

tesloApi.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token')

    const isAuthRoute =
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register')

    if(token && !isAuthRoute){
        config.headers.Authorization = `Bearer ${token}` //coloca el token en los headers de autorización
    }
    return config
})

export {tesloApi}
~~~

- En modules/products/actions/create-update-product.action.ts
- Si recibo algo de tipo Product me va a obligar a recibir un usuario y un id, cosa que en el momento de la creación no tengo
- Así mismo en la actualización, quizá solo mande el título o la descripción cambiada
  - Para ello uso Partial. Significa que ahora todas las propiedades que tengo en Product son opcionales

~~~js
import type { Product } from "../interfaces/products-response.interface";

export const createUpdateProduct =async (product: Partial<Product>, id?: string)=>{
    if(product.id && product.id != ''){
        //Actualizar producto

    }   

    throw new Error('no implementado')
}
~~~

- Para las imágenes teníamos esta función basada en una variable de entorno (ya que en producción no será localhost:3000)
- products/actions/get-product-image.action.ts

~~~js
export const getProductImageAction =(imageName: string): string=> {

    return imageName.includes('http')
    ? imageName
    : `${import.meta.env.VITE_TESLO_API_URL}/files/product/${imageName}`
}
~~~ 

- A la hora de mandarlas debo mandar solo el nombre de la imagen, es decir 928379283723.jpg (sin el localhost:3000)
- create-update-product.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi";
import type { Product } from "../interfaces/products-response.interface";

export const createUpdateProductAction =async (product: Partial<Product>)=>{
    if(product.id && product.id != ''){
        
        return await updateProduct(product)
    }   

    throw new Error('no implementado')
}

const updateProduct = async(product: Partial<Product>)=>{
    
    const images: string[]= product.images?.map(image=>{
      if(image.startsWith('http')){
        const imageName = image.split('/').pop() //divido por el slash y extraigo la última posición
        
        //imageName puede regresar undefined
        return imageName ? image: '' //solo para asegurarnos de tener en images un arreglo de strings
      }  

      return image
    }) ?? []

    //esta parte es por como está organizado el backend
    const productId = product.id
    delete product.id //en la actualización no se espera que le mandemos el product.id
    delete product.user //el usuario va a estar en el token, no lo mando
    product.images = images //le paso el arreglo de strings de imágenes 

    //mandamos la data al backend
    try {

        const {data} = await tesloApi.patch(`/products/${productId}`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error updating product')
    }
} 
~~~

## useMutation - Actualizar producto

- La mutación no es más que realizar un cambio en nuestra data
- En admin/views/ProductView.vue, cuando llamamos al posteo del formulario en @submit="onSubmit" llamamos a esta función onSubmit
- En ProductView.ts tenemos esta función, que lo único que hace es llamar al handleSubmit del useForm
- ProductView.ts

~~~js
//dentro del setup

const {values, defineField, errors, handleSubmit, resetForm, meta} = useForm({
            validationSchema
        })

const onSubmit = handleSubmit((value)=>{
            console.log({value})
        })
~~~

- A menos de que todos los campos requeridos estén, esta función no se dispara
- Esta es la data que le tenemos que mandar a nuestra acción (el value del handleSubmit)
- ¿Porqué voy a querer usar una mutación en lugar de llamar directamente a la acción en el onSubmit?
  - Esto funcionaría, pero yo voy a querer saber si hay un error, obtener la data actualizada, tener el isLoading
  - El useMutation es muy similar al useQuery, pero usa el mutationFn
  - Le paso la función por referencia (si recibiera dos argumentos, el segundo argumento sería el context)
  - renombro la data y el isSuccess
- ProductView.ts

~~~js
//dentro del setup

const {mutate, isPending, isSuccess: isUpdateSuccess, data: updatedProduct} = useMutation({
        mutationFn: createUpdateProductAction
    })
~~~

- El mutate es la referencia a nuestra función mutationFn
  - Cuando está definido el useMutation no quiere decir que se va a realizar  la petición como sucede con el useQuery
  - Cuando quiero disparar la función porque tengo la data actualizada llamo a mutate
  - La llamo  en el onSubmit
- ProductView.ts

~~~js
//dentro del setup 

const onSubmit = handleSubmit(async (values)=>{
    mutate(values) //regresa void
})
~~~

- Si hago un cambio en el titulo y le doy a guardar, no veo nada. Pero si recargo el navegador, los cambios persisten. ha hecho el posteo de la data correctamente
- Vamos a querer tener un feedback, si algo salió bien, si algo salió mal
- Lo podemos hacer con un simple watch
- ProductView.ts

~~~js
//dentro del setup

watch(isUpdateSuccess, ()=>{
            console.log({isUpdateSuccess})
        })
~~~

- Esto, cuando le doy a guardar y sale bien me devuelve un objeto como este

~~~js
{isUpdateSuccess: ObjectRefImpl}
isUpdateSuccess: 
ObjectRefImpl
__v_isRef: true //referencia reactiva, apunta a true cuando ha salido bien
_defaultValue: undefined
_key: "isSuccess"
_object: Proxy(Object) {context: undefined, data: {…}, error: null, failureCount: 0, failureReason: null, …}
_raw: 
{context: undefined, data: {…}, error: null, failureCount: 0, failureReason: null, …}
_shallow: false
_value: true
dep: (...)
value: (...)
[[Prototype]]: Object
[[Prototype]]: Object
~~~

- Si hago un cambio y clico dos veces el botón de Guardar sin hacer un segundo cambio, el __v__isRef, que es la referencia reactiva apunta a false
- En lugar de usar el isUpdateSuccess.value puedo obtener el value en el callback
- ProductView.ts

~~~js
//dentro del setup

const toast = useToast()


const {mutate, isPending, isSuccess:isUpdateSuccess, data: updatedProduct} = useMutation({
            mutationFn: createUpdateProductAction
        })

watch(isUpdateSuccess, (value)=>{
    if(!value) return //si el isUpdatedSuccess.value es false no hago nada

    toast.success('Producto actualizado correctamente')

    //TODO: redirección cuando se crea

    resetForm({
        //reestablezco los valores del formulario
        values: updatedProduct.value //updatedProduct es la data del useMutation
    })
    
})
~~~

- Podemos ocultar el botón para evitar un doble posteo
- Uso el isPending en el componente. Para ello lo retorno en la función setup
- ProductView.ts

~~~html
<button
    :disabled="isPending"
    type="submit"
    class="disabled:bg-gray-300 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
>Guardar
</button>
~~~

## Crear nuevo producto

- Copio el updateProduct de modules/products/actions/create-update-product.action.ts y la renombro a createProduct
- No es una petición patch sino post, el path es /products
- create-update-product.action.ts

~~~js
export const createUpdateProductAction =async (product: Partial<Product>)=>{
    if(product.id && product.id != ''){
        
        return await updateProduct(product)
    }   

    return await createProduct(product)
}

//updateProduct

const createProduct = async(product: Partial<Product>)=>{
    
    const images: string[]= product.images?.map(image=>{
      if(image.startsWith('http')){
        const imageName = image.split('/').pop() 
        
        
        return imageName ? image: '' 
      }  

      return image
    }) ?? []

    
    const productId = product.id
    delete product.id 
    delete product.user 
    product.images = images 

    try {
        const {data} = await tesloApi.post(`/products`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error creating product')
    }
} 
~~~

- En el AdminLayout es donde tengo el botón de Nuevo Producto

~~~js
<a class="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-200 rounded hover:bg-gray-300"
    href="#">
    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /> 
    </svg>
    <span class="ml-2 leading-none">Nuevo Producto</span>
</a>
~~~

- Cambiamos el anchor tag por un RouterLink
- Apunto a /admin/products/create. Le pongo algo como create porque necesita un id

~~~js
<RouterLink class="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-200 rounded hover:bg-gray-300"
to="/admin/products/create">
<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
</svg>
<span class="ml-2 leading-none">Nuevo Producto</span>
</RouterLink>
~~~

- Si clico en Nuevo Producto, en la pantalla de Products me da un 404
- Cuando estoy en un producto (editando) si me deja entrar, me cambia el url, el producto se queda en pantalla pero no se está volviendo a disparar la petición y demás
- Vayamos a la pantalla de Product, que cuando aprieto en Nuevo Producto no me deja entrar (error 404)
- En get-product-by-id.action.ts hago un console.log del id

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product } from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"
import { isAxiosError } from "axios"

export const getProductById =async (id: string)=>{
    
    //TODO: pensar la creación de un nuevo producto

    console.log({id})
    
    try {
        const {data} = await tesloApi.get<Product>(`/products/${id}`)
        
        
        return{
            ...data,
            images: data.images.map(getProductImageAction)
        }
    } catch (error) {
        console.log(error)

        throw new Error('Error obteniendo el producto')
    }
}
~~~

- En consola me muestra create
- De esta manera podemos determinar que cuando recibo create como id quiero crear un producto y si necesito entrar

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product } from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"

                                    //productId
export const getProductById =async (id: string) : Promise<Product>=>{
    
   if(id === 'create'){
    return {
        id: '',
        title: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        images: [],
        tags: [],
        sizes: [],
        gender: '' as any,
        user: {} as any
    }}
    
    try {
        const {data} = await tesloApi.get<Product>(`/products/${id}`)
        
        
        return{
            ...data,
            images: data.images.map(getProductImageAction)
        }
    } catch (error) {
        console.log(error)

        throw new Error('Error obteniendo el producto')
    }
}
~~~
- Si estoy en Products y clico Nuevo Producto aparece el formulario vacío
- Pero si clico en Nuevo Producto desde la pantalla de edición de un producto no pasa nada, porque no estoy reaccionando cuando ese argumento por el url cambia
- En admin/views/ProductView.ts (de ProductView.vue, que es la pantalla desde donde editamos el producto) tenemos que estar pendientes de ese argumento por el url
- Cuando este cambie tenemos que volver a disparar la petición del query (useQuery) basado en las props
- Uso un watch. Si accedes a una propiedad de un objeto (props, reactive) → usa función
- En el watch con isUpdateSuccess ya es un ref o computed, por lo que no hace falta usar ()=>
- El refectch del useQuery es para volver a ejecutar la función
- Si todo sale bien, debo redireccionar a la url de ese producto (desde el watch con isUpdateSucces)
- ProductView.ts

~~~js
//dentro del setup

const {data: product, isError, isLoading, refetch} = useQuery({
    queryKey: ['product', props.productId ],
    queryFn: ()=> getProductById(props.productId),
    retry: false //que no vuelva a intentarlo si falla
})

//Si accedes a una propiedad de un objeto (props, reactive) → usa función
watch(()=> props.productId, ()=>{
    refetch()
})

// isUpdateSuccess ya es un ref o computed, por lo que no hace falta usar ()=>
 watch(isUpdateSuccess, (value)=>{
    if(!value) return //si el isUpdatedSuccess.value es false no hago nada

    toast.success('Producto actualizado correctamente')

    //redirección, updatedProduct es la data del useMutation
    router.replace(`/admin/products/${updatedProduct.value.id}`)

    resetForm({
        values: updatedProduct.value //updatedProduct es la data del useMutation
    })
    
})
~~~

- Ahora si, si clico en Nuevo Producto desde la pantalla de edición de Producto se vacía todo el formulario
- Si agrego los campos al formulario y hago el posteo con Guardar, hace el posteo, en la url aparece el ID del producto y los campos del formulario se quedan con la información que he puesto (que ya está en la DB)

## Evitar duplicidad de código

- En la acción de create-update-product.action.ts tenemos código duplicado. Mejorémoslo

~~~js
import { tesloApi } from "@/api/tesloApi";
import type { Product } from "../interfaces/products-response.interface";

export const createUpdateProductAction =async (product: Partial<Product>)=>{
     const productId = product.id //aqui para tenerlo accesible
     product = clearProductForCreateObject(product) //lamo a la función

    if(productId && productId != ''){
        
        return await updateProduct(productId, product)
    }   

    return await createProduct(product)
}

const clearProductForCreateObject = (product: Partial<Product>)=>{
    const images: string[]= product.images?.map(image=>{
      if(image.startsWith('http')){
        const imageName = image.split('/').pop() 
        
       
        return imageName ? image: '' 
      }  

      return image
    }) ?? []

   
    const productId = product.id
    delete product.id 
    delete product.user 
    product.images = images 

    return product
} 
                            //le paso el productId
const updateProduct = async(productId: string, product: Partial<Product>)=>{

    try {

        const {data} = await tesloApi.patch(`/products/${productId}`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error updating product')
    }
} 

const createProduct = async(product: Partial<Product>)=>{

    try {
        const {data} = await tesloApi.post(`/products`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error creating product')
    }
} 
~~~ 

## File Selector - Mostrar imágenes antes de cargarlas

- Nos situamos en la página de producto, donde se edita, en un producto que ya tenga fotografías
- Si le doy a Subir Imagen me permite seleccionar cualquier cosa (pdfs, etc) de mi ordenador
- Me gustaría tener una pvista previa de los archivos en el navegador (donde se muestran las fotografías de los productos al editar)
- Hay otra cosa que pasa con los File Selectors que cuando lo vuelvo a tocar y cancelo, limpia los archivos que ya había cargado. No quiero que esto suceda
- El primer paso que necesito es poder alamecenar lo que sea que este File Selector selecciona
- En ProductView.ts creo una propiedad reactiva imageFiles
- No hace falta importar el tipo File, viene en Typescript
- ProuctView.ts

~~~js
//dentro del setup

const imageFiles = ref<File[]>([])

//lo retorno en el return del setup para poder usarla en ProductView.vue
~~~

- En ProductView.vue restringo que el input solo reciba imágenes

~~~js
<div class="col-span-2 my-2">
<label for="image" class="form-label">Subir imagen</label>

<input 
    @change="onFileChanged"
    accept="image/*"
    multiple 
    type="file" 
    id="image" 
    class="form-control" />
</div>
~~~

- Defino esta función en ProductView.ts dentro de la función setup y la retorno para pdoer usarla en ProductView.vue
- Recibe un evento de tipo Event (no hace falta importarlo)

~~~js
//dentro de setup

const imageFiles = ref<File[]>([])

const onFileChanged =(event: Event)=>{
    console.log({event})
}

//la retrono para usarla en el componente
~~~

- El evento trae los archivos

~~~js
const onFileChanged =(event: Event)=>{
    const fileInput = event.target as HTMLInputElement
    const fileList = fileInput.files
    console.log(fileList)
}
~~~

- Cuando he cargado variso archivos y vuelvo a darle al botón de subir archivo y cancelo me purga los archivos, vuelve a disparar el evento y pone el fileList con length:0
- Para mantener las imágenes previamente cargadas

~~~js
const onFileChanged =(event: Event)=>{
    const fileInput = event.target as HTMLInputElement
    const fileList = fileInput.files //los archivos seleccionados para cargar
    
    // si no he seleccionado nada y cancelo, return
    if( !fileList) return
    if(fileList.length === 0) return

    for(const imageFile of fileList){
        //lo que sea que seleccionemos lo irá metiendo en el arreglo
        imageFiles.value.push(imageFile)
    }
}
~~~

- Para mostrar las imágenes voy a ProductView.vue, al div donde se muestran las imágenes, y barro el imageFiles con un v-for

~~~html
<div class="first-col">
    <label for="stock" class="form-label">Imágenes</label>
    <!-- Row with scrollable horizontal -->
    <div class="flex p-2 overflow-x-auto space-x-8 w-full h-[265px] bg-gray-200 rounded">
    <div 
        v-for="image of images"
        :key="image.key"
        :alt="title"
    class="flex-shrink-0">
        <img :src="image.value" alt="imagen" class="w-[250px] h-[250px]" />
    </div>
    <div 
        v-for="imageFile of imageFiles "
        :key="imageFile.name"
        :alt="title"
    class="flex-shrink-0">
        <img :src="" alt="imagen" class="w-[250px] h-[250px]" />
    </div>
~~~

- Para el src de la imagen tenemos que crear una url. Será una función temporalImageUrl, la creo en ProductView.ts
- La puedo definir en el return del setup
- Uso URL de JavaScript para crear la URL que necesito 

~~~js
temporalImageUrl: (imageFile: File)=>{
    return URL.createObjectURL(imageFile)
}
~~~

- Puedo llamarla en el componente

~~~js
<div 
    v-for="imageFile of imageFiles "
    :key="imageFile.name"
    :alt="title"
    class="flex-shrink-0">
    <img :src="temporalImageUrl(imageFile)" class="w-[250px] h-[250px]" />
</div>
~~~

- Ahora si cargo dos fotos ya aparecen haciendo scroll horizontal en la vista previa
- Si vuelvo a clicar y cancelo, las fotos siguen ahi en la vista previa
- Si recargo el navegador si se eliminan
- Ahora debo pasarle las imágenes al mutation. Puedo elegir las imágenes a cargar, aquellas que no tengan http, porque significará que no están en el backend

## POSTMAN - Carga de imagen

- Abrimos POSTMAN
- Hay varias formas de cargar una imagen, y todo depende de cómo esté el backend configurado
- El backend sube las imágenes una por una
- Las coloca en el filesystem, que no sería el lugar correcto. Lo correcto sería la nube

> /api/files/product

- En Body/form-data selecciono una imagen (el backend solo me permite una)
- En la Key le pongo file. Es la llave que necesito 
- El backend nos regresa la secureUrl con "http://localhost:3000/api/files/product/9287392833.jpeg"
- Si copi la url y la pego en la barra de navegación de POSTMAN puedo visualizar la imagen que acabo de subir
- En creat-update-product.action.ts creo la función que luego mejoraré

~~~js
const uploadImage = async (images: string[] | File[])=>{
    const imageFile = images[0] as File

    try {
        const formData = new FormData() //creo el objeto formData
        formData.append('file', imageFile) //le paso el key y la imagen

        //obtengo la data del poste
        const {data}= await tesloApi.post<{secureUrl: string}>('/files/product', formData)

        return data.secureUrl //si va bien devuelvo la url de la imagen en el backend
    } catch (error) {
        console.log(error)
        throw new Error('Error uploading image')
    }
}
~~~

## Cargar imágenes al guardar producto

- tenemos que ver como ocnectamos todo esto. Como vamos a llamar la función, como vamos a recibir las imágenes, y a la función le falta una implementación todavía
- Vayamos al onSubmit, donde llamamos a llamar el mutate con los valores del formulario
- A mutate solo le podemos mandar un argumento (el segundo es el context)
- Ese único argumento es el que le pasamos a createUpdateProductAction
  - En product.images tenemos las imágenes que ya tenemos y también hay que colocar ahí los archivos que quiero subir
- ProductView.ts

~~~js
//dentro del setup

const onSubmit = handleSubmit(async (values)=>{

    const formValues = {
        ...values,
        images: [...values.images, ...imageFiles.value]
    }

    mutate(formValues)
})
~~~

- En create-update-product.action.ts necesito preparar mis imágenes

~~~js
export const createUpdateProductAction =async (product: Partial<Product>)=>{
     const productId = product.id 

     const newImages = await uploadImages(product.images ?? []) 

     product.images = newImages


     product = clearProductForCreateObject(product) 

    if(productId && productId != ''){
        
        return await updateProduct(productId, product)
    }   

    return await createProduct(product)
}


const uploadImages = async (images: string[] | File[])=>{
    const filesToUpload = images.filter(image=>image instanceof File) as File[]
    const currentImages = images.filter(image=>typeof image === 'string') as string[]

    const uploadPromises = filesToUpload.map(async(file)=>{
        try {
            const formData = new FormData()
            formData.append('file', file)
            const {data}= await tesloApi.post<{secureUrl: string}>('/files/product', formData)
    
            return data.secureUrl
        } catch (error) {
            console.log(error)
            throw new Error('Error uploading image')
        }
    })

    //necesito esperar que todas estas promesas se resuelvan
    const uploadedImages = await Promise.all(uploadPromises)

    return [...currentImages, ...uploadedImages]

}
~~~

- Paso algunos archivos completos importantes
- ProductView.vue

~~~vue
<template>
  <div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Producto: <small class="text-blue-500">{{  title }}</small></h1>
    <hr class="my-4" />
  </div>

  <form 
    @submit="onSubmit"
    class="grid grid-cols-1 sm:grid-cols-2 bg-white px-5 gap-5">
    <div class="first-col min-w-0">
      <!-- Primera parte del formulario -->
      <div class="mb-4">
        <label for="title" class="form-label">Título</label>
          <CustomInput 
          class="block w-full"
          v-model="title"
          v-bind="titleAttrs"
          :error="errors.title"
          />
      </div>

      <div class="mb-4">
        <label for="slug" class="form-label">Slug</label>
          <CustomInput 
          v-model="slug"
          v-bind="slugAttrs"
          :error="errors.slug"
          />
      </div>

      <div class="mb-4">
        <label for="description" class="form-label">Descripción</label>
       <CustomtextArea 
        v-model="description"
        v-bind="descriptionAttrs"
        :error="errors.description"
       />
      </div>

      <div class="flex flex-row gap-3">
        <div class="mb-4 flex-1">
          <label for="price" class="form-label">Precio</label>
            <CustomInput 
          v-model.number="price"
          v-bind="priceAttrs"
          :error="errors.price"
          />
        </div>

        <div class="mb-4 flex-1">
          <label for="stock" class="form-label">Inventario</label>
            <CustomInput 
          v-model.number="stock"
          v-bind="stockAttrs"
          :error="errors.stock"
          />
        </div>
      </div>

      <div class="mb-4 flex-1">
        <label for="sizes" class="form-label">Tallas</label>
        <div class="flex">
            <button 
                v-for="size of allSizes"
                :key="size"
                @click="toggleSize(size)"
                type="button" 
                :class="['p-2 rounded w-14 mr-2 flex-1',{
                  'bg-blue-500 text-white': hasSize(size),
                  'bg-blue-100': !hasSize(size)

                }]">
                {{ size }}
            </button>
        </div>
      </div>
    </div>

    <!-- Segunda columna -->
    <div class="first-col">
      <label for="stock" class="form-label">Imágenes</label>
      <!-- Row with scrollable horizontal -->
      <div class="flex p-2 overflow-x-auto space-x-8 w-full h-[265px] bg-gray-200 rounded">
        <div 
          v-for="image of images"
          :key="image.key"
          :alt="title"
        class="flex-shrink-0">
          <img :src="image.value" alt="imagen" class="w-[250px] h-[250px]" />
        </div>
        <div 
          v-for="imageFile of imageFiles "
          :key="imageFile.name"
          :alt="title"
        class="flex-shrink-0">
          <img :src="temporalImageUrl(imageFile)" class="w-[250px] h-[250px]" />
        </div>

        
      </div>
      <!-- Upload image -->
      <div class="col-span-2 my-2">
        <label for="image" class="form-label">Subir imagen</label>

        <input 
          @change="onFileChanged"
          accept="image/*"
          multiple 
          type="file" 
          id="image" 
          class="form-control" />
      </div>

      <div class="mb-4">
        <label for="stock" class="form-label">Género</label>
        <select
          v-model="gender"
          v-bind="genderAttrs" 
          class="form-control">
          <option value="">Seleccione</option>
          <option value="kid">Niño</option>
          <option value="women">Mujer</option>
          <option value="men">Hombre</option>
        </select>
        <span class="text-red-400" v-show="errors.gender">
          {{ errors.gender }}</span>
      </div>

      <!-- Botón para guardar -->
      <div class="my-4 text-right">
        <button
          :disabled="isPending"
          type="submit"
          class="disabled:bg-gray-300 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  </form>

  <div class="grid grid-cols-2">
  <pre class="bg-blue-300">
    {{ JSON.stringify(values,null, 2) }}
  </pre>
  <pre class="bg-red-300">
    {{ JSON.stringify(errors, null, 2) }}
  </pre>
  <pre class="bg-green-200 p-2 col-span-2">
    {{ JSON.stringify(meta, null, 2) }}
  </pre>
</div>
</template>

<script src="./ProductView.ts" lang="ts"></script>

<style scoped>
    @reference 'tailwindcss'
.form-label {
  @apply block text-gray-700 text-sm font-bold mb-2;
}

.form-control {
  @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
~~~

- ProductView.ts

~~~js
import { getProductById } from "@/modules/products/actions/get-product-by-id.action"
import { useMutation, useQuery } from "@tanstack/vue-query"
import { defineComponent, ref, watch, watchEffect } from "vue"
import { useRouter } from "vue-router"
import {useFieldArray, useForm} from 'vee-validate'
import * as yup from 'yup'
import CustomInput from "@/modules/common/components/CustomInput.vue"
import CustomTextArea from "@/modules/common/components/CustomTextArea.vue"
import { createUpdateProductAction } from "@/modules/products/actions/create-update-product.action"
import { useToast } from "vue-toastification"

const validationSchema = yup.object({
    title: yup.string().required().min(2),
    slug: yup.string().required(),
    description: yup.string().required(),
    price: yup.number().required(),
    stock: yup.number().min(1).required(),
    gender: yup.string().required().oneOf(['men', 'women', 'kid']),
})

export default defineComponent({
    components:{
        CustomInput,
        CustomTextArea
    },
    props:{
        productId:{
            type: String,
            required: true
        }
    },

    setup(props){

        const router = useRouter()
        const toast = useToast()

        //defineProps() solo funciona en el scriopt setup
        
        const {data: product, isError, isLoading, refetch} = useQuery({
            queryKey: ['product', props.productId ],
            queryFn: ()=> getProductById(props.productId),
            retry: false //que no vuelva a intentarlo si falla
        })

        const {mutate, isPending, isSuccess:isUpdateSuccess, data: updatedProduct} = useMutation({
            mutationFn: createUpdateProductAction
        })

        const {values, defineField, errors, handleSubmit, resetForm, meta} = useForm({
            validationSchema
        })

        const {fields: images} = useFieldArray<string>('images')
        const {fields: sizes, remove: removeSize, push: pushSize} = useFieldArray<string>('sizes')

        const toggleSize = (size: string)=>{
            const currentSizes = sizes.value.map(size=>size.value)
            const hasSize = currentSizes.includes(size)

            if(hasSize){ //si existe lo elimino
                removeSize(currentSizes.indexOf(size)) //hay que mandarle un índice para poderlo eliminar
            }else{
                pushSize(size)
            }        
        }

        const onSubmit = handleSubmit(async (values)=>{

            const formValues = {
                ...values,
                images: [...values.images, ...imageFiles.value]
            }

            mutate(formValues)
        })

        const [title, titleAttrs] = defineField('title')
        const [slug, slugAttrs] = defineField('slug')
        const [description, descriptionAttrs] = defineField('description')
        const [price, priceAttrs] = defineField('price')
        const [stock, stockAttrs] = defineField('stock')
        const [gender, genderAttrs] = defineField('gender')

        const imageFiles = ref<File[]>([])

        const onFileChanged =(event: Event)=>{
            const fileInput = event.target as HTMLInputElement
            const fileList = fileInput.files //los archivos seleccionados para cargar
            
            // si no he seleccionado nada y cancelo, return
            if( !fileList) return
            if(fileList.length === 0) return

            for(const imageFile of fileList){
                //lo que sea que seleccionemos lo irá metiendo en el arreglo
                imageFiles.value.push(imageFile)
            }
        }


        watchEffect(()=>{
            if(isError.value &&!isLoading.value){
                router.replace('/admin/products')
                return
            }
        })

        watch(product, ()=>{
            if(!product) return

            resetForm({
                values: product.value
            })
        }, {
            deep: true,
            immediate: true 
        })

        watch(isUpdateSuccess, (value)=>{
            if(!value) return //si el isUpdatedSuccess.value es false no hago nada

            toast.success('Producto actualizado correctamente')

            //redirección, updatedProduct es la data del useMutation
            router.replace(`/admin/products/${updatedProduct.value.id}`)

            resetForm({
                values: updatedProduct.value //updatedProduct es la data del useMutation
            })
            
        })

        //Si accedes a una propiedad de un objeto (props, reactive) → usa función
        watch(()=> props.productId, ()=>{
            refetch()
        })


        return{
            // Properties
            values,
            title, 
            titleAttrs,
            slug,
            slugAttrs,
            description,
            descriptionAttrs,
            price,
            priceAttrs,
            stock,
            stockAttrs,
            gender,
            genderAttrs,
            errors,
            images,
            sizes,
            meta,
            isPending,
            imageFiles,

            // Getters
            allSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            
            // Actions
            onSubmit,
            toggleSize,
            hasSize: (size: string)=>{
                const currentSizes = sizes.value.map(size=>size.value)

                return currentSizes.includes(size) //esto devuelve un booleano
            },
            onFileChanged,
            temporalImageUrl: (imageFile: File)=>{
                return URL.createObjectURL(imageFile)
            }
        }
    }
})
~~~

- create-update-product.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi";
import type { Product } from "../interfaces/products-response.interface";

export const createUpdateProductAction =async (product: Partial<Product>)=>{
     const productId = product.id 

     const newImages = await uploadImages(product.images ?? []) 

     product.images = newImages


     product = clearProductForCreateObject(product) 

    if(productId && productId != ''){
        
        return await updateProduct(productId, product)
    }   

    return await createProduct(product)
}

const clearProductForCreateObject = (product: Partial<Product>)=>{
    const images: string[]= product.images?.map(image=>{
      if(image.startsWith('http')){
        const imageName = image.split('/').pop() 
        
       
        return imageName ? image: '' 
      }  

      return image
    }) ?? []

   
    const productId = product.id
    delete product.id 
    delete product.user 
    product.images = images 

    return product
} 
                            //le paso el productId
const updateProduct = async(productId: string, product: Partial<Product>)=>{

    try {

        const {data} = await tesloApi.patch(`/products/${productId}`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error updating product')
    }
} 

const createProduct = async(product: Partial<Product>)=>{

    try {
        const {data} = await tesloApi.post(`/products`, product)

        return data
        
    } catch (error) {
        console.log(error)
        throw new Error('Error creating product')
    }
} 


const uploadImages = async (images: string[] | File[])=>{
    const filesToUpload = images.filter(image=>image instanceof File) as File[]
    const currentImages = images.filter(image=>typeof image === 'string') as string[]

    const uploadPromises = filesToUpload.map(async(file)=>{
        try {
            const formData = new FormData()
            formData.append('file', file)
            const {data}= await tesloApi.post<{secureUrl: string}>('/files/product', formData)
    
            return data.secureUrl
        } catch (error) {
            console.log(error)
            throw new Error('Error uploading image')
        }
    })

    //necesito esperar que todas estas promesas se resuelvan
    const uploadedImages = await Promise.all(uploadPromises)

    return [...currentImages, ...uploadedImages]

}
~~~

- get-product-by-id.action.ts

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product } from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"


export const getProductById =async (id: string) : Promise<Product>=>{
    
   if(id === 'create'){
    return {
        id: '',
        title: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        images: [],
        tags: [],
        sizes: [],
        gender: '' as any,
        user: {} as any
    }}
    
    try {
        const {data} = await tesloApi.get<Product>(`/products/${id}`)
        
        
        return{
            ...data,
            images: data.images.map(getProductImageAction)
        }
    } catch (error) {
        console.log(error)

        throw new Error('Error obteniendo el producto')
    }
}
~~~

- get-products-action.ts

~~~js
import { tesloApi } from "@/api/tesloApi"
import type { Product} from "../interfaces/products-response.interface"
import { getProductImageAction } from "./get-product-image.action"

export const getProductsAction =async (page: number=1, limit: number= 10)=>{
    try {
        
        const {data} = await tesloApi.get<Product[]>(`/products?limit=${limit}&offset=${page * limit}`)
        
        return data.map(product=>({
            ...product,
            images: product.images.map(getProductImageAction)}))

    } catch (error) {
        throw new Error('Error getting products')
    }
}
~~~

- ProductsView.vue

~~~vue
<template>

<div class="bg-white px-5 py-2 rounded">
    <h1 class="text-3xl">Productos</h1>
    <div class="py-8 w-full">
  <div class="shadow overflow-hidden rounded border-b border-gray-200">
    <table class="min-w-full bg-white">
      <thead class="bg-gray-800 text-white">
        <tr>
          <th class="w-10text-left py-3 px-4 uppercase font-semibold text-sm">Imagen</th>
          <th class="flex-1 text-left py-3 px-4 uppercase font-semibold text-sm">Título</th>
          <th class="w-28 text-left py-3 px-4 uppercase font-semibold text-sm">Precio</th>
          <th class="w-60 text-left py-3 px-4 uppercase font-semibold text-sm">Tallas</th>
        </tr>
      </thead>
    <tbody class="text-gray-700">
      <tr 
      v-for="(product, index) in products"
            :key="product.id"
            :class="{
                'bg-gray-100': index % 2 === 0 //coloco fondo gris en los pares
            }">
        <td class="text-left py-3 px-4">
            <img 
            class="h-10 w-10 object-cover"
            :src="product.images[0]" :alt="product.title" />
        </td>
        <td class="text-left py-3 px-4">
            <router-link 
                :to="`/admin/products/${product.id}`"
                class="hover:text-blue-500 hover:underline"
            >{{ product.title }}
            </router-link>
        </td>
        <td class="text-left py-3 px-4">
            <span class="bg-blue-200 text-blue-600 py-1 px-3 rounded-full text-xs">
                {{ product.price }}
            </span>
        </td>
        <td class="text-left py-3 px-4">
            {{ product.sizes.join(',') }}
        </td>
      </tr>
    </tbody>
    </table>
  </div>
  <ButtonPagination 
        :page="page"
        :has-more-data="!!products && products.length > 10"
    />
</div>    
</div>
</template>

<script lang="ts" setup>
import ButtonPagination from '@/modules/common/components/ButtonPagination.vue'
import { usePagination } from '@/modules/common/composables/use-pagination'
import { getProductsAction } from '@/modules/products/actions'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { watchEffect } from 'vue'

const queryClient = useQueryClient()
const {page} = usePagination()

const {data:products, isLoading} = useQuery({
  queryKey:['products', page],
  queryFn: ()=> getProductsAction(page.value),
})


watchEffect(()=>{
	queryClient.prefetchQuery({
		queryKey: ['products', {page: page.value +1}],
		queryFn: ()=> getProductsAction(page.value +1), 
	})
})
</script>
~~~

- AdminLayout.vue

~~~vue
<template>
<div class="flex w-screen h-screen text-gray-700">
            <div class="flex flex-col items-center w-16 pb-4 overflow-auto border-r border-gray-300">
                <a class="flex items-center justify-center flex-shrink-0 w-full h-16 bg-gray-300" href="#">
                    <svg class="w-8 h-8"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5"  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </a>
                <a class="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 mt-auto rounded hover:bg-gray-300" href="#">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </a>
            </div>
            <div class="flex flex-col w-56 border-r border-gray-300">
                <button class="relative text-sm focus:outline-none group">
                    <div class="flex items-center justify-between w-full h-16 px-4 border-b border-gray-300 hover:bg-gray-300">
                        <span class="font-medium">
                            Dropdown
                        </span> 
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="absolute z-10 flex-col items-start hidden w-full pb-1 bg-white shadow-lg group-focus:flex">
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                        <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                    </div>
                </button>
                
                <div class="flex flex-col flex-grow p-4 overflow-auto">
                    <RouterLink 
                        to="/admin"
                        class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Dashboard</span>
                    </RouterLink>
                    <RouterLink
                        to="/admin/products" 
                        class="flex items-center flex-shrink-0 h-10 px-2 text-sm font-medium rounded hover:bg-gray-300" href="#">
                        <span class="leading-none">Productos</span>
                    </RouterLink>

                    <RouterLink class="flex items-center flex-shrink-0 h-10 px-3 mt-auto text-sm font-medium bg-gray-200 rounded hover:bg-gray-300"
                        to="/admin/products/create">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span class="ml-2 leading-none">Nuevo Producto</span>
                    </RouterLink>
                </div>

            </div>
            <div class="flex flex-col flex-grow w-full">
                <div class="flex items-center flex-shrink-0 h-16 px-8 border-b border-gray-300 justify-between">
                    <h1 class="text-lg font-medium">{{ authStore.username }}</h1>
                    <div class="flex items-center ml-auto">
                        <button class="flex items-center justify-center h-10 px-4 text-sm font-medium rounded hover:bg-gray-300">
                            Action 1
                        </button>
                        <button class="flex items-center justify-center h-10 px-4 ml-2 text-sm font-medium bg-gray-200 rounded hover:bg-gray-300">
                            Action 2
                        </button>
                        <button class="relative ml-2 text-sm focus:outline-none group">
                            <div class="flex items-center justify-between w-10 h-10 rounded hover:bg-gray-300">
                                <svg class="w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </div>
                            <div class="absolute right-0 flex-col items-start hidden w-40 pb-1 bg-white border border-gray-300 shadow-lg group-focus:flex">
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                                <a class="w-full px-4 py-2 text-left hover:bg-gray-300" href="#">Menu Item 1</a>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="flex-grow p-6 overflow-auto bg-gray-200">
                   <router-view />
                </div>
            </div>
           

</div>

<a class="fixed flex items-center justify-center h-8 pr-2 pl-1 bg-blue-600 rounded-full bottom-0 right-0 mr-4 mb-4 shadow-lg text-blue-100 hover:bg-blue-600" href="https://twitter.com/lofiui" target="_top">
	<div class="flex items-center justify-center h-6 w-6 bg-blue-500 rounded-full">
		<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current r-jwli3a r-4qtqp9 r-yyyyoo r-16y2uox r-1q142lx r-8kz0gk r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue"><g><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></g></svg>
	</div>
	<span class="text-sm ml-1 leading-none">@lofiui</span>
</a>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/modules/auth/stores/auth.store';


    const authStore = useAuthStore()

</script>
~~~

-------