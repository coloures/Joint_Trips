<template>
  <Frame>
    <component :is="currentPage" />
  </Frame>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'nativescript-vue'
import Home from '~/pages/Home.vue'
import Login from '~/pages/Login.vue'
import { useUserStore } from '~/stores/userStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useNotificationStore } from '~/stores/notificationStore'

const userStore = useUserStore()
const currencyStore = useCurrencyStore()
const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const expenseTypeStore = useExpenseTypeStore()
const notificationStore = useNotificationStore()
const currentPage = computed(() => (userStore.isAuthenticated ? Home : Login))

onMounted(() => {
  void currencyStore.loadCurrencies()
  void tripStore.loadTrips()
  void tripMemberStore.loadTripMembers()
  void expenseTypeStore.loadExpenseTypes()
  void expenseStore.loadAll()
})

watch(
  () => userStore.currentUserId,
  (userId) => {
    if (!userId) return
    void notificationStore.loadNotificationsByUserId(userId)
  },
  { immediate: true }
)
</script>
