<template>
  <Page>
    <ActionBar :title="trip?.title || 'Поездка'" backgroundColor="#3b82f6" color="white">
      <ActionItem 
        android:position="actionBar" 
        text="❮ Назад"
        @tap="$navigateBack"
      /> 
    </ActionBar>

    <ScrollView>
      <StackLayout class="p-4">
        <!-- Основная информация -->
        <StackLayout class="info-block">
          <Label :text="`${trip?.emoji} ${trip?.title}`" class="title" />
          <Label :text="trip?.country" class="subtitle" />

          <GridLayout columns="auto, *" class="info-row">
            <Label text="📅" col="0" class="icon" />
            <Label :text="formattedDates" col="1" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="💰" col="0" class="icon" />
            <Label :text="formattedBudget" col="1" />
          </GridLayout>

          <GridLayout columns="auto, *" class="info-row">
            <Label text="👥" col="0" class="icon" />
            <Label :text="`${participantsCount} участников`" col="1" />
          </GridLayout>

          <Label 
            v-if="trip?.description" 
            :text="trip.description" 
            class="description"
            textWrap="true"
          />
        </StackLayout>

        <!-- Разделитель -->
        <StackLayout class="separator" />

        <!-- 🔹 Бюджетный виджет -->
        <StackLayout class="budget-widget">
          <Label text="💰 Бюджет поездки" class="section-title" />
          
          <GridLayout columns="*, *" class="budget-stats">
            <StackLayout class="stat-card">
              <Label text="Общий бюджет" class="stat-label" />
              <Label :text="`${totalBudget.toLocaleString('ru-RU')} ₽`" class="stat-value" />
            </StackLayout>
            <StackLayout class="stat-card">
              <Label text="Потрачено" class="stat-label" />
              <Label :text="`${totalExpenses.toLocaleString('ru-RU')} ₽`" class="stat-value" />
            </StackLayout>
          </GridLayout>
          
          <GridLayout columns="*, *" class="budget-stats">
            <StackLayout class="stat-card">
              <Label text="Осталось" class="stat-label" />
              <Label :text="`${remainingBudget.toLocaleString('ru-RU')} ₽`" 
                     :class="remainingBudget >= 0 ? 'stat-value positive' : 'stat-value negative'" />
            </StackLayout>
            <StackLayout class="stat-card">
              <Label text="Использовано" class="stat-label" />
              <Label :text="`${usagePercentage.toFixed(0)}%`" class="stat-value" />
            </StackLayout>
          </GridLayout>
          
          <Progress :value="usagePercentage" :maxValue="100" class="budget-progress" />
        </StackLayout>

        <!-- Разделитель -->
        <StackLayout class="separator" />

        <!-- 🔹 Расходы -->
        <StackLayout class="expenses-section">
          <StackLayout>
            <Label text="📝 Последние расходы" class="section-title" />
          </StackLayout>
          
          <StackLayout v-if="recentExpenses.length > 0" class="expenses-list">
            <ExpenseCard 
              v-for="expense in recentExpenses" 
              :key="expense.id"
              :expense="expense"
              :currentUserId="currentUserId"
              @tap="openExpenseDetails"
            />
          </StackLayout>
          
          <StackLayout v-else class="empty-expenses">
            <Label text="💰" class="empty-icon" />
            <Label text="Нет расходов" class="empty-text" />
            <Button text="+ Добавить расход" class="btn-add" @tap="showAddExpense" />
          </StackLayout>
        </StackLayout>

        <!-- Разделитель -->
        <StackLayout class="separator" />

        <!-- 🔹 Кнопки действий -->
        <GridLayout columns="*, *" class="actions" rows="auto">
          <Button col="0" text="✏️ Редактировать" class="btn-primary" @tap="onEdit" />
          <Button col="1" text="🗑️ Удалить" class="btn-outline" @tap="onDelete" />
        </GridLayout>
        
        <!-- Отступ снизу -->
        <StackLayout height="30" />
      </StackLayout>
    </ScrollView>

    <!-- Диалог добавления расхода -->
    <AddExpenseDialog 
      v-if="showAddDialog"
      :tripId="tripId"
      @close="showAddDialog = false"
      @added="onExpenseAdded"
    />
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useUserStore } from '~/stores/userStore'
import type { Trip } from '~/models/trip'
import ExpenseCard from '~/components/UI/ExpenseCard.vue'
import AddExpenseDialog from '~/components/AddExpenseDialog.vue'
import { StackLayout } from '@nativescript/core'

const props = defineProps<{
  tripId: number
}>()

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const userStore = useUserStore()

const trip = ref<Trip | null>(null)
const showAddDialog = ref(false)
const currentUserId = ref(2) // TODO: взять из authStore

onMounted(() => {
  trip.value = tripStore.getTripById(props.tripId)
})

// Основная информация
const formattedDates = computed(() => {
  if (!trip.value) return ''
  const start = new Date(trip.value.startDate).toLocaleDateString('ru-RU')
  const end = new Date(trip.value.endDate).toLocaleDateString('ru-RU')
  return `${start} — ${end}`
})

const formattedBudget = computed(() => {
  if (!trip.value) return ''
  return `${trip.value.budget.toLocaleString('ru-RU')} ₽`
})

const participantsCount = computed(() => {
  if (!trip.value) return 0
  return tripMemberStore.getTripMembersByTripId(trip.value.id).length
})

// Бюджет
const totalBudget = computed(() => trip.value?.budget || 0)
const totalExpenses = computed(() => {
  return expenseStore.getTotalExpensesByTripId(props.tripId)
})

const remainingBudget = computed(() => {
  return totalBudget.value - totalExpenses.value
})

const usagePercentage = computed(() => {
  return totalBudget.value === 0 ? 0 : (totalExpenses.value / totalBudget.value) * 100
})

// Расходы (последние 5)
const recentExpenses = computed(() => {
  const allExpenses = expenseStore.getExpensesByTripId(props.tripId)
  return [...allExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5)
})

// Действия
const onEdit = () => {
  console.log('Редактировать:', trip.value?.id)
}

const onDelete = () => {
  if (trip.value && confirm('Удалить эту поездку?')) {
    tripStore.deleteTrip(trip.value.id)
    $navigateBack()
  }
}

const showAddExpense = () => {
  showAddDialog.value = true
}

const openExpenseDetails = (expenseId: number) => {
  // TODO: открыть детали расхода
  console.log('Открыть расход:', expenseId)
}

const onExpenseAdded = () => {
  showAddDialog.value = false
  // Данные обновятся автоматически через computed
}
</script>

<style scoped>
.p-4 {
  padding: 16;
}

/* Блоки */
.info-block {
  margin-bottom: 8;
}

/* Заголовки */
.title {
  font-size: 24;
  font-weight: bold;
  margin-bottom: 8;
}

.subtitle {
  font-size: 18;
  color: #6b7280;
  margin-bottom: 20;
}

.info-row {
  margin-bottom: 12;
  padding: 4 0;
}

.icon {
  font-size: 18;
  margin-right: 12;
  width: 32;
}

.description {
  font-size: 16;
  color: #374151;
  margin-top: 20;
  margin-bottom: 8;
  padding: 12;
  background-color: #f9fafb;
  border-radius: 8;
}

/* Разделитель */
.separator {
  height: 1;
  background-color: #e5e7eb;
  margin: 20 0;
}

/* Бюджетный виджет */
.budget-widget {
  background-color: white;
  border-radius: 16;
  padding: 16;
  margin-bottom: 8;
  border-width: 1;
  border-color: #e5e7eb;
}

.section-title {
  font-size: 18;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16;
}

.budget-stats {
  margin-bottom: 16;
}

.stat-card {
  padding: 12;
  background-color: #f9fafb;
  border-radius: 12;
  margin: 4;
}

.stat-label {
  font-size: 12;
  color: #6b7280;
  margin-bottom: 4;
}

.stat-value {
  font-size: 20;
  font-weight: bold;
  color: #1f2937;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.budget-progress {
  margin-top: 8;
  height: 8;
  border-radius: 4;
  background-color: #e5e7eb;
}

/* Расходы */
.expenses-section {
  margin-bottom: 8;
}

.section-header {
  margin-bottom: 16;
  align-items: center;
  padding: 0 0 8 0;
  border-bottom-width: 1;
  border-bottom-color: #e5e7eb;
}

.link-btn {
  background-color: transparent;
  color: #3b82f6;
  font-size: 14;
  padding: 4 8;
  border-width: 0;
}

.expenses-list {
  margin-top: 8;
  margin-bottom: 8;
}

/* Карточки расходов */
.expenses-list > * {
  margin-bottom: 12;
}

.empty-expenses {
  align-items: center;
  padding: 40;
  background-color: #f9fafb;
  border-radius: 12;
  margin-top: 8;
}

.empty-icon {
  font-size: 48;
  margin-bottom: 12;
}

.empty-text {
  font-size: 14;
  color: #9ca3af;
  margin-bottom: 12;
  text-align: center;
}

.btn-add {
  background-color: #3b82f6;
  color: white;
  padding: 10 20;
  border-radius: 8;
  font-size: 14;
}

/* Кнопки действий */
.actions {
  margin-top: 8;
  margin-bottom: 8;
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