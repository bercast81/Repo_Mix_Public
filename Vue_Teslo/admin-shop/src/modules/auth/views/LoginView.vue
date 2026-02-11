<template>
  <h1 class="text-2xl font-semibold mb-4">Login</h1>
  <form @submit.prevent="onLogin">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="email" class="block text-gray-600">Correo</label>
      <input
        ref="emailInputRef"
        v-model="MyForm.email"
        type="text"
        id="email"
        name="email"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Password Input -->
    <div class="mb-4">
      <label for="password" class="block text-gray-600">Contraseña</label>
      <input
        ref="passwordInputRef"
        v-model="MyForm.password"
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Remember Me Checkbox -->
    <div class="mb-4 flex items-center">
      <input 
      v-model="MyForm.rememberMe"
      type="checkbox" id="remember" name="remember" class="text-blue-500" />
      <label for="remember" class="text-gray-600 ml-2">Recordar Usuario</label>
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">¿Olvidaste la contraseña?</a>
    </div>
    <!-- Login Button -->
    <button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Login
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'register' }" class="hover:underline">Regístrate aquí</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const router = useRouter();
const authStore = useAuthStore()
const emailInputRef = ref<HTMLInputElement| null>(null)
const passwordInputRef = ref<HTMLInputElement| null>(null)
const toast = useToast()


const MyForm = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const onLogin = async() => {

  if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.rememberMe){
    localStorage.setItem('email', MyForm.email )
  }else{
    localStorage.removeItem('email')
  }

  const ok = await authStore.login(MyForm.email, MyForm.password)

  if(ok){
    const lastPath = localStorage.getItem('lastPath') ?? '/';

    router.replace(lastPath);
    return
  }

  toast.error('Usuario/Contraseña no son correctos')

  watchEffect(()=>{
    const email = localStorage.getItem('email')
    if(email){
      MyForm.email = email
      MyForm.rememberMe= true
    }
  })
};
</script>
