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
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export {tesloApi}