<template>
  <h1 class="text-2xl font-semibold mb-4">Register</h1>
  <form @submit.prevent="onRegister">
    <!-- Username Input -->
    <div class="mb-4">
      <label for="username" class="block text-gray-600">Usuario</label>
      <input
        v-model="MyForm.fullName"
        ref="fullNameInputRef"
        type="text"
        id="username"
        name="username"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!--email-->
    <div class="mb-4">
      <label for="email" class="block text-gray-600">Correo</label>
      <input
        v-model="MyForm.email"
        ref="emailInputRef"
        type="email"
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
        v-model="MyForm.password"
        ref="passwordInputRef"
        type="password"
        id="password"
        name="password"
        class="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
        autocomplete="off"
      />
    </div>
    <!-- Forgot Password Link -->
    <div class="mb-6 text-blue-500">
      <a href="#" class="hover:underline">¿Olvidaste la contraseña?</a>
    </div>
    <!-- Register Button -->
    <button
      type="submit"
      class="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
    >
      Ingresar
    </button>
  </form>
  <!-- Sign up  Link -->
  <div class="mt-6 text-blue-500 text-center">
    <RouterLink :to="{ name: 'login' }" class="hover:underline">Login</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const emailInputRef = ref<HTMLInputElement| null>(null)
const passwordInputRef = ref<HTMLInputElement| null>(null)
const fullNameInputRef = ref<HTMLInputElement | null>(null)
const toast = useToast()

const MyForm= reactive({
  fullName: '',
  email: '',
  password: ''
})

  const authStore = useAuthStore()

  const onRegister = async ()=>{
      if(MyForm.email === ''){
    return emailInputRef.value?.focus()
  }

  if(MyForm.password.length < 6){
    return passwordInputRef.value?.focus()
  }

  if(MyForm.fullName === ''){
    return fullNameInputRef.value?.focus()
  }

  const {ok, message} = await authStore.register(MyForm.fullName, MyForm.email, MyForm.password)

  if(ok) return

  toast.error(message)

  }

</script>