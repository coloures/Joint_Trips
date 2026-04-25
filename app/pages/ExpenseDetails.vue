<template>
  <Page>
    <ActionBar :title="expense?.description || 'Детали расхода'" backgroundColor="#3b82f6" color="white">
      <ActionItem 
        android:position="actionBar" 
        text="❮ Назад"
        @tap="$navigateBack"
      />
      <ActionItem 
        android:position="actionBar" 
        text="✎"
        @tap="onEdit"
      />
    </ActionBar>

    <ScrollView>
      <StackLayout class="p-4">
        <!-- Основная информация -->
        <StackLayout class="info-card">
          <GridLayout columns="auto, *" class="info-row">
            <Label text="📝" col="0" class="icon-large" />
            <Label :text="expense?.description || 'Без описания'" col="1" class="description-text" textWrap="true" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="💰" col="0" class="icon-large" />
            <Label :text="`${expense?.amount.toLocaleString('ru-RU')} ${currencySymbol}`" col="1" class="amount-text" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="🏷️" col="0" class="icon-large" />
            <Label :text="categoryName" col="1" class="info-text" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="👤" col="0" class="icon-large" />
            <Label :text="`Оплатил: ${payerName}`" col="1" class="info-text" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="📅" col="0" class="icon-large" />
            <Label :text="formattedDate" col="1" class="info-text" />
          </GridLayout>

          <GridLayout v-if="expense?.description && expense.description !== expense?.description" columns="auto, *" class="info-row">
            <Label text="📌" col="0" class="icon-large" />
            <Label :text="expense?.description" col="1" class="info-text" textWrap="true" />
          </GridLayout>
        </StackLayout>

        <!-- Разделитель -->
        <StackLayout class="separator" />

        <!-- Распределение долгов -->
        <StackLayout class="allocations-section">
          <Label text="👥 Распределение" class="section-title" />
          
          <StackLayout v-for="allocation in allocations" :key="allocation.id" class="allocation-item">
            <GridLayout columns="auto, *, auto">
              <Label :text="getUserEmoji(allocation.user_id)" col="0" class="user-emoji" />
              <Label :text="getUserName(allocation.user_id)" col="1" class="user-name" />
              <Label :text="`${allocation.amount.toLocaleString('ru-RU')} ${currencySymbol}`" col="2" class="allocation-amount" />
            </GridLayout>
          </StackLayout>
        </StackLayout>

        <!-- Разделитель -->
        <StackLayout class="separator" />

        <!-- Кнопки действий -->
        <GridLayout columns="*, *" class="actions">
          <Button col="0" text="✏️ Редактировать" class="btn-primary" @tap="onEdit" />
          <Button col="1" text="🗑️ Удалить" class="btn-outline" @tap="onDelete" />
        </GridLayout>
        
        <StackLayout height="30" />
      </StackLayout>
    </ScrollView>

    <!-- Диалог редактирования -->
    <EditExpenseDialog 
      v-if="showEditDialog"
      :expense="expense"
      :tripId="tripId"
      @close="showEditDialog = false"
      @updated="onExpenseUpdated"
    />
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack } from 'nativescript-vue'
import { useExpenseStore } from '~/stores/expenseStore'
import { useUserStore } from '~/stores/userStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import type { Expense } from '~/models/expense'
import EditExpenseDialog from '~/components/EditExpenseDialog.vue'

const props = defineProps<{
  expenseId: number
  tripId: number
}>()

const expenseStore = useExpenseStore()
const userStore = useUserStore()
const expenseTypeStore = useExpenseTypeStore()
const currencyStore = useCurrencyStore()

const expense = computed<Expense | null>(() => {
  const allExpenses = expenseStore.getExpensesByTripId(props.tripId)
  return allExpenses.find(e => e.id === props.expenseId) || null
})
const showEditDialog = ref(false)

onMounted(() => {
  void expenseStore.loadAll()
  void expenseTypeStore.loadExpenseTypes()
})

const allocations = computed(() => {
  if (!expense.value) return []
  return expenseStore.getAllocationsByExpenseId(expense.value.id)
})

const currencySymbol = computed(() => {
  const currencyId = expense.value?.currency_id
  if (!currencyId) return '₽'
  return currencyStore.currencies.find(c => c.id === currencyId)?.symbol || '₽'
})

const categoryName = computed(() => {
  if (!expense.value) return ''
  const category = expenseTypeStore.getExpenseTypeById(expense.value.type_of_expense)
  return category?.name || 'Другое'
})

const payerName = computed(() => {
  if (!expense.value) return ''
  const user = userStore.getUserById(expense.value.user_id_pay)
  return user?.first_name || user?.first_name || `Пользователь ${expense.value.user_id_pay}`
})

const formattedDate = computed(() => {
  if (!expense.value) return ''
  const date = new Date(expense.value.date)
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
})

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId)
  return user?.first_name || user?.first_name || `Пользователь ${userId}`
}

const getUserEmoji = (userId: number) => {
  const emojis = ['👤', '👨', '👩', '🧑', '👧', '👦']
  return emojis[userId % emojis.length]
}

const onEdit = () => {
  showEditDialog.value = true
}

const onDelete = async () => {
  if (confirm('Удалить этот расход?')) {
    await expenseStore.deleteExpense(expense.value!.id)
    $navigateBack()
  }
}

const onExpenseUpdated = () => {
  showEditDialog.value = false
  // Обновляем данные
  // expense is computed from store state
}
</script>

<style scoped>
.p-4 {
  padding: 16;
}

.info-card {
  background-color: white;
  border-radius: 16;
  padding: 20;
  border-width: 1;
  border-color: #e5e7eb;
}

.info-row {
  margin-bottom: 16;
}

.icon-large {
  font-size: 24;
  margin-right: 16;
  width: 40;
}

.description-text {
  font-size: 18;
  font-weight: 600;
  color: #1f2937;
}

.amount-text {
  font-size: 24;
  font-weight: bold;
  color: #3b82f6;
}

.info-text {
  font-size: 16;
  color: #374151;
}

.separator {
  height: 1;
  background-color: #e5e7eb;
  margin: 20 0;
}

.allocations-section {
  background-color: white;
  border-radius: 16;
  padding: 16;
  border-width: 1;
  border-color: #e5e7eb;
}

.section-title {
  font-size: 18;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16;
}

.allocation-item {
  padding: 12;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
}

.user-emoji {
  font-size: 18;
  margin-right: 12;
}

.user-name {
  font-size: 16;
  color: #374151;
}

.allocation-amount {
  font-size: 16;
  font-weight: 500;
  color: #10b981;
}

.actions {
  margin-top: 8;
  gap: 16;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 14 24;
  border-radius: 10;
  font-size: 14;
  font-weight: 500;
  margin-right: 8;
}

.btn-outline {
  background-color: transparent;
  border-width: 1;
  border-color: #ef4444;
  color: #ef4444;
  padding: 14 24;
  border-radius: 10;
  font-size: 14;
  font-weight: 500;
  margin-left: 8;
}
</style>
