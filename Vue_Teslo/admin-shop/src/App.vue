<template>
  <full-screen-loader 
    v-if="authStore.isChecking"
  />
<router-view v-else/>
<vue-query-devtools />
</template>

<script lang="ts" setup>
  import { VueQueryDevtools} from '@tanstack/vue-query-devtools';
import { useAuthStore } from './modules/auth/stores/auth.store';
import FullScreenLoader from './modules/common/components/FullScreenLoader.vue';
import { AuthStatus } from './modules/auth/interfaces/auth-status.enum';
import { onMounted } from 'vue';


  const authStore = useAuthStore()
  
  onMounted(async () => {
  await authStore.checkAuthStatus()
})
</script>

