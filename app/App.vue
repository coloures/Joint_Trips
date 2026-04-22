<template>
  <Frame>
    <component :is="currentPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'nativescript-vue'
import Home from '~/pages/Home.vue'
import Login from '~/pages/Login.vue'
import { useUserStore } from '~/stores/userStore'
import { useCurrencyStore } from '~/stores/currencyStore'

const userStore = useUserStore()
const currencyStore = useCurrencyStore()
const currentPage = computed(() => (userStore.isAuthenticated ? Home : Login))

onMounted(() => {
  // Keep currency symbols available for all screens (budgets, expenses, debts).
  void currencyStore.loadCurrencies()
})
</script>
