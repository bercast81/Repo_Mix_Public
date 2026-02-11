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