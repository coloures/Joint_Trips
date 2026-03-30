<template>
  <StackLayout class="debts-widget">
    <!-- Заголовок -->
    <GridLayout columns="*, auto" class="debts-header">
      <Label text="👥 Кто кому должен" class="section-title" />
      <Label 
        v-if="totalMyDebt > 0"
        :text="`Я должен: ${totalMyDebt.toLocaleString('ru-RU')} ₽`"
        class="my-debt-badge"
      />
    </GridLayout>

    <!-- Список долгов -->
    <StackLayout v-if="debts.length > 0" class="debts-list">
      <GridLayout 
        v-for="(debt, index) in debts" 
        :key="index"
        columns="auto, *, auto"
        class="debt-row"
      >
        <!-- Кто должен -->
        <Label 
          :text="getUserEmoji(debt.fromUserId)" 
          col="0" 
          class="user-emoji"
        />
        <Label 
          :text="getUserName(debt.fromUserId)" 
          col="1" 
          class="debtor-name"
        />

        <!-- Стрелка -->
        <Label text="→" col="1" class="arrow" />

        <!-- Кому должен -->
        <Label 
          :text="getUserEmoji(debt.toUserId)" 
          col="2" 
          class="user-emoji"
        />
        <Label 
          :text="getUserName(debt.toUserId)" 
          col="3" 
          class="creditor-name"
        />

        <!-- Сумма -->
        <Label 
          :text="`${debt.amount.toLocaleString('ru-RU')} ₽`"
          col="4" 
          class="debt-amount"
        />
      </GridLayout>
    </StackLayout>

    <!-- Пустое состояние -->
    <StackLayout v-else class="empty-state">
      <Label text="🎉" class="empty-icon" />
      <Label text="Все долги закрыты!" class="empty-text" />
    </StackLayout>

    <!-- Кнопка «Разобраться с долгами» (опционально) -->
    <Button 
      text="💸 Разобраться с долгами" 
      class="btn-primary-small"
      @tap="onSettleDebts"
    />
  </StackLayout>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import { useExpenseStore } from '~/stores/expenseStore'
import { useUserStore } from '~/stores/userStore'

const props = defineProps<{
  tripId: number
}>()

const expenseStore = useExpenseStore()
const userStore = useUserStore()

// Получаем все долги по поездке
const debts = computed(() => expenseStore.calculateDebts(props.tripId))

// Сколько я должен всего (для текущего пользователя)
const currentUserId = 2 // TODO: потом заменишь на authStore.getCurrentUserId()
const totalMyDebt = computed(() => {
  return debts.value
    .filter(d => d.fromUserId === currentUserId)
    .reduce((sum, d) => sum + d.amount, 0)
})

// Вспомогательные функции
const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId)
  return user?.first_name || `Пользователь ${userId}`
}

const getUserEmoji = (userId: number) => {
  const emojis = ['👨', '👩', '🧔', '👧', '👦', '🧑‍🚀']
  return emojis[userId % emojis.length]
}

// Простое действие (можно потом расширить)
const onSettleDebts = () => {
  console.log('🔧 Разбираемся с долгами... (здесь можно открыть модалку или перейти на экран расчетов)')
  // Пример: alert или навигация
  // $navigateTo(DebtsSettlementPage, { props: { tripId: props.tripId } })
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

.debts-header {
  align-items: center;
  margin-bottom: 12;
}

.section-title {
  font-size: 16;
  font-weight: 600;
  color: #1f2937;
}

.my-debt-badge {
  background-color: #ef4444;
  color: white;
  font-size: 12;
  padding: 4 10;
  border-radius: 9999;
  font-weight: 500;
}

.debts-list {
  margin-bottom: 16;
}

.debt-row {
  padding: 10 0;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
}

.user-emoji {
  font-size: 22;
  width: 32;
  margin-right: 8;
}

.debtor-name,
.creditor-name {
  font-size: 15;
  color: #374151;
}

.arrow {
  font-size: 18;
  color: #9ca3af;
  margin-horizontal: 8;
  text-align: center;
}

.debt-amount {
  font-size: 16;
  font-weight: 600;
  color: #ef4444;
  text-align: right;
}

.empty-state {
  align-items: center;
  padding: 24 0;
}

.empty-icon {
  font-size: 48;
  margin-bottom: 8;
}

.empty-text {
  font-size: 14;
  color: #6b7280;
  text-align: center;
}

.btn-primary-small {
  background-color: #3b82f6;
  color: white;
  padding: 10 16;
  border-radius: 9999;
  font-size: 14;
  font-weight: 500;
  align-self: center;
}
</style>