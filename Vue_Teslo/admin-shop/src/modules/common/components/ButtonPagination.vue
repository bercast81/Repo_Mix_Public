<template>
    <div class="flex justify-center py-10 bg-gray-100 space-x-3">
        <button 
        class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="page == 1"
        @click="$router.push({query: {page: page-1}})"
        >
            <ChevronLeft />
            <span class="text-white text-lg">Anteriores</span>
        </button>
        
        <button class="flex items-center space-x-1.5 rounded-lg px-4 py-1.5 
        bg-blue-500 disabled:bg-gray-300 hover:bg-blue-600"
        :disabled="hasMoreData"
        @click="$router.push({query: {page: page +1}})"
        >
            <span class="text-white text-lg">Siguientes</span>
            <ChevronRight />
        </button>

    </div>
</template>

<script setup lang="ts">
import ChevronLeft from '@/icons/ChevronLeft.vue';
import ChevronRight from '@/icons/ChevronRight.vue';

interface Props{
    page: number
    hasMoreData: boolean
}

defineProps<Props>()

</script>