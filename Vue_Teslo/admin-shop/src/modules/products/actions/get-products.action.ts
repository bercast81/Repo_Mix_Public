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