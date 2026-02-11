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