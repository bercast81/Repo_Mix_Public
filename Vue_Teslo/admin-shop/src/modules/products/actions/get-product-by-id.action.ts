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