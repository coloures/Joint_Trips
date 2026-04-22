<template>
  <StackLayout class="debts-widget">
    <!-- Красная плашка "Я должен" -->
    <StackLayout class="debt-header" v-if="totalMyDebt > 0">
      <Label 
        :text="`Я должен: ${totalMyDebt.toLocaleString('ru-RU')} ${currencySymbol}`"
        class="header-text"
      />
    </StackLayout>

    <!-- Список долгов -->
    <StackLayout class="debts-list">
      <StackLayout 
        v-for="(debt, index) in debts" 
        :key="index"
        class="debt-row"
      >
        <GridLayout columns="*, auto, *" class="debt-inner">
          <!-- Левая часть: должник -->
          <StackLayout col="0" orientation="horizontal" class="left-part">
            <Label 
              :text="getUserName(debt.fromUserId)" 
              class="debtor-name"
            />
          </StackLayout>

          <!-- Сумма ПО ЦЕНТРУ -->
          <Label 
            col="1"
            :text="`${debt.amount.toLocaleString('ru-RU')} ${currencySymbol}`"
            class="debt-amount"
          />

          <!-- Правая часть: кому должен -->
          <StackLayout col="2" orientation="horizontal" class="right-part">
            <Label 
              :text="getUserName(debt.toUserId)" 
              class="creditor-name"
            />
          </StackLayout>
        </GridLayout>
      </StackLayout>
    </StackLayout>

    <!-- Пустое состояние -->
    <StackLayout v-if="debts.length === 0" class="empty-state">
      <Label text="🎉" class="empty-icon" />
      <Label text="Все долги закрыты!" class="empty-text" />
    </StackLayout>

    <!-- Большая синяя кнопка -->
    <Button 
      text="💸 Разобраться с долгами" 
      class="btn-settle"
      @tap="onSettleDebts"
    />
  </StackLayout>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import { useExpenseStore } from '~/stores/expenseStore'
import { useTripStore } from '~/stores/tripStore'
import { useUserStore } from '~/stores/userStore'
import { useCurrencyStore } from '~/stores/currencyStore'

const props = defineProps<{
  tripId: number
}>()

const expenseStore = useExpenseStore()
const tripStore = useTripStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

const debts = computed(() => expenseStore.calculateDebts(props.tripId))

const trip = computed(() => tripStore.getTripById(props.tripId))

const currencySymbol = computed(() => {
  const currencyId = trip.value?.currency_id
  if (!currencyId) return '₽'
  return currencyStore.currencies.find(c => c.id === currencyId)?.symbol || '₽'
})

const currentUserId = computed(() => userStore.currentUserId)

const totalMyDebt = computed(() => {
  if (!currentUserId.value) return 0
  return debts.value
    .filter(d => d.fromUserId === currentUserId.value)
    .reduce((sum, d) => sum + d.amount, 0)
})

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId)
  return user?.first_name || `Пользователь ${userId}`
}

const onSettleDebts = () => {
  console.log('💸 Разбираемся с долгами...')
}
</script>

<style scoped>
.debts-widget {
  background-color: white;
  border-radius: 16;
  padding: 16;
  margin-bottom: 16;
  border-width: 1;
  border-color: #e5e7eb;
}

.debt-header {
  background-color: #ef4444;
  border-radius: 9999;
  padding: 10 20;
  margin-bottom: 16;
}

.header-text {
  color: white;
  font-size: 16;
  font-weight: 600;
  text-align: center;
}

.debts-list {
  margin-bottom: 16;
}

.debt-row {
  padding: 10 0;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
}

.debt-inner {
  align-items: center;
}

.left-part,
.right-part {
  flex-direction: row;
  align-items: center;
  max-width: 40%;
}

.avatar {
  font-size: 26;
  margin-right: 8;
  width: 32;
  flex-shrink: 0;
}

.debtor-name,
.creditor-name {
  font-size: 15;
  color: #374151;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 120;
}

.debt-amount {
  font-size: 16;
  font-weight: 700;
  color: #ef4444;
  text-align: center;
  padding: 0 8;
  min-width: 60;
  white-space: nowrap;
}

.empty-state {
  align-items: center;
  padding: 30 0;
}

.empty-icon {
  font-size: 48;
  margin-bottom: 8;
}

.empty-text {
  font-size: 15;
  color: #6b7280;
}

.btn-settle {
  background-color: #3b82f6;
  color: white;
  font-size: 16;
  font-weight: 600;
  padding: 14 20;
  border-radius: 9999;
  height: 52;
}
</style>
