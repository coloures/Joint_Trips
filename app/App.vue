<template>
  <Frame>
    <component :is="currentPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import Home from '~/pages/Home.vue'
import Login from '~/pages/Login.vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
const currentPage = computed(() => (userStore.isAuthenticated ? Home : Login))
</script>
